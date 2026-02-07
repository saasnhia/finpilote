import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateKPIs } from '@/lib/calculations'
import type { FinancialData } from '@/types'

/**
 * GET /api/metrics/comparative
 * Retourne les KPIs actuels vs période précédente
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const comparison = searchParams.get('comparison') || 'previous' // 'previous' | 'year_ago'

    // Current month
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)

    // Previous period
    let prevDate: Date
    if (comparison === 'year_ago') {
      prevDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    } else {
      prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }
    const previousMonth = prevDate.toISOString().slice(0, 7)

    // Fetch both periods
    const { data: currentData } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single()

    const { data: previousData } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', previousMonth)
      .single()

    if (!currentData) {
      return NextResponse.json({
        success: true,
        metrics: [],
        has_data: false,
      })
    }

    const currentKPIs = calculateKPIs(currentData as FinancialData)
    const previousKPIs = previousData
      ? calculateKPIs(previousData as FinancialData)
      : null

    const calcDelta = (current: number, previous: number | null) => {
      if (previous === null || previous === 0) return { delta: 0, trend: 'stable' as const }
      const delta = ((current - previous) / Math.abs(previous)) * 100
      return {
        delta: Math.round(delta * 10) / 10,
        trend: delta > 10 ? ('up' as const) : delta < -10 ? ('down' as const) : ('stable' as const),
      }
    }

    const prevRevenue = previousData?.revenue ?? null
    const revDelta = calcDelta(currentData.revenue, prevRevenue)

    const prevResult = previousKPIs?.currentResult ?? null
    const resDelta = calcDelta(currentKPIs.currentResult, prevResult)

    const prevBEP = previousKPIs?.breakEvenPoint ?? null
    const bepDelta = calcDelta(currentKPIs.breakEvenPoint, prevBEP)

    const prevDays = previousKPIs?.breakEvenDays ?? null
    const daysDelta = calcDelta(currentKPIs.breakEvenDays, prevDays)

    const prevMargin = previousKPIs?.safetyMarginPercent ?? null
    const marginDelta = calcDelta(currentKPIs.safetyMarginPercent, prevMargin)

    const periodLabel = comparison === 'year_ago'
      ? `vs ${prevDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
      : 'vs mois dernier'

    const metrics = [
      {
        key: 'revenue',
        label: 'Chiffre d\'Affaires',
        current_value: currentData.revenue,
        previous_value: prevRevenue,
        delta_percent: revDelta.delta,
        trend: revDelta.trend,
        period_label: periodLabel,
      },
      {
        key: 'currentResult',
        label: 'Résultat Mensuel',
        current_value: currentKPIs.currentResult,
        previous_value: prevResult,
        delta_percent: resDelta.delta,
        trend: resDelta.trend,
        period_label: periodLabel,
      },
      {
        key: 'breakEvenPoint',
        label: 'Seuil de Rentabilité',
        current_value: currentKPIs.breakEvenPoint,
        previous_value: prevBEP,
        delta_percent: bepDelta.delta,
        trend: bepDelta.trend,
        period_label: periodLabel,
      },
      {
        key: 'breakEvenDays',
        label: 'Point Mort',
        current_value: currentKPIs.breakEvenDays,
        previous_value: prevDays,
        delta_percent: daysDelta.delta,
        trend: daysDelta.trend,
        period_label: periodLabel,
        unit: 'jours',
      },
      {
        key: 'safetyMarginPercent',
        label: 'Marge de sécurité',
        current_value: currentKPIs.safetyMarginPercent,
        previous_value: prevMargin,
        delta_percent: marginDelta.delta,
        trend: marginDelta.trend,
        period_label: periodLabel,
        unit: '%',
      },
    ]

    return NextResponse.json({
      success: true,
      metrics,
      has_data: true,
      current_month: currentMonth,
      previous_month: previousMonth,
      comparison,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}
