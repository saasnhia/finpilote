'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Zap,
  CheckCircle2,
  ArrowRightLeft,
  Wand2,
  Star,
  RotateCcw,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface AutoStats {
  factures_auto_pct: number
  factures_auto_count: number
  factures_total: number
  raps_auto_pct: number
  raps_auto_count: number
  raps_total: number
  active_rules: number
  avg_confidence: number
}

interface AutoLogEntry {
  id: string
  action_type: string
  entity_type: string
  entity_id: string | null
  rule_id: string | null
  metadata: Record<string, unknown>
  is_reversible: boolean
  is_reversed: boolean
  reversed_at: string | null
  created_at: string
}

interface AutoSettings {
  categorization_auto_apply: boolean
  categorization_min_confidence: number
  auto_matching_enabled: boolean
  auto_match_threshold: number
  suggest_threshold: number
  notify_on_auto_action: boolean
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  auto_match: {
    label: 'Rapprochement auto',
    icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
    color: 'text-emerald-400 bg-emerald-900/30',
  },
  match_suggested: {
    label: 'Suggestion rapprochement',
    icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
    color: 'text-yellow-400 bg-yellow-900/30',
  },
  categorization_applied: {
    label: 'Catégorisation auto',
    icon: <Wand2 className="h-3.5 w-3.5" />,
    color: 'text-blue-400 bg-blue-900/30',
  },
  categorization_suggested: {
    label: 'Suggestion catégorie',
    icon: <Wand2 className="h-3.5 w-3.5" />,
    color: 'text-slate-400 bg-slate-700/30',
  },
  rule_learned: {
    label: 'Règle apprise',
    icon: <Star className="h-3.5 w-3.5" />,
    color: 'text-purple-400 bg-purple-900/30',
  },
  rule_applied: {
    label: 'Règle appliquée',
    icon: <Wand2 className="h-3.5 w-3.5" />,
    color: 'text-emerald-400 bg-emerald-900/30',
  },
  import_processed: {
    label: 'Import traité',
    icon: <Zap className="h-3.5 w-3.5" />,
    color: 'text-cyan-400 bg-cyan-900/30',
  },
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days}j`
}

function CircleProgress({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  )
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className="flex-shrink-0 transition-colors disabled:opacity-50"
      aria-label="toggle"
    >
      {checked
        ? <ToggleRight className="h-7 w-7 text-emerald-400" />
        : <ToggleLeft className="h-7 w-7 text-slate-500" />
      }
    </button>
  )
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default function AutomatisationPage() {
  const [stats, setStats] = useState<AutoStats | null>(null)
  const [logs, setLogs] = useState<AutoLogEntry[]>([])
  const [settings, setSettings] = useState<AutoSettings | null>(null)
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsOffset, setLogsOffset] = useState(0)
  const LOGS_PER_PAGE = 20

  const [loading, setLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [reversingId, setReversingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const fetchAll = useCallback(async (offset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, logsRes, settingsRes] = await Promise.all([
        fetch('/api/automation/stats'),
        fetch(`/api/automation/log?limit=${LOGS_PER_PAGE}&offset=${offset}`),
        fetch('/api/automation/settings'),
      ])

      if (statsRes.ok) {
        setStats(await statsRes.json() as AutoStats)
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json() as { logs: AutoLogEntry[]; total: number }
        setLogs(logsData.logs)
        setLogsTotal(logsData.total)
        setLogsOffset(offset)
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json() as { settings: AutoSettings }
        setSettings(settingsData.settings)
      }
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll(0) }, [fetchAll])

  // ---- Reverse action ----
  async function handleReverse(logId: string) {
    if (!confirm('Annuler cette action automatique ?')) return
    setReversingId(logId)
    try {
      const res = await fetch(`/api/automation/reverse/${logId}`, { method: 'POST' })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        alert(data.error ?? 'Erreur')
        return
      }
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, is_reversed: true } : l))
    } finally {
      setReversingId(null)
    }
  }

  // ---- Toggle setting ----
  async function handleToggle(key: keyof AutoSettings) {
    if (!settings) return
    const newValue = !settings[key]
    const updated = { ...settings, [key]: newValue }
    setSettings(updated)
    setSettingsLoading(true)
    try {
      await fetch('/api/automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  async function handleThresholdChange(key: keyof AutoSettings, value: number) {
    if (!settings) return
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    setSettingsLoading(true)
    try {
      await fetch('/api/automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  // ----------------------------------------------------------------
  // KPI cards
  // ----------------------------------------------------------------
  const kpis = stats ? [
    {
      label: 'Factures catégorisées',
      sublabel: 'ce mois (auto)',
      pct: stats.factures_auto_pct,
      detail: `${stats.factures_auto_count} / ${stats.factures_total}`,
      color: '#22D3A5',
      icon: <Wand2 className="h-5 w-5 text-emerald-400" />,
      link: '/parametres/regles',
    },
    {
      label: 'Rapprochements auto',
      sublabel: 'sur total rapprochés',
      pct: stats.raps_auto_pct,
      detail: `${stats.raps_auto_count} / ${stats.raps_total}`,
      color: '#60a5fa',
      icon: <ArrowRightLeft className="h-5 w-5 text-blue-400" />,
      link: '/rapprochement',
    },
    {
      label: 'Règles actives',
      sublabel: 'catégorisation PCG',
      pct: null,
      detail: String(stats.active_rules),
      color: '#a78bfa',
      icon: <Star className="h-5 w-5 text-purple-400" />,
      link: '/parametres/regles',
    },
    {
      label: 'Confiance globale',
      sublabel: 'score moyen des règles',
      pct: stats.avg_confidence,
      detail: `${stats.avg_confidence}%`,
      color: stats.avg_confidence >= 80 ? '#22D3A5' : stats.avg_confidence >= 60 ? '#facc15' : '#f87171',
      icon: <CheckCircle2 className="h-5 w-5" style={{ color: stats.avg_confidence >= 80 ? '#22D3A5' : stats.avg_confidence >= 60 ? '#facc15' : '#f87171' }} />,
      link: null,
    },
  ] : []

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-400/10">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Automatisation</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Vue d'ensemble des actions automatiques et de l'apprentissage
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowSettings(s => !s)}
              className="flex items-center gap-2 text-sm"
            >
              {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Paramètres
            </Button>
            <Button variant="secondary" onClick={() => fetchAll(logsOffset)} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="!bg-red-900/30 !border-red-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Settings panel */}
        {showSettings && settings && (
          <Card>
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              Paramètres d'automatisation
              {settingsLoading && <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />}
            </h2>
            <div className="space-y-4">
              {/* Catégorisation auto-apply */}
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div>
                  <p className="text-sm text-white font-medium">Catégorisation automatique</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Applique automatiquement le compte PCG si confiance ≥ {settings.categorization_min_confidence}%
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.categorization_auto_apply}
                  onChange={() => handleToggle('categorization_auto_apply')}
                />
              </div>
              {/* Confiance min catégorisation */}
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Seuil de confiance catégorisation</p>
                  <p className="text-xs text-slate-400 mt-0.5">Actuel : {settings.categorization_min_confidence}%</p>
                </div>
                <input
                  type="range" min={60} max={100} step={5}
                  value={settings.categorization_min_confidence}
                  onChange={e => handleThresholdChange('categorization_min_confidence', parseInt(e.target.value))}
                  className="w-32 accent-emerald-400"
                />
              </div>
              {/* Auto matching */}
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div>
                  <p className="text-sm text-white font-medium">Rapprochement automatique</p>
                  <p className="text-xs text-slate-400 mt-0.5">Déclenché après chaque import bancaire</p>
                </div>
                <ToggleSwitch
                  checked={settings.auto_matching_enabled}
                  onChange={() => handleToggle('auto_matching_enabled')}
                />
              </div>
              {/* Seuil auto match */}
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Seuil auto-match</p>
                  <p className="text-xs text-slate-400 mt-0.5">Score ≥ {settings.auto_match_threshold}% → validé automatiquement</p>
                </div>
                <input
                  type="range" min={50} max={100} step={5}
                  value={settings.auto_match_threshold}
                  onChange={e => handleThresholdChange('auto_match_threshold', parseInt(e.target.value))}
                  className="w-32 accent-emerald-400"
                />
              </div>
              {/* Seuil suggestion */}
              <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Seuil de suggestion</p>
                  <p className="text-xs text-slate-400 mt-0.5">Score ≥ {settings.suggest_threshold}% → proposé en suggestion</p>
                </div>
                <input
                  type="range" min={20} max={85} step={5}
                  value={settings.suggest_threshold}
                  onChange={e => handleThresholdChange('suggest_threshold', parseInt(e.target.value))}
                  className="w-32 accent-emerald-400"
                />
              </div>
              {/* Notifications */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-white font-medium">Notifications actions auto</p>
                  <p className="text-xs text-slate-400 mt-0.5">Alertes lors d'actions automatiques importantes</p>
                </div>
                <ToggleSwitch
                  checked={settings.notify_on_auto_action}
                  onChange={() => handleToggle('notify_on_auto_action')}
                />
              </div>
            </div>
          </Card>
        )}

        {/* KPI cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} padding="sm" className="animate-pulse">
                <div className="h-20 bg-slate-700/30 rounded-lg" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <Card key={kpi.label} padding="sm" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-slate-800">
                    {kpi.icon}
                  </div>
                  {kpi.pct !== null && (
                    <div className="relative">
                      <CircleProgress pct={kpi.pct} color={kpi.color} size={44} />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                        {kpi.pct}%
                      </span>
                    </div>
                  )}
                  {kpi.pct === null && (
                    <span className="text-2xl font-bold text-white">{kpi.detail}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-tight">{kpi.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{kpi.sublabel}</p>
                  {kpi.pct !== null && (
                    <p className="text-xs text-slate-500 mt-1">{kpi.detail}</p>
                  )}
                </div>
                {kpi.link && (
                  <Link href={kpi.link} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    Voir détails →
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Log des actions */}
        <Card padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <h2 className="text-white font-semibold text-sm">
              Journal des actions automatiques
            </h2>
            <span className="text-xs text-slate-400">{logsTotal} entrée{logsTotal > 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Chargement…</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center">
              <Zap className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Aucune action automatique enregistrée.</p>
              <p className="text-slate-500 text-xs mt-1">Les actions apparaîtront ici après le premier import bancaire ou upload de facture.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-700/30">
                {logs.map(log => {
                  const info = ACTION_LABELS[log.action_type] ?? {
                    label: log.action_type,
                    icon: <Zap className="h-3.5 w-3.5" />,
                    color: 'text-slate-400 bg-slate-700/30',
                  }
                  const meta = log.metadata ?? {}
                  const isReverting = reversingId === log.id

                  return (
                    <div
                      key={log.id}
                      className={`flex items-center gap-3 px-4 py-3 ${log.is_reversed ? 'opacity-40' : 'hover:bg-slate-800/20'} transition-colors`}
                    >
                      {/* Action type badge */}
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                        {info.icon}
                        {info.label}
                      </span>

                      {/* Metadata summary */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 truncate">
                          {meta.fournisseur ? <strong>{String(meta.fournisseur)}</strong> : null}
                          {meta.compte_comptable ? <> → <span className="font-mono text-emerald-400">{String(meta.compte_comptable)}</span></> : null}
                          {meta.confidence !== undefined ? <span className="text-slate-400"> · {String(meta.confidence)}%</span> : null}
                          {meta.facture_id && !meta.compte_comptable ? <span className="text-slate-500"> facture …{String(meta.facture_id).slice(-8)}</span> : null}
                          {!meta.fournisseur && !meta.compte_comptable && !meta.facture_id ? (
                            <span className="text-slate-500">{log.entity_type} {log.entity_id ? `…${log.entity_id.slice(-8)}` : ''}</span>
                          ) : null}
                        </p>
                      </div>

                      {/* Time */}
                      <span className="flex-shrink-0 text-xs text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(log.created_at)}
                      </span>

                      {/* Reversed badge */}
                      {log.is_reversed && (
                        <span className="flex-shrink-0 text-xs text-slate-500 italic">Annulé</span>
                      )}

                      {/* Reverse button */}
                      {log.is_reversible && !log.is_reversed && (
                        <button
                          onClick={() => handleReverse(log.id)}
                          disabled={isReverting}
                          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 border border-slate-600 hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Annuler cette action"
                        >
                          {isReverting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Annuler
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {logsTotal > LOGS_PER_PAGE && (
                <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-slate-700/50">
                  <Button
                    variant="ghost"
                    onClick={() => fetchAll(Math.max(0, logsOffset - LOGS_PER_PAGE))}
                    disabled={logsOffset === 0 || loading}
                    className="text-xs"
                  >
                    ← Précédent
                  </Button>
                  <span className="text-xs text-slate-400">
                    {logsOffset + 1}–{Math.min(logsOffset + LOGS_PER_PAGE, logsTotal)} / {logsTotal}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => fetchAll(logsOffset + LOGS_PER_PAGE)}
                    disabled={logsOffset + LOGS_PER_PAGE >= logsTotal || loading}
                    className="text-xs"
                  >
                    Suivant →
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Card padding="sm" hover className="cursor-pointer" onClick={() => window.location.href = '/parametres/regles'}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-900/30">
                <Wand2 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Règles de catégorisation</p>
                <p className="text-xs text-slate-400">Gérer les règles PCG</p>
              </div>
            </div>
          </Card>
          <Card padding="sm" hover className="cursor-pointer" onClick={() => window.location.href = '/rapprochement'}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-900/30">
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Rapprochement bancaire</p>
                <p className="text-xs text-slate-400">Valider les suggestions</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </AppShell>
  )
}
