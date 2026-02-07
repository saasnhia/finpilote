'use client'

import { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import {
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calculator,
  Download,
} from 'lucide-react'
import type { Insight } from '@/types'

interface InsightsPanelProps {
  userId: string | undefined
}

export function InsightsPanel({ userId }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [applyingKey, setApplyingKey] = useState<string | null>(null)
  const [simulatingKey, setSimulatingKey] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchInsights = async () => {
      try {
        const res = await fetch('/api/insights')
        const data = await res.json()
        if (data.success) {
          setInsights(data.insights)
        }
      } catch (error) {
        console.error('Error fetching insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [userId])

  const handleApply = async (key: string) => {
    setApplyingKey(key)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_key: key }),
      })
      if (res.ok) {
        setInsights(prev =>
          prev.map(i => (i.key === key ? { ...i, applied: true } : i))
        )
      }
    } catch (error) {
      console.error('Error applying insight:', error)
    } finally {
      setApplyingKey(null)
    }
  }

  const downloadReport = (insight: Insight) => {
    const lines = [
      '══════════════════════════════════════════════',
      '  RAPPORT D\'ANALYSE – FinPilote',
      '══════════════════════════════════════════════',
      '',
      `Date : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      '',
      '──────────────────────────────────────────────',
      `  DIAGNOSTIC : ${insight.titre}`,
      '──────────────────────────────────────────────',
      '',
      'ANALYSE :',
      insight.analyse,
      '',
      `INDICATEUR : ${insight.metric_value}${insight.metric_label ? ' ' + insight.metric_label : ''}`,
      ...(insight.benchmark_value !== undefined
        ? [`OBJECTIF : ${insight.benchmark_value}${insight.benchmark_label ? ' (' + insight.benchmark_label + ')' : ''}`]
        : []),
      '',
      '──────────────────────────────────────────────',
      '  PLAN D\'ACTION RECOMMANDÉ',
      '──────────────────────────────────────────────',
      '',
      ...(insight.action_plan
        ? insight.action_plan.map((a, i) => `${i + 1}. ${a.label}\n   Impact estimé : ${a.impact_estimate}\n`)
        : insight.actions.map((a, i) => `${i + 1}. ${a}`)),
      '',
      '══════════════════════════════════════════════',
      '  Généré par FinPilote',
      '══════════════════════════════════════════════',
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-${insight.key}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const SEVERITY_ICON = {
    critical: <AlertTriangle className="w-4 h-4 text-red-600" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-600" />,
    info: <Info className="w-4 h-4 text-blue-600" />,
  }

  const SEVERITY_BG = {
    critical: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      </Card>
    )
  }

  // Show top 3 non-applied
  const displayInsights = insights.filter(i => !i.applied).slice(0, 3)

  // Fallback when no insights available
  if (insights.length === 0 || displayInsights.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-display font-semibold text-navy-900">
            Recommandations IA
          </h3>
        </div>
        <p className="text-sm text-navy-500 leading-relaxed">
          {insights.length === 0
            ? 'Aucune recommandation disponible pour le moment. Importez des données financières pour recevoir des conseils personnalisés.'
            : 'Toutes les recommandations ont été appliquées. Elles seront mises à jour au prochain cycle de données.'}
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-display font-semibold text-navy-900">
          Recommandations
        </h3>
      </div>

      <div className="space-y-3">
        {displayInsights.map(insight => {
          const isExpanded = expandedKey === insight.key
          const isApplying = applyingKey === insight.key
          const isSimulating = simulatingKey === insight.key

          return (
            <div
              key={insight.key}
              className={`rounded-xl border p-4 transition-all ${SEVERITY_BG[insight.severite]}`}
            >
              {/* Header */}
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedKey(isExpanded ? null : insight.key)}
              >
                <div className="flex items-start gap-2 flex-1">
                  {SEVERITY_ICON[insight.severite]}
                  <div>
                    <p className="text-sm font-medium text-navy-900">{insight.titre}</p>
                    <p className="text-xs text-navy-600 mt-0.5">{insight.analyse}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-navy-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-navy-400 flex-shrink-0" />
                )}
              </div>

              {/* Metric comparison */}
              {insight.metric_value !== undefined && (
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="font-mono font-medium text-navy-800">
                    {insight.metric_value}
                    {insight.metric_label && ` ${insight.metric_label}`}
                  </span>
                  {insight.benchmark_value !== undefined && (
                    <>
                      <span className="text-navy-400">vs</span>
                      <span className="font-mono text-navy-600">
                        {insight.benchmark_value}
                        {insight.benchmark_label && ` (${insight.benchmark_label})`}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Expanded: Plan d'action ou actions */}
              {isExpanded && (
                <div className="mt-3 space-y-3">
                  {/* Plan d'action structuré (Phase 4D) */}
                  {insight.action_plan && insight.action_plan.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-navy-600 uppercase mb-2">
                        Plan d&apos;action
                      </p>
                      <div className="space-y-2">
                        {insight.action_plan.map((action, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2.5 bg-white/60 rounded-lg border border-white/80"
                          >
                            <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-navy-800">{action.label}</p>
                              <p className="text-xs text-navy-500 mt-0.5">{action.impact_estimate}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-navy-600 uppercase mb-2">
                        Actions recommandées
                      </p>
                      <ul className="space-y-1.5">
                        {insight.actions.map((action, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-navy-700"
                          >
                            <span className="w-4 h-4 bg-white/70 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Simulation inline */}
                  {isSimulating && insight.action_plan && (
                    <div className="p-3 bg-white/80 rounded-lg border border-navy-200">
                      <p className="text-xs font-medium text-navy-700 mb-2">
                        Simulation d&apos;impact estimé
                      </p>
                      <div className="space-y-1.5">
                        {insight.action_plan.map((action, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-navy-600">{action.label}</span>
                            <span className="font-medium text-emerald-700">{action.impact_estimate}</span>
                          </div>
                        ))}
                      </div>
                      {insight.metric_value !== undefined && insight.benchmark_value !== undefined && (
                        <div className="mt-2 pt-2 border-t border-navy-200 text-xs">
                          <span className="text-navy-500">Actuel : </span>
                          <span className="font-mono font-medium text-navy-800">
                            {insight.metric_value} {insight.metric_label}
                          </span>
                          <span className="text-navy-400 mx-1">&rarr;</span>
                          <span className="text-navy-500">Objectif : </span>
                          <span className="font-mono font-medium text-emerald-700">
                            {insight.benchmark_value} {insight.benchmark_label}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {insight.action_plan && insight.action_plan.length > 0 && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setSimulatingKey(isSimulating ? null : insight.key)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-navy-600 bg-white/70 rounded-lg hover:bg-white transition-colors border border-navy-200/50"
                      >
                        <Calculator className="w-3 h-3" />
                        {isSimulating ? 'Masquer' : 'Simuler l\'impact'}
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        downloadReport(insight)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-navy-600 bg-white/70 rounded-lg hover:bg-white transition-colors border border-navy-200/50"
                    >
                      <Download className="w-3 h-3" />
                      Rapport
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={e => {
                        e.stopPropagation()
                        handleApply(insight.key)
                      }}
                      disabled={isApplying}
                      icon={
                        isApplying ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      Appliqué
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
