import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlanFeature, isAuthed } from '@/lib/auth/require-plan'

/**
 * GET /api/automation/stats
 * KPIs du tableau de bord automatisation (mois courant)
 */
export async function GET() {
  try {
    const auth = await requirePlanFeature('dashboard_automatisation')
    if (!isAuthed(auth)) return auth

    const supabase = await createClient()

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Run all queries in parallel
    const [
      facturesResult,
      facturesAutoResult,
      rapsTotalResult,
      rapsAutoResult,
      rulesResult,
      logConfResult,
    ] = await Promise.allSettled([
      // Total factures this month
      supabase
        .from('factures')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.userId)
        .gte('created_at', firstOfMonth),

      // Factures auto-catégorisées this month (compte_comptable set via automation)
      supabase
        .from('automation_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.userId)
        .eq('action_type', 'categorization_applied')
        .gte('created_at', firstOfMonth),

      // Total rapprochements (all time, active)
      supabase
        .from('rapprochements_factures')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.userId)
        .in('statut', ['valide', 'suggestion']),

      // Auto rapprochements (type = 'auto')
      supabase
        .from('rapprochements_factures')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.userId)
        .eq('type', 'auto')
        .eq('statut', 'valide'),

      // Active categorization rules
      supabase
        .from('categorization_rules')
        .select('confidence', { count: 'exact' })
        .eq('user_id', auth.userId)
        .eq('is_active', true),

      // Avg confidence of auto-matched rapprochements
      supabase
        .from('rapprochements_factures')
        .select('confidence_score')
        .eq('user_id', auth.userId)
        .eq('type', 'auto')
        .not('confidence_score', 'is', null),
    ])

    const totalFactures = facturesResult.status === 'fulfilled' ? (facturesResult.value.count ?? 0) : 0
    const autoFactures = facturesAutoResult.status === 'fulfilled' ? (facturesAutoResult.value.count ?? 0) : 0
    const totalRaps = rapsTotalResult.status === 'fulfilled' ? (rapsTotalResult.value.count ?? 0) : 0
    const autoRaps = rapsAutoResult.status === 'fulfilled' ? (rapsAutoResult.value.count ?? 0) : 0
    const activeRulesData = rulesResult.status === 'fulfilled' ? rulesResult.value : null
    const activeRules = activeRulesData?.count ?? 0

    // Average confidence across rules + rapprochements
    const rapConfData = logConfResult.status === 'fulfilled' ? (logConfResult.value.data ?? []) : []
    const ruleConfidences = activeRulesData?.data?.map((r: { confidence: number }) => r.confidence) ?? []
    const rapConfidences = rapConfData.map((r: { confidence_score: number }) => r.confidence_score)
    const allConfidences = [...ruleConfidences, ...rapConfidences]
    const avgConfidence = allConfidences.length > 0
      ? Math.round(allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length)
      : 0

    return NextResponse.json({
      // % factures auto-catégorisées ce mois
      factures_auto_pct: totalFactures > 0 ? Math.round((autoFactures / totalFactures) * 100) : 0,
      factures_auto_count: autoFactures,
      factures_total: totalFactures,

      // % rapprochements automatiques
      raps_auto_pct: totalRaps > 0 ? Math.round((autoRaps / totalRaps) * 100) : 0,
      raps_auto_count: autoRaps,
      raps_total: totalRaps,

      // Règles actives
      active_rules: activeRules,

      // Score confiance global
      avg_confidence: avgConfidence,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
