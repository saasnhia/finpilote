import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeFournisseur, PCG_COMPTES, suggestCategorization } from '@/lib/categorization/matcher'
import { logAutomation } from '@/lib/automation/log'
import type { CategorizationRule } from '@/lib/categorization/matcher'

/**
 * POST /api/categorization/learn/batch
 * Scanne toutes les factures déjà catégorisées (compte_comptable non null)
 * et crée/consolide les règles d'apprentissage correspondantes.
 * Retourne le nombre de règles créées/mises à jour.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch all invoices with fournisseur + compte_comptable already set
    const { data: factures, error: facturesError } = await supabase
      .from('factures')
      .select('id, fournisseur, compte_comptable, code_tva, categorie')
      .eq('user_id', user.id)
      .not('fournisseur', 'is', null)
      .not('compte_comptable', 'is', null)

    if (facturesError) {
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    if (!factures || factures.length === 0) {
      return NextResponse.json({
        success: true,
        created: 0,
        updated: 0,
        message: 'Aucune facture catégorisée trouvée',
      })
    }

    // Load existing rules
    const { data: existingRules } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('user_id', user.id)

    const rules = (existingRules ?? []) as CategorizationRule[]
    const ruleMap = new Map(rules.map(r => [r.fournisseur_pattern, r]))

    // Aggregate: for each unique (fournisseur_pattern, compte_comptable), count occurrences
    type AggKey = string
    const agg = new Map<AggKey, {
      fournisseur: string
      fournisseur_pattern: string
      compte_comptable: string
      code_tva: string
      categorie: string | null
      count: number
    }>()

    for (const f of factures) {
      if (!f.fournisseur || !f.compte_comptable) continue
      const pattern = normalizeFournisseur(f.fournisseur)
      const key: AggKey = `${pattern}||${f.compte_comptable}`

      const existing = agg.get(key)
      if (existing) {
        existing.count++
      } else {
        agg.set(key, {
          fournisseur: f.fournisseur,
          fournisseur_pattern: pattern,
          compte_comptable: f.compte_comptable,
          code_tva: f.code_tva ?? 'TVA20',
          categorie: f.categorie ?? null,
          count: 1,
        })
      }
    }

    let created = 0
    let updated = 0

    for (const entry of agg.values()) {
      const existing = ruleMap.get(entry.fournisseur_pattern)

      if (existing) {
        // Update if the compte_comptable matches or if count is higher (majority wins)
        if (existing.compte_comptable === entry.compte_comptable) {
          await supabase
            .from('categorization_rules')
            .update({
              match_count: existing.match_count + entry.count,
              source: 'learned',
            })
            .eq('id', existing.id)
          updated++
        }
        // If compte differs, keep existing rule (user may have manually overridden)
      } else {
        // Create new rule
        const compte_label = PCG_COMPTES[entry.compte_comptable] ?? null
        const { data: newRule } = await supabase
          .from('categorization_rules')
          .insert({
            user_id: user.id,
            fournisseur_pattern: entry.fournisseur_pattern,
            fournisseur_display: entry.fournisseur,
            compte_comptable: entry.compte_comptable,
            compte_label,
            code_tva: entry.code_tva,
            categorie: entry.categorie,
            is_active: true,
            match_count: entry.count,
            confidence: Math.min(70 + entry.count * 5, 95), // grows with usage
            source: 'learned',
          })
          .select()
          .single()

        if (newRule) {
          created++
          await logAutomation({
            userId: user.id,
            actionType: 'rule_learned',
            entityType: 'rule',
            entityId: newRule.id,
            metadata: {
              fournisseur: entry.fournisseur,
              compte_comptable: entry.compte_comptable,
              match_count: entry.count,
              source: 'batch',
            },
            isReversible: false,
          })
        }
      }
    }

    // Apply suggestions to invoices without compte_comptable
    const { data: uncat } = await supabase
      .from('factures')
      .select('id, fournisseur')
      .eq('user_id', user.id)
      .not('fournisseur', 'is', null)
      .is('compte_comptable', null)

    const allRules = (
      await supabase
        .from('categorization_rules')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
    ).data as CategorizationRule[] | null

    let autoApplied = 0
    if (uncat && allRules && allRules.length > 0) {
      for (const f of uncat) {
        if (!f.fournisseur) continue
        const suggestion = suggestCategorization(f.fournisseur, allRules)
        if (suggestion && suggestion.confidence >= 90) {
          await supabase
            .from('factures')
            .update({
              compte_comptable: suggestion.compte_comptable,
              code_tva: suggestion.code_tva,
            })
            .eq('id', f.id)
            .eq('user_id', user.id)

          await logAutomation({
            userId: user.id,
            actionType: 'categorization_applied',
            entityType: 'facture',
            entityId: f.id,
            ruleId: suggestion.rule_id,
            metadata: {
              fournisseur: f.fournisseur,
              compte_comptable: suggestion.compte_comptable,
              confidence: suggestion.confidence,
              source: 'batch',
            },
            isReversible: true,
          })
          autoApplied++
        }
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      auto_applied: autoApplied,
      message: `${created} règles créées, ${updated} mises à jour, ${autoApplied} factures catégorisées automatiquement`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
