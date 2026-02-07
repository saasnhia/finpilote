'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences'
import { Card, Button } from '@/components/ui'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  Loader2,
  RotateCcw,
  GripVertical,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function KPISettingsPage() {
  const { user } = useAuth()
  const {
    kpiOrder,
    visibleKpis,
    allKpis,
    moveKpi,
    toggleKpi,
    savePreferences,
    setKpiOrder,
    setVisibleKpis,
    loading,
  } = useDashboardPreferences(user?.id)

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const success = await savePreferences(kpiOrder, visibleKpis)
    setSaving(false)
    if (success) {
      toast.success('Préférences sauvegardées')
    } else {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleReset = () => {
    setKpiOrder(['breakEvenPoint', 'revenue', 'breakEvenDays', 'currentResult'])
    setVisibleKpis(['breakEvenPoint', 'revenue', 'breakEvenDays', 'currentResult'])
    toast.success('Réinitialisé aux valeurs par défaut')
  }

  // Build ordered list for display
  const orderedKpis = [
    ...kpiOrder
      .map(key => allKpis.find(k => k.key === key))
      .filter(Boolean),
    ...allKpis.filter(k => !kpiOrder.includes(k.key)),
  ] as typeof allKpis

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-navy-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-navy-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Personnalisation des KPIs
            </h1>
            <p className="text-sm text-navy-500 mt-1">
              Choisissez et ordonnez les indicateurs affichés sur votre Dashboard
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Réinitialiser
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* KPI list */}
      <Card>
        <div className="space-y-2">
          {orderedKpis.map((kpi, index) => {
            const isVisible = visibleKpis.includes(kpi.key)
            const orderIndex = kpiOrder.indexOf(kpi.key)
            const isInOrder = orderIndex !== -1

            return (
              <div
                key={kpi.key}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isVisible
                    ? 'bg-white border border-navy-200'
                    : 'bg-navy-50 border border-transparent opacity-60'
                }`}
              >
                {/* Drag handle */}
                <GripVertical className="w-4 h-4 text-navy-300 flex-shrink-0" />

                {/* Order arrows */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (isInOrder && orderIndex > 0) moveKpi(orderIndex, 'up')
                    }}
                    disabled={!isInOrder || orderIndex === 0}
                    className="p-0.5 rounded hover:bg-navy-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3 h-3 text-navy-500" />
                  </button>
                  <button
                    onClick={() => {
                      if (isInOrder && orderIndex < kpiOrder.length - 1)
                        moveKpi(orderIndex, 'down')
                    }}
                    disabled={!isInOrder || orderIndex === kpiOrder.length - 1}
                    className="p-0.5 rounded hover:bg-navy-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3 h-3 text-navy-500" />
                  </button>
                </div>

                {/* KPI info */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-900">{kpi.label}</p>
                  <p className="text-xs text-navy-500 capitalize">{kpi.category}</p>
                </div>

                {/* Toggle visibility */}
                <button
                  onClick={() => toggleKpi(kpi.key)}
                  className={`p-2 rounded-lg transition-colors ${
                    isVisible
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      : 'bg-navy-100 text-navy-400 hover:bg-navy-200'
                  }`}
                >
                  {isVisible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Preview info */}
      <div className="mt-4 p-4 bg-navy-50 rounded-xl">
        <p className="text-sm text-navy-600">
          <span className="font-medium">Aperçu :</span> {visibleKpis.length} KPI{visibleKpis.length > 1 ? 's' : ''} affichés sur le Dashboard.
          Les 4 premiers seront en haut de page.
        </p>
      </div>
    </div>
  )
}
