import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateN8nWebhook } from '@/lib/n8n/validate-webhook'

/**
 * POST /api/webhooks/n8n/sync-sage
 * n8n pousse des données de balance comptable depuis Sage (via export CSV/FTP).
 *
 * Body attendu :
 * {
 *   user_id: string
 *   dossier_id?: string
 *   periode: string           // ex: "2025-12"
 *   transactions: Array<{
 *     date: string
 *     description: string
 *     amount: number
 *     compte_pcg?: string
 *     journal?: string
 *   }>
 * }
 */
export async function POST(req: NextRequest) {
  const authError = validateN8nWebhook(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { user_id, transactions, periode } = body

    if (!user_id || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Champs requis : user_id, transactions (tableau non vide)' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const rows = transactions.map((tx: {
      date: string
      description: string
      amount: number
      compte_pcg?: string
      journal?: string
    }) => ({
      user_id,
      date: tx.date,
      description: tx.description,
      amount: Number(tx.amount),
      type: Number(tx.amount) >= 0 ? 'income' : 'expense',
      compte_pcg: tx.compte_pcg || null,
      notes: tx.journal ? `Journal: ${tx.journal}` : null,
      source: 'sage_n8n',
    }))

    const { data, error } = await supabase
      .from('transactions')
      .insert(rows)
      .select('id')

    if (error) {
      console.error('[webhook/sync-sage] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: data?.length ?? 0,
      periode: periode || null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
