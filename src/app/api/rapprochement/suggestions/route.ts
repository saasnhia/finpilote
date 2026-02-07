import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/rapprochement/suggestions
 * Récupère les suggestions de rapprochement et les matchs validés
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(req.url)
    const statut = searchParams.get('statut') // 'suggestion' | 'valide' | 'rejete' | null (all)
    const type = searchParams.get('type') // 'auto' | 'suggestion' | 'manuel' | null (all)

    // Build query
    let query = supabase
      .from('rapprochements_factures')
      .select('*')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })

    if (statut) {
      query = query.eq('statut', statut)
    }
    if (type) {
      query = query.eq('type', type)
    }

    const { data: rapprochements, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching suggestions:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des suggestions' },
        { status: 500 }
      )
    }

    // Fetch associated factures and transactions
    const factureIds = [...new Set((rapprochements || []).map(r => r.facture_id))]
    const transactionIds = [...new Set((rapprochements || []).map(r => r.transaction_id))]

    const [facturesResult, transactionsResult] = await Promise.all([
      factureIds.length > 0
        ? supabase.from('factures').select('*').in('id', factureIds)
        : { data: [], error: null },
      transactionIds.length > 0
        ? supabase.from('transactions').select('*').in('id', transactionIds)
        : { data: [], error: null },
    ])

    const factureMap = new Map(
      (facturesResult.data || []).map(f => [f.id, f])
    )
    const transactionMap = new Map(
      (transactionsResult.data || []).map(t => [t.id, t])
    )

    // Enrich rapprochements with full facture/transaction data
    const enriched = (rapprochements || []).map(r => ({
      ...r,
      facture: factureMap.get(r.facture_id) || null,
      transaction: transactionMap.get(r.transaction_id) || null,
    }))

    // Stats
    const stats = {
      total: enriched.length,
      auto_valide: enriched.filter(r => r.type === 'auto' && r.statut === 'valide').length,
      suggestions: enriched.filter(r => r.statut === 'suggestion').length,
      manuels: enriched.filter(r => r.type === 'manuel').length,
      rejetes: enriched.filter(r => r.statut === 'rejete').length,
    }

    return NextResponse.json({
      success: true,
      rapprochements: enriched,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
