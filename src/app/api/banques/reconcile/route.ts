import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchTransactions } from '@/lib/reconciliation/matcher'
import type { ReconciliationResponse, Transaction } from '@/types'

/**
 * POST /api/banques/reconcile
 * Run bank reconciliation matching algorithm
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Parse request body (optional: specify bank_account_id)
    const body = await req.json().catch(() => ({}))
    const { bank_account_id } = body as { bank_account_id?: string }

    // Fetch manual transactions (not yet reconciled)
    let manualQuery = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('source', 'manual')
      .neq('status', 'reconciled')

    if (bank_account_id) {
      manualQuery = manualQuery.eq('bank_account_id', bank_account_id)
    }

    const { data: manualTransactions, error: manualError } = await manualQuery

    if (manualError) {
      console.error('Error fetching manual transactions:', manualError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des transactions manuelles' },
        { status: 500 }
      )
    }

    // Fetch bank transactions (not yet reconciled)
    let bankQuery = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('source', 'bank_import')
      .neq('status', 'reconciled')

    if (bank_account_id) {
      bankQuery = bankQuery.eq('bank_account_id', bank_account_id)
    }

    const { data: bankTransactions, error: bankError } = await bankQuery

    if (bankError) {
      console.error('Error fetching bank transactions:', bankError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des transactions bancaires' },
        { status: 500 }
      )
    }

    // Run matching algorithm
    const matchResult = matchTransactions(
      (manualTransactions || []) as Transaction[],
      (bankTransactions || []) as Transaction[]
    )

    // Auto-confirm high-confidence matches (score ≥ 0.8)
    let autoMatchedCount = 0

    for (const match of matchResult.autoMatches) {
      // Create reconciliation record
      const { error: reconcileError } = await supabase
        .from('rapprochements')
        .insert({
          user_id: user.id,
          transaction_id: match.manual_transaction.id,
          bank_transaction_id: match.bank_transaction.id,
          match_score: match.match_score,
          match_method: 'auto',
          date_score: match.date_score,
          amount_score: match.amount_score,
          description_score: match.description_score,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by_user: false,
        })

      if (reconcileError) {
        console.error('Error creating reconciliation:', reconcileError)
        continue
      }

      // Update transaction statuses
      await supabase
        .from('transactions')
        .update({ status: 'reconciled' })
        .in('id', [match.manual_transaction.id, match.bank_transaction.id])

      autoMatchedCount++
    }

    // Return results
    return NextResponse.json({
      success: true,
      auto_matched_count: autoMatchedCount,
      suggested_matches: matchResult.suggestedMatches,
      unmatched_manual_count: matchResult.unmatchedManual.length,
      unmatched_bank_count: matchResult.unmatchedBank.length,
    } as ReconciliationResponse)
  } catch (error: any) {
    console.error('Error reconciling transactions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/banques/reconcile
 * Confirm or reject a suggested match
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { manual_transaction_id, bank_transaction_id, action } = body as {
      manual_transaction_id: string
      bank_transaction_id: string
      action: 'confirm' | 'reject'
    }

    if (!manual_transaction_id || !bank_transaction_id || !action) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

    if (action === 'confirm') {
      // Check if reconciliation already exists
      const { data: existing } = await supabase
        .from('rapprochements')
        .select('id')
        .eq('transaction_id', manual_transaction_id)
        .eq('bank_transaction_id', bank_transaction_id)
        .single()

      if (existing) {
        // Update existing reconciliation
        await supabase
          .from('rapprochements')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            confirmed_by_user: true,
          })
          .eq('id', existing.id)
      } else {
        // Create new reconciliation
        await supabase.from('rapprochements').insert({
          user_id: user.id,
          transaction_id: manual_transaction_id,
          bank_transaction_id: bank_transaction_id,
          match_score: 1.0,
          match_method: 'manual',
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by_user: true,
        })
      }

      // Update transaction statuses
      await supabase
        .from('transactions')
        .update({ status: 'reconciled' })
        .in('id', [manual_transaction_id, bank_transaction_id])
    } else if (action === 'reject') {
      // Mark as rejected
      const { data: existing } = await supabase
        .from('rapprochements')
        .select('id')
        .eq('transaction_id', manual_transaction_id)
        .eq('bank_transaction_id', bank_transaction_id)
        .single()

      if (existing) {
        await supabase
          .from('rapprochements')
          .update({ status: 'rejected', confirmed_by_user: true })
          .eq('id', existing.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating reconciliation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
