import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BankTransaction, ImportConfirmResponse } from '@/types'
import { randomUUID } from 'crypto'

/**
 * POST /api/banques/confirm-import
 * Import transactions from parsed CSV
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

    // Parse request body
    const body = await req.json()
    const { bank_account_id, transactions } = body as {
      bank_account_id: string
      transactions: BankTransaction[]
    }

    if (!bank_account_id || !transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Données invalides: bank_account_id et transactions requis' },
        { status: 400 }
      )
    }

    // Verify bank account belongs to user
    const { data: bankAccount, error: accountError } = await supabase
      .from('comptes_bancaires')
      .select('id')
      .eq('id', bank_account_id)
      .eq('user_id', user.id)
      .single()

    if (accountError || !bankAccount) {
      return NextResponse.json(
        { error: 'Compte bancaire non trouvé ou non autorisé' },
        { status: 404 }
      )
    }

    // Generate batch ID for this import
    const batchId = randomUUID()

    // Check for duplicates (same date, amount, description)
    const dates = transactions.map(t => t.date)
    const minDate = dates.sort()[0]
    const maxDate = dates.sort()[dates.length - 1]

    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('date, amount, description')
      .eq('user_id', user.id)
      .eq('bank_account_id', bank_account_id)
      .gte('date', minDate)
      .lte('date', maxDate)

    const existingSet = new Set(
      (existingTransactions || []).map(
        t => `${t.date}|${t.amount}|${t.description}`
      )
    )

    // Filter out duplicates
    const newTransactions = transactions.filter(t => {
      const key = `${t.date}|${t.amount}|${t.description}`
      return !existingSet.has(key)
    })

    const duplicateCount = transactions.length - newTransactions.length

    // Insert new transactions
    if (newTransactions.length > 0) {
      const transactionsToInsert = newTransactions.map(t => ({
        user_id: user.id,
        bank_account_id,
        date: t.date,
        description: t.description,
        original_description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.suggested_category || 'other',
        suggested_category: t.suggested_category,
        confidence_score: t.confidence_score,
        is_fixed: false,
        source: 'bank_import' as const,
        status: 'pending' as const,
        category_confirmed: false,
        import_batch_id: batchId,
      }))

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)

      if (insertError) {
        console.error('Error inserting transactions:', insertError)
        return NextResponse.json(
          { error: 'Erreur lors de l\'insertion des transactions' },
          { status: 500 }
        )
      }
    }

    // Update bank account last_sync_date
    await supabase
      .from('comptes_bancaires')
      .update({ last_sync_date: new Date().toISOString() })
      .eq('id', bank_account_id)

    return NextResponse.json({
      success: true,
      imported_count: newTransactions.length,
      duplicate_count: duplicateCount,
    } as ImportConfirmResponse)
  } catch (error: any) {
    console.error('Error importing transactions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
