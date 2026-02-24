import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BankTransaction, ImportConfirmResponse } from '@/types'
import { randomUUID } from 'crypto'
import { runAutoMatchForUser } from '@/lib/matching/auto-match'

/**
 * POST /api/banques/confirm-import
 * Importe les transactions depuis un CSV bancaire parsé.
 * Déclenche automatiquement le rapprochement factures <-> transactions après import.
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

    // Vérifier que le compte appartient à l'utilisateur
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

    const batchId = randomUUID()

    // Déduplication (même date + montant + description)
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
      (existingTransactions || []).map(t => `${t.date}|${t.amount}|${t.description}`)
    )

    const newTransactions = transactions.filter(t => {
      return !existingSet.has(`${t.date}|${t.amount}|${t.description}`)
    })

    const duplicateCount = transactions.length - newTransactions.length

    if (newTransactions.length > 0) {
      const toInsert = newTransactions.map(t => ({
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

      const { error: insertError } = await supabase.from('transactions').insert(toInsert)

      if (insertError) {
        console.error('Error inserting transactions:', insertError)
        return NextResponse.json(
          { error: "Erreur lors de l'insertion des transactions" },
          { status: 500 }
        )
      }
    }

    // Mettre à jour la date de dernière synchro du compte
    await supabase
      .from('comptes_bancaires')
      .update({ last_sync_date: new Date().toISOString() })
      .eq('id', bank_account_id)

    // Rapprochement natif automatique (déclenché si des transactions ont été importées)
    let matchStats = { auto_matched: 0, suggestions: 0, anomalies: 0 }
    if (newTransactions.length > 0) {
      try {
        matchStats = await runAutoMatchForUser(supabase, user.id)
      } catch (matchErr) {
        console.error('[confirm-import] Auto-matching failed (non-blocking):', matchErr)
      }
    }

    return NextResponse.json({
      success: true,
      imported_count: newTransactions.length,
      duplicate_count: duplicateCount,
      auto_matched: matchStats.auto_matched,
      suggestions: matchStats.suggestions,
    } as ImportConfirmResponse & { auto_matched: number; suggestions: number })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Error importing transactions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + message },
      { status: 500 }
    )
  }
}
