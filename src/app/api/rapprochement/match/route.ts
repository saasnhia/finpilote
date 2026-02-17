import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchInvoicesWithTransactions } from '@/lib/matching/invoice-matcher'
import { detectAnomalies } from '@/lib/matching/anomaly-detector'
import { parseSupplierHistories, updateSupplierHistory } from '@/lib/matching/learning-engine'
import type { Transaction, Facture } from '@/types'
import type { MatchingConfig, SupplierHistory } from '@/lib/matching/matching-types'
import { DEFAULT_MATCHING_CONFIG } from '@/lib/matching/matching-types'

/**
 * POST /api/rapprochement/match
 * Lance le rapprochement automatique factures <-> transactions
 * avec scoring multi-criteres intelligent + apprentissage fournisseur
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    // Optional config overrides
    const body = await req.json().catch(() => ({}))
    const config: MatchingConfig = {
      ...DEFAULT_MATCHING_CONFIG,
      ...body.config,
    }

    // Fetch user's transactions (all types, matcher filters expenses)
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (txError) {
      return NextResponse.json(
        { error: 'Erreur lors de la recuperation des transactions' },
        { status: 500 }
      )
    }

    // Fetch user's invoices (use correct column name: statut)
    const { data: factures, error: fError } = await supabase
      .from('factures')
      .select('*')
      .eq('user_id', user.id)
      .in('statut', ['en_attente', 'validee', 'brouillon'])
      .order('date_facture', { ascending: false })

    if (fError) {
      return NextResponse.json(
        { error: 'Erreur lors de la recuperation des factures' },
        { status: 500 }
      )
    }

    // Load supplier learning history
    let supplierHistories: SupplierHistory[] = []
    const { data: historyRows } = await supabase
      .from('supplier_histories')
      .select('*')
      .eq('user_id', user.id)

    if (historyRows && historyRows.length > 0) {
      supplierHistories = parseSupplierHistories(historyRows)
    }

    const typedTransactions = (transactions || []) as Transaction[]
    const typedFactures = (factures || []) as Facture[]

    // Run smart matching algorithm
    const matchResult = matchInvoicesWithTransactions(
      typedFactures,
      typedTransactions,
      config,
      supplierHistories
    )

    // Save auto-matched results to DB (with extended score fields)
    const autoMatchInserts = matchResult.auto_matched.map(m => ({
      user_id: user.id,
      facture_id: m.facture.id,
      transaction_id: m.transaction.id,
      montant: m.facture.montant_ttc || m.transaction.amount,
      type: 'auto' as const,
      statut: 'valide' as const,
      confidence_score: m.confidence,
      date_score: m.score.date,
      amount_score: m.score.amount,
      description_score: m.score.description,
      validated_by_user: false,
    }))

    // Save suggestions to DB
    const suggestionInserts = matchResult.suggestions.map(m => ({
      user_id: user.id,
      facture_id: m.facture.id,
      transaction_id: m.transaction.id,
      montant: m.facture.montant_ttc || m.transaction.amount,
      type: 'suggestion' as const,
      statut: 'suggestion' as const,
      confidence_score: m.confidence,
      date_score: m.score.date,
      amount_score: m.score.amount,
      description_score: m.score.description,
      validated_by_user: false,
    }))

    const allInserts = [...autoMatchInserts, ...suggestionInserts]

    if (allInserts.length > 0) {
      // Delete existing unvalidated suggestions for this user before inserting new ones
      await supabase
        .from('rapprochements_factures')
        .delete()
        .eq('user_id', user.id)
        .eq('validated_by_user', false)

      const { error: insertError } = await supabase
        .from('rapprochements_factures')
        .insert(allInserts)

      if (insertError) {
        console.error('Error inserting matches:', insertError)
        return NextResponse.json(
          { error: 'Erreur lors de la sauvegarde des rapprochements' },
          { status: 500 }
        )
      }
    }

    // Update supplier learning for auto-matched pairs
    for (const m of matchResult.auto_matched) {
      if (m.facture.fournisseur) {
        const updatedHistory = updateSupplierHistory(
          supplierHistories,
          m.facture.fournisseur,
          m.transaction.description,
          m.transaction.amount
        )

        // Upsert supplier history
        if (updatedHistory.id) {
          await supabase
            .from('supplier_histories')
            .update({
              transaction_patterns: updatedHistory.transaction_patterns,
              iban_patterns: updatedHistory.iban_patterns,
              avg_amount: updatedHistory.avg_amount,
              match_count: updatedHistory.match_count,
              last_matched_at: updatedHistory.last_matched_at,
              updated_at: updatedHistory.updated_at,
            })
            .eq('id', updatedHistory.id)
        } else {
          await supabase
            .from('supplier_histories')
            .insert({
              user_id: user.id,
              supplier_name: updatedHistory.supplier_name,
              supplier_normalized: updatedHistory.supplier_normalized,
              transaction_patterns: updatedHistory.transaction_patterns,
              iban_patterns: updatedHistory.iban_patterns,
              avg_amount: updatedHistory.avg_amount,
              match_count: updatedHistory.match_count,
              last_matched_at: updatedHistory.last_matched_at,
            })
        }
      }
    }

    // Run anomaly detection
    const matchedPairs = [
      ...matchResult.auto_matched.map(m => ({
        facture_id: m.facture.id,
        transaction_id: m.transaction.id,
      })),
      ...matchResult.suggestions.map(m => ({
        facture_id: m.facture.id,
        transaction_id: m.transaction.id,
      })),
    ]

    const anomalyResult = detectAnomalies(
      typedTransactions,
      typedFactures,
      matchedPairs,
      config
    )

    // Save anomalies to DB
    if (anomalyResult.anomalies.length > 0) {
      // Clear previous anomalies that are still open
      await supabase
        .from('anomalies_detectees')
        .delete()
        .eq('user_id', user.id)
        .eq('statut', 'ouverte')

      const anomalyInserts = anomalyResult.anomalies.map(a => ({
        user_id: user.id,
        type: a.type,
        severite: a.severite,
        description: a.description,
        transaction_id: a.transaction_id || null,
        facture_id: a.facture_id || null,
        montant: a.montant || null,
        montant_attendu: a.montant_attendu || null,
        ecart: a.ecart || null,
        statut: 'ouverte' as const,
      }))

      const { error: anomalyError } = await supabase
        .from('anomalies_detectees')
        .insert(anomalyInserts)

      if (anomalyError) {
        console.error('Error inserting anomalies:', anomalyError)
      }
    }

    return NextResponse.json({
      success: true,
      auto_matched: matchResult.auto_matched.length,
      suggestions: matchResult.suggestions.length,
      unmatched_factures: matchResult.unmatched_factures.length,
      unmatched_transactions: matchResult.unmatched_transactions.length,
      anomalies: anomalyResult.stats,
    })
  } catch (error: any) {
    console.error('Error in matching:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
