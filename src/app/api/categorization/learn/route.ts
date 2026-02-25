import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeFournisseur, PCG_COMPTES } from '@/lib/categorization/matcher'
import { logAutomation } from '@/lib/automation/log'
import { requirePlanFeature, isAuthed } from '@/lib/auth/require-plan'

/**
 * POST /api/categorization/learn
 * Apprend d'un choix utilisateur : crée ou met à jour une règle,
 * et met à jour la facture avec le compte comptable choisi.
 *
 * Body: {
 *   facture_id: string
 *   fournisseur: string
 *   compte_comptable: string
 *   code_tva?: string
 *   categorie?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePlanFeature('categorization_rules')
    if (!isAuthed(auth)) return auth

    const supabase = await createClient()

    const body = await req.json() as {
      facture_id: string
      fournisseur: string
      compte_comptable: string
      code_tva?: string
      categorie?: string
    }

    const { facture_id, fournisseur, compte_comptable, code_tva, categorie } = body

    if (!facture_id || !fournisseur || !compte_comptable) {
      return NextResponse.json(
        { error: 'Paramètres manquants: facture_id, fournisseur, compte_comptable' },
        { status: 400 }
      )
    }

    const fournisseur_pattern = normalizeFournisseur(fournisseur)
    const compte_label = PCG_COMPTES[compte_comptable] ?? null

    // Upsert rule (increment match_count on conflict)
    const { data: rule, error: upsertError } = await supabase
      .from('categorization_rules')
      .upsert(
        {
          user_id: auth.userId,
          fournisseur_pattern,
          fournisseur_display: fournisseur,
          compte_comptable,
          compte_label,
          code_tva: code_tva ?? 'TVA20',
          categorie: categorie ?? null,
          is_active: true,
          source: 'learned',
          confidence: 95,
        },
        {
          onConflict: 'user_id,fournisseur_pattern',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    // Increment match_count separately (upsert doesn't easily do arithmetic)
    if (rule) {
      await supabase
        .from('categorization_rules')
        .update({ match_count: (rule.match_count ?? 0) + 1 })
        .eq('id', rule.id)
    }

    if (upsertError) {
      console.error('Rule upsert error:', upsertError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la règle' }, { status: 500 })
    }

    // Update the invoice with the chosen account
    const { error: updateError } = await supabase
      .from('factures')
      .update({
        compte_comptable,
        code_tva: code_tva ?? 'TVA20',
        categorie: categorie ?? null,
      })
      .eq('id', facture_id)
      .eq('user_id', auth.userId)

    if (updateError) {
      console.error('Invoice update error:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la facture' }, { status: 500 })
    }

    // Log the automation action
    await logAutomation({
      userId: auth.userId,
      actionType: 'rule_learned',
      entityType: 'facture',
      entityId: facture_id,
      ruleId: rule?.id,
      metadata: {
        fournisseur,
        compte_comptable,
        compte_label,
        code_tva: code_tva ?? 'TVA20',
      },
      isReversible: true,
    })

    return NextResponse.json({
      success: true,
      rule,
      message: `Règle apprise pour ${fournisseur} → ${compte_comptable}`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
