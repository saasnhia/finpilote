import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateKPIs } from '@/lib/calculations'
import { generateInsights } from '@/lib/insights/insight-generator'
import type { FinancialData } from '@/types'

/**
 * GET /api/insights
 * Génère des recommandations en temps réel
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch current and historical financial data
    const { data: allData } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: true })
      .limit(12)

    if (!allData || allData.length === 0) {
      return NextResponse.json({
        success: true,
        insights: [],
        has_data: false,
      })
    }

    const currentData = allData[allData.length - 1] as FinancialData
    const kpis = calculateKPIs(currentData)

    // Fetch applied insights
    const { data: appliedData } = await supabase
      .from('applied_insights')
      .select('insight_key')
      .eq('user_id', user.id)

    const appliedKeys = new Set((appliedData || []).map(a => a.insight_key))

    const insights = generateInsights(
      currentData,
      kpis,
      allData as FinancialData[],
      appliedKeys
    )

    return NextResponse.json({
      success: true,
      insights,
      has_data: true,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}

/**
 * POST /api/insights
 * Marquer un insight comme appliqué
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { insight_key, notes } = body as { insight_key: string; notes?: string }

    if (!insight_key) {
      return NextResponse.json({ error: 'Paramètre manquant: insight_key' }, { status: 400 })
    }

    const { error } = await supabase
      .from('applied_insights')
      .upsert({
        user_id: user.id,
        insight_key,
        notes: notes || null,
        applied_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,insight_key',
      })

    if (error) {
      return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}
