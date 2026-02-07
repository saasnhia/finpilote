import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchInvoicesWithTransactions } from '@/lib/matching/invoice-matcher'
import { detectAnomalies } from '@/lib/matching/anomaly-detector'
import type { Transaction, Facture } from '@/types'
import type { MatchingConfig } from '@/lib/matching/matching-types'
import { DEFAULT_MATCHING_CONFIG } from '@/lib/matching/matching-types'

/**
 * POST /api/rapprochement/match
 * Lance le rapprochement automatique factures ↔ transactions
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Optional config overrides
    const body = await req.json().catch(() => ({}))
    const config: MatchingConfig = {
      ...DEFAULT_MATCHING_CONFIG,
      ...body.config,
    }

    // Fetch user's transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .order('date', { ascending: false })

    if (txError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des transactions' },
        { status: 500 }
      )
    }

    // Fetch user's validated invoices
    const { data: factures, error: fError } = await supabase
      .from('factures')
      .select('*')
      .eq('user_id', user.id)
      .in('validation_status', ['validated', 'manual_review'])
      .order('date_facture', { ascending: false })

    if (fError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des factures' },
        { status: 500 }
      )
    }

    const typedTransactions = (transactions || []) as Transaction[]
    const typedFactures = (factures || []) as Facture[]

    // Run matching algorithm
    const matchResult = matchInvoicesWithTransactions(
      typedFactures,
      typedTransactions,
      config
    )

    // Save auto-matched results to DB
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
