'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { Users, Monitor, Clock, Download, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react'
import { useUserPlan } from '@/hooks/useUserPlan'
import { getUserLimit, getUserLimitLabel, getUpgradePrice } from '@/lib/auth/user-limit'
import type { Plan } from '@/lib/auth/check-plan'

interface SessionRow {
  id: string
  session_token: string
  last_active: string
  created_at: string
}

interface SlotData {
  active: number
  limit: number | null
  limitLabel: string
  plan: string
  sessions: SessionRow[]
}

export default function AdminUsersPage() {
  const { plan } = useUserPlan()
  const [data, setData] = useState<SlotData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [slotRes, sessRes] = await Promise.all([
        fetch('/api/auth/verify-slot'),
        fetch('/api/auth/sessions'),
      ])
      const slot = await slotRes.json()
      const sess = sessRes.ok ? await sessRes.json() : { sessions: [] }
      setData({
        active: slot.active ?? 0,
        limit: slot.limit === Infinity ? null : (slot.limit ?? null),
        limitLabel: slot.limitLabel ?? '∞',
        plan: slot.plan ?? plan,
        sessions: sess.sessions ?? [],
      })
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])  // eslint-disable-line

  const exportCSV = () => {
    if (!data?.sessions.length) return
    const rows = [
      ['ID session (tronqué)', 'Dernière activité', 'Créé le'],
      ...data.sessions.map(s => [
        s.session_token.slice(0, 12) + '…',
        new Date(s.last_active).toLocaleString('fr-FR'),
        new Date(s.created_at).toLocaleString('fr-FR'),
      ]),
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finsoft-sessions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const limit = getUserLimit(plan as Plan)
  const atLimit = limit !== null && (data?.active ?? 0) >= limit
  const upgradePrice = getUpgradePrice(plan as Plan)

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Gestion des utilisateurs
            </h1>
            <p className="text-sm text-navy-500 mt-1">
              Sessions actives sur votre licence FinSoft
            </p>
          </div>
          <button
            onClick={exportCSV}
            disabled={!data?.sessions.length}
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy-600 border border-navy-200 rounded-lg hover:bg-navy-50 disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Quota card */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
              ${atLimit ? 'bg-coral-100' : 'bg-emerald-100'}
            `}>
              {atLimit
                ? <AlertTriangle className="w-6 h-6 text-coral-600" />
                : <CheckCircle className="w-6 h-6 text-emerald-600" />
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-navy-700 capitalize">
                Plan {data?.plan ?? plan}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${atLimit ? 'bg-coral-500' : 'bg-emerald-500'}`}
                    style={{
                      width: limit
                        ? `${Math.min(100, ((data?.active ?? 0) / limit) * 100)}%`
                        : '10%',
                    }}
                  />
                </div>
                <span className={`text-sm font-semibold ${atLimit ? 'text-coral-600' : 'text-navy-700'}`}>
                  {loading ? '…' : `${data?.active ?? 0} / ${data?.limitLabel ?? getUserLimitLabel(plan as Plan)}`}
                  {' '}actifs
                </span>
              </div>
            </div>
          </div>

          {/* Upsell if at limit */}
          {atLimit && upgradePrice && (
            <div className="mt-4 pt-4 border-t border-coral-100 flex items-center justify-between">
              <p className="text-sm text-coral-700">
                Limite atteinte — passez au plan supérieur pour ajouter des sessions.
              </p>
              <Link
                href="/#tarifs"
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:underline whitespace-nowrap"
              >
                Upgrade {upgradePrice}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </Card>

        {/* Sessions list */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-navy-400" />
            <h2 className="text-base font-display font-semibold text-navy-900">
              Sessions actives (15 min)
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-navy-400 text-sm">Chargement…</div>
          ) : !data?.sessions.length ? (
            <div className="py-8 text-center">
              <Monitor className="w-10 h-10 text-navy-200 mx-auto mb-2" />
              <p className="text-sm text-navy-400">Aucune session active</p>
              <p className="text-xs text-navy-300 mt-1">
                Les sessions s&apos;enregistrent automatiquement lors de la navigation dans l&apos;app.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-navy-50">
              {data.sessions.map((session, i) => (
                <div key={session.id} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-4 h-4 text-navy-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-700">
                      Appareil #{i + 1}
                      <span className="ml-2 text-xs text-navy-400 font-mono">
                        {session.session_token.slice(0, 8)}…
                      </span>
                    </p>
                    <p className="text-xs text-navy-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Actif {new Date(session.last_active).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Actif
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <p className="mt-4 text-xs text-navy-400 text-center">
          Les sessions inactives depuis plus de 20 minutes sont supprimées automatiquement.
        </p>
      </div>
    </AppShell>
  )
}
