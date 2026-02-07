'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'

interface Metric {
  key: string
  label: string
  current_value: number
  previous_value: number | null
  delta_percent: number
  trend: 'up' | 'down' | 'stable'
  period_label: string
  unit?: string
}

interface ComparativeMetricsProps {
  userId: string | undefined
}

export function ComparativeMetrics({ userId }: ComparativeMetricsProps) {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState<'previous' | 'year_ago'>('previous')

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchMetrics = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/metrics/comparative?comparison=${comparison}`)
        const data = await res.json()
        if (data.success && data.has_data) {
          setMetrics(data.metrics)
        }
      } catch (error) {
        console.error('Error fetching comparative metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [userId, comparison])

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'jours') return `${Math.round(value)}j`
    if (unit === '%') return `${value.toFixed(1)}%`
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getTrendColor = (trend: string, key: string) => {
    // For breakEvenDays, lower is better
    const invertedKeys = ['breakEvenDays', 'breakEvenPoint']
    const isInverted = invertedKeys.includes(key)

    if (trend === 'stable') return 'text-amber-600 bg-amber-50'
    if (trend === 'up') return isInverted ? 'text-coral-600 bg-coral-50' : 'text-emerald-600 bg-emerald-50'
    return isInverted ? 'text-emerald-600 bg-emerald-50' : 'text-coral-600 bg-coral-50'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" />
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" />
    return <Minus className="w-3.5 h-3.5" />
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

  if (metrics.length === 0) return null

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-navy-900">
          Évolution
        </h3>
        <div className="flex gap-1 bg-navy-100 rounded-lg p-0.5">
          <button
            onClick={() => setComparison('previous')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              comparison === 'previous'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            vs Mois -1
          </button>
          <button
            onClick={() => setComparison('year_ago')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              comparison === 'year_ago'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            vs N-1
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map(m => (
          <div
            key={m.key}
            className="flex items-center justify-between p-3 bg-navy-50 rounded-lg"
          >
            <div>
              <p className="text-sm text-navy-600">{m.label}</p>
              <p className="text-sm font-mono font-medium text-navy-900">
                {formatValue(m.current_value, m.unit)}
              </p>
            </div>
            {m.previous_value !== null ? (
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendColor(m.trend, m.key)}`}
                >
                  {getTrendIcon(m.trend)}
                  {m.delta_percent >= 0 ? '+' : ''}
                  {m.delta_percent}%
                </div>
                <p className="text-xs text-navy-400 mt-0.5">{m.period_label}</p>
              </div>
            ) : (
              <span className="text-xs text-navy-400">Pas de données</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
