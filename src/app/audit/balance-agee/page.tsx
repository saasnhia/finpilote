'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BalanceAgeeItem {
  id: string
  numero_facture: string
  client_nom: string
  montant_ttc: number
  resteA: number
  date_echeance: string
  joursRetard: number
  tranche: 'non_echu' | '0_30' | '31_60' | '61_90' | 'plus_90'
  statut_paiement: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const TRANCHE_ORDER = ['non_echu', '0_30', '31_60', '61_90', 'plus_90'] as const
type Tranche = typeof TRANCHE_ORDER[number]

const TRANCHE_CONFIG: Record<Tranche, { label: string; color: string; bg: string; accentBg: string }> = {
  non_echu: { label: 'Non échu', color: 'text-navy-700', bg: 'bg-navy-50', accentBg: 'bg-navy-200' },
  '0_30': { label: '0 – 30 jours', color: 'text-amber-700', bg: 'bg-amber-50', accentBg: 'bg-amber-400' },
  '31_60': { label: '31 – 60 jours', color: 'text-orange-700', bg: 'bg-orange-50', accentBg: 'bg-orange-500' },
  '61_90': { label: '61 – 90 jours', color: 'text-red-700', bg: 'bg-red-50', accentBg: 'bg-red-500' },
  plus_90: { label: '+90 jours', color: 'text-red-900', bg: 'bg-red-100', accentBg: 'bg-red-700' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BalanceAgeePage() {
  const [items, setItems] = useState<BalanceAgeeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTranche, setFilterTranche] = useState<Tranche | 'all'>('all')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/summary')
      const json = await res.json()
      if (json.success) setItems(json.balance_agee_clients ?? json.balance_agee ?? [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = filterTranche === 'all' ? items : items.filter(i => i.tranche === filterTranche)

  // Résumé par tranche
  const summary = TRANCHE_ORDER.map(t => {
    const trancheItems = items.filter(i => i.tranche === t)
    return {
      tranche: t,
      count: trancheItems.length,
      total: trancheItems.reduce((sum, i) => sum + i.resteA, 0),
    }
  })

  const totalGlobal = items.reduce((sum, i) => sum + i.resteA, 0)
  const countCritical = items.filter(i => i.tranche === 'plus_90').length

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-navy-400 mb-1">
              <Link href="/dashboard" className="hover:text-navy-600">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <span>Balance âgée</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-navy-500" />
              Balance âgée clients
            </h1>
            <p className="mt-1 text-sm text-navy-500">
              Encours clients classés par ancienneté de retard
            </p>
          </div>
        </div>

        {/* Alertes critiques */}
        {!loading && countCritical > 0 && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {countCritical} facture{countCritical > 1 ? 's' : ''} en retard critique (&gt;90 jours)
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Ces créances nécessitent une action urgente (relance, mise en demeure, contentieux).
              </p>
            </div>
          </div>
        )}

        {/* Résumé par tranche */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {summary.map(s => {
            const cfg = TRANCHE_CONFIG[s.tranche]
            return (
              <button
                key={s.tranche}
                onClick={() => setFilterTranche(filterTranche === s.tranche ? 'all' : s.tranche)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  filterTranche === s.tranche
                    ? `border-current ${cfg.bg}`
                    : 'border-navy-100 bg-white hover:border-navy-200'
                } ${cfg.color}`}
              >
                <div className={`w-2 h-2 rounded-full ${cfg.accentBg} mb-2`} />
                <p className="text-xs font-medium mb-1">{cfg.label}</p>
                <p className="text-lg font-bold font-display">{formatCurrency(s.total)}</p>
                <p className="text-[11px] opacity-70">{s.count} facture{s.count > 1 ? 's' : ''}</p>
              </button>
            )
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-navy-400" />
            <span className="text-sm font-medium text-navy-700">
              {filterTranche === 'all' ? `${items.length} facture${items.length > 1 ? 's' : ''}` : `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`}
            </span>
            {filterTranche !== 'all' && (
              <button onClick={() => setFilterTranche('all')} className="text-xs text-emerald-600 hover:underline">
                Réinitialiser
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-navy-500">
              Total encours :{' '}
              <span className="font-bold text-navy-900">{formatCurrency(totalGlobal)}</span>
            </span>
          </div>
        </div>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mr-3" />
              <span className="text-sm text-navy-500">Chargement des encours…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
              <p className="text-base font-semibold text-navy-700">
                {filterTranche === 'all' ? 'Aucun encours client' : `Aucune facture dans cette tranche`}
              </p>
              <p className="text-sm text-navy-400 mt-1">
                {filterTranche === 'all'
                  ? 'Toutes vos factures clients sont réglées.'
                  : 'Essayez une autre tranche de retard.'}
              </p>
              {filterTranche === 'all' && (
                <Link href="/factures" className="mt-4 text-sm text-emerald-600 hover:underline">
                  Gérer les factures →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-navy-400 border-b border-navy-100">
                    <th className="text-left pb-3 pr-4">Client</th>
                    <th className="text-left pb-3 pr-4">N° Facture</th>
                    <th className="text-left pb-3 pr-4">Échéance</th>
                    <th className="text-right pb-3 pr-4">Montant TTC</th>
                    <th className="text-right pb-3 pr-4">Restant dû</th>
                    <th className="text-right pb-3 pr-4">Retard</th>
                    <th className="text-right pb-3">Tranche</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {filtered.map(f => {
                    const cfg = TRANCHE_CONFIG[f.tranche as Tranche]
                    return (
                      <tr key={f.id} className="hover:bg-navy-50/40 transition-colors group">
                        <td className="py-3 pr-4 font-medium text-navy-800">{f.client_nom}</td>
                        <td className="py-3 pr-4 text-navy-500 font-mono text-xs">{f.numero_facture}</td>
                        <td className="py-3 pr-4 text-navy-500">
                          <div className="flex items-center gap-1.5">
                            {f.joursRetard > 30 && <Clock className="w-3.5 h-3.5 text-red-500" />}
                            {formatDate(f.date_echeance)}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-navy-700">
                          {formatCurrency(f.montant_ttc)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono font-bold text-navy-900">
                          {formatCurrency(f.resteA)}
                        </td>
                        <td className="py-3 pr-4 text-right text-navy-500">
                          {f.joursRetard > 0 ? `${f.joursRetard}j` : '—'}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-200">
                    <td colSpan={4} className="pt-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                      Total {filterTranche !== 'all' && `(${TRANCHE_CONFIG[filterTranche as Tranche].label})`}
                    </td>
                    <td className="pt-3 text-right font-mono font-bold text-navy-900">
                      {formatCurrency(filtered.reduce((sum, f) => sum + f.resteA, 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {/* Lien vers factures */}
        <div className="mt-6 flex justify-end">
          <Link
            href="/factures"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-600 hover:text-emerald-700 transition-colors"
          >
            Gérer les factures clients
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
