import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTVAPeriod, validatePeriode } from '@/lib/tva/tva-calculator'
import type { TVACalculateResponse, Transaction } from '@/types'

/**
 * POST /api/tva/calculate
 * Calcule la TVA pour une période donnée
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
    const { periode_debut, periode_fin } = body as {
      periode_debut: string
      periode_fin: string
    }

    if (!periode_debut || !periode_fin) {
      return NextResponse.json(
        { error: 'Paramètres manquants: periode_debut, periode_fin' },
        { status: 400 }
      )
    }

    // Validate period
    const validation = validatePeriode(periode_debut, periode_fin)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Fetch transactions for the period
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', periode_debut)
      .lte('date', periode_fin)
      .order('date', { ascending: true })

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des transactions' },
        { status: 500 }
      )
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          periode_debut,
          periode_fin,
          ventes: {
            total_ht: 0,
            total_ttc: 0,
            tva_collectee: 0,
            par_taux: {
              taux_20: { ht: 0, tva: 0, ttc: 0, count: 0 },
              taux_10: { ht: 0, tva: 0, ttc: 0, count: 0 },
              taux_55: { ht: 0, tva: 0, ttc: 0, count: 0 },
              taux_21: { ht: 0, tva: 0, ttc: 0, count: 0 },
            },
          },
          achats: {
            total_ht: 0,
            total_ttc: 0,
            tva_deductible: 0,
            par_taux: {
              taux_20: { ht: 0, tva: 0, ttc: 0, count: 0 },
              taux_10: { ht: 0, tva: 0, ttc: 0, count: 0 },
              taux_55: { ht: 0, tva: 0, ttc: 0, count: 0 },
              taux_21: { ht: 0, tva: 0, ttc: 0, count: 0 },
            },
          },
          tva_nette: 0,
          transactions_count: 0,
        },
      } as TVACalculateResponse)
    }

    // Calculate TVA
    const result = calculateTVAPeriod(
      transactions as Transaction[],
      periode_debut,
      periode_fin
    )

    return NextResponse.json({
      success: true,
      result,
    } as TVACalculateResponse)
  } catch (error: any) {
    console.error('Error calculating TVA:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
