// KpiCards v2 — fond clair emerald-50/red-50/amber-50/purple-50
'use client'

import { useEffect, useState } from 'react'
import { Landmark, ShoppingBag, Clock, Zap } from 'lucide-react'
import type { EntrepriseDashboardData } from '@/app/api/entreprise/dashboard/route'
import { DepensesChart } from './DepensesChart'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  accent: string        // left bar colour, e.g. 'bg-emerald-500'
  variant: 'success' | 'danger' | 'warning' | 'purple'
  loading: boolean
}

function KpiCard({ title, value, subtitle, icon, accent, variant, loading }: KpiCardProps) {
  const bg: Record<string, string> = {
    success: 'bg-emerald-50',
    danger:  'bg-red-50',
    warning: 'bg-amber-50',
    purple:  'bg-purple-50',
  }
  const valueColor: Record<string, string> = {
    success: 'text-emerald-700',
    danger:  'text-red-700',
    warning: 'text-amber-700',
    purple:  'text-purple-700',
  }
  const iconColor: Record<string, string> = {
    success: 'text-emerald-600',
    danger:  'text-red-600',
    warning: 'text-amber-600',
    purple:  'text-purple-600',
  }

  return (
    <div className={`rounded-xl border border-navy-100 ${bg[variant]} p-5 relative overflow-hidden`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent} rounded-l-xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-navy-500 uppercase tracking-wide mb-1">{title}</p>
          {loading ? (
            <div className="h-7 w-24 bg-navy-100 animate-pulse rounded" />
          ) : (
            <p className={`text-2xl font-bold font-display ${valueColor[variant]}`}>{value}</p>
          )}
          <p className="text-xs text-navy-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${bg[variant]} border border-navy-100`}>
          <div className={iconColor[variant]}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Dashboard KPI panel — mode entreprise
 * Fetches /api/entreprise/dashboard independently.
 */
export function EntrepriseDashboardPanel() {
  const [data, setData] = useState<EntrepriseDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/entreprise/dashboard')
      .then(r => r.json())
      .then((json: EntrepriseDashboardData) => { if (json.success) setData(json) })
      .catch(() => { /* silently fail */ })
      .finally(() => setLoading(false))
  }, [])

  const kpis = data?.kpis

  return (
    <div className="space-y-6">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-navy-100" />
        <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider px-2">
          Indicateurs entreprise
        </span>
        <div className="h-px flex-1 bg-navy-100" />
      </div>

      {/* KPI Cards — style identique aux cartes du haut */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Solde bancaire"
          value={kpis != null ? fmt(kpis.solde_bancaire) : '—'}
          subtitle="Comptes actifs cumulés"
          icon={<Landmark className="w-5 h-5" />}
          accent="bg-emerald-500"
          variant="success"
          loading={loading}
        />
        <KpiCard
          title="Charges du mois"
          value={kpis != null ? fmt(kpis.charges_mois) : '—'}
          subtitle="Factures fournisseurs reçues"
          icon={<ShoppingBag className="w-5 h-5" />}
          accent="bg-red-500"
          variant="danger"
          loading={loading}
        />
        <KpiCard
          title="Factures en attente"
          value={kpis != null ? String(kpis.factures_attente) : '—'}
          subtitle="Créances clients non encaissées"
          icon={<Clock className="w-5 h-5" />}
          accent="bg-amber-500"
          variant="warning"
          loading={loading}
        />
        <KpiCard
          title="Économies auto"
          value={kpis != null ? fmt(kpis.economies_automatisation) : '—'}
          subtitle="Estimées ce mois (€15/action)"
          icon={<Zap className="w-5 h-5" />}
          accent="bg-purple-500"
          variant="purple"
          loading={loading}
        />
      </div>

      {/* Chart */}
      <DepensesChart data={data?.chart_6m ?? []} loading={loading} />
    </div>
  )
}
