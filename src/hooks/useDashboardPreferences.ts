'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DashboardPreferences } from '@/types'

const DEFAULT_KPI_ORDER = [
  'breakEvenPoint',
  'revenue',
  'breakEvenDays',
  'currentResult',
]

const ALL_KPIS = [
  { key: 'breakEvenPoint', label: 'Seuil de Rentabilité', category: 'core' },
  { key: 'revenue', label: 'Chiffre d\'Affaires', category: 'core' },
  { key: 'breakEvenDays', label: 'Point Mort', category: 'core' },
  { key: 'currentResult', label: 'Résultat Mensuel', category: 'core' },
  { key: 'totalFixedCosts', label: 'Charges Fixes', category: 'charges' },
  { key: 'marginRate', label: 'Taux de Marge', category: 'margin' },
  { key: 'safetyMarginPercent', label: 'Marge de Sécurité', category: 'margin' },
  { key: 'variableCosts', label: 'Charges Variables', category: 'charges' },
]

export function useDashboardPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null)
  const [kpiOrder, setKpiOrder] = useState<string[]>(DEFAULT_KPI_ORDER)
  const [visibleKpis, setVisibleKpis] = useState<string[]>(DEFAULT_KPI_ORDER)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setKpiOrder(DEFAULT_KPI_ORDER)
      setVisibleKpis(DEFAULT_KPI_ORDER)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_dashboard_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data && !error) {
        setPreferences(data as DashboardPreferences)
        setKpiOrder(data.kpi_order || DEFAULT_KPI_ORDER)
        setVisibleKpis(data.visible_kpis || DEFAULT_KPI_ORDER)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const savePreferences = useCallback(
    async (order: string[], visible: string[]) => {
      if (!userId) return false

      try {
        const { error } = await supabase
          .from('user_dashboard_preferences')
          .upsert(
            {
              user_id: userId,
              kpi_order: order,
              visible_kpis: visible,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )

        if (error) throw error

        setKpiOrder(order)
        setVisibleKpis(visible)
        return true
      } catch (error) {
        console.error('Error saving preferences:', error)
        return false
      }
    },
    [userId, supabase]
  )

  const moveKpi = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newOrder = [...kpiOrder]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newOrder.length) return

      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
      setKpiOrder(newOrder)
    },
    [kpiOrder]
  )

  const toggleKpi = useCallback(
    (key: string) => {
      setVisibleKpis(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      )
    },
    []
  )

  return {
    kpiOrder,
    visibleKpis,
    loading,
    allKpis: ALL_KPIS,
    moveKpi,
    toggleKpi,
    savePreferences,
    setKpiOrder,
    setVisibleKpis,
  }
}
