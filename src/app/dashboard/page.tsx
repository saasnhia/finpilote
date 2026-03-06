'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { ExportFECModal, InsightsPanel, UniversalImportHub, ImportHistoryList } from '@/components/dashboard'
import { EntrepriseDashboardPanel } from '@/components/entreprise/KpiCards'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import {
  Clock,
  AlertCircle,
  Euro,
  Bell,
  Download,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  Users,
  FolderOpen,
  Landmark,
  ShoppingCart,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Zap,
  Award,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import type { BalanceAgeeItem } from '../api/dashboard/summary/route'

// ─── Category labels FR ──────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  sales: 'Ventes',
  other: 'Autre',
  services: 'Services',
  rent: 'Loyer',
  insurance: 'Assurances',
  salary: 'Salaires',
  salaries: 'Salaires',
  utilities: 'Charges',
  transport: 'Transport',
  subscriptions: 'Abonnements',
  loan_payments: 'Emprunts',
  supplies: 'Fournitures',
  marketing: 'Marketing',
}

function translateCategory(cat: string | null): string {
  if (!cat) return 'Non categorise'
  return CATEGORY_LABELS[cat] ?? cat
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileType = 'cabinet' | 'entreprise'

interface RapprochementItem {
  id: string
  montant: number
  confidence_score: number
  facture: { fournisseur: string | null; montant_ttc: number | null; date_facture: string | null }[] | null
  transaction: { description: string; date: string; amount: number }[] | null
}

interface TransactionItem {
  id: string
  date: string
  description: string
  amount: number
  category: string | null
  status: string
}

interface DashboardKPIs {
  // Cabinet
  dossiers_actifs: number
  factures_en_retard_count: number
  // Entreprise
  encours_clients: number
  count_en_attente: number
  total_en_retard: number
  count_en_retard: number
  fournisseurs_a_payer: number
  tresorerie: number
  // Communs
  tva_nette: number | null
  tva_statut: string | null
  alertes_count: number
  alertes_critiques: number
}

interface DashboardData {
  profile_type: ProfileType
  kpis: DashboardKPIs
  balance_agee_clients: BalanceAgeeItem[]
  balance_agee_fournisseurs: BalanceAgeeItem[]
  rapprochements: RapprochementItem[]
  transactions: TransactionItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

const TRANCHE_LABELS: Record<string, string> = {
  non_echu: 'Non échu',
  '0_30': '0–30j',
  '31_60': '31–60j',
  '61_90': '61–90j',
  plus_90: '+90j',
}

const TRANCHE_COLORS: Record<string, string> = {
  non_echu: 'bg-navy-100 text-navy-600',
  '0_30': 'bg-amber-100 text-amber-700',
  '31_60': 'bg-orange-100 text-orange-700',
  '61_90': 'bg-red-100 text-red-700',
  plus_90: 'bg-red-200 text-red-800 font-semibold',
}

// ─── KPI card simple ──────────────────────────────────────────────────────────

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  accent: string
  variant: 'default' | 'danger' | 'warning' | 'success'
  loading?: boolean
  sparklineData?: number[]
  sparklineColor?: string
}

// ─── Mini sparkline SVG ─────────────────────────────────────────────────────

function SparkLine({ data, color = '#22D3A5', height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 100
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

function SimpleKPICard({ title, value, subtitle, icon, accent, variant, loading, sparklineData, sparklineColor }: KPICardProps) {
  const variantBg: Record<string, string> = {
    default: 'bg-white',
    danger: 'bg-red-50',
    warning: 'bg-amber-50',
    success: 'bg-emerald-50',
  }
  const variantText: Record<string, string> = {
    default: 'text-navy-900',
    danger: 'text-red-700',
    warning: 'text-amber-700',
    success: 'text-emerald-700',
  }

  return (
    <div className={`rounded-xl border border-navy-100 ${variantBg[variant]} p-5 relative overflow-hidden`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent} rounded-l-xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-navy-500 uppercase tracking-wide mb-1">{title}</p>
          {loading ? (
            <div className="h-7 w-24 bg-navy-100 animate-pulse rounded" />
          ) : (
            <p className={`text-2xl font-bold font-display ${variantText[variant]}`}>{value}</p>
          )}
          <p className="text-xs text-navy-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${variantBg[variant]} border border-navy-100`}>
          {icon}
        </div>
      </div>
      {/* TODO: brancher les vraies données historiques (7 derniers jours) */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-3 -mx-1">
          <SparkLine data={sparklineData} color={sparklineColor} height={40} />
        </div>
      )}
    </div>
  )
}

// ─── Widget balance âgée (générique) ─────────────────────────────────────────

interface BalanceAgeeWidgetProps {
  items: BalanceAgeeItem[]
  loading: boolean
  mode: 'clients' | 'fournisseurs'
}

function BalanceAgeeWidget({ items, loading, mode }: BalanceAgeeWidgetProps) {
  const linkHref = '/audit/balance-agee'
  const label = mode === 'clients' ? 'Balance âgée clients' : 'Balance âgée fournisseurs'
  const emptyLabel = mode === 'clients' ? 'Aucun encours client' : 'Aucune facture fournisseur en attente'

  return (
    <Card className="lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-navy-500" />
          <h2 className="text-base font-display font-semibold text-navy-900">{label}</h2>
          {mode === 'fournisseurs' && (
            <span className="text-[10px] bg-navy-100 text-navy-500 px-1.5 py-0.5 rounded font-medium">
              Éch. estimée j+30
            </span>
          )}
        </div>
        <Link href={linkHref} className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
          Voir tout <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-navy-50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-navy-600">{emptyLabel}</p>
          <p className="text-xs text-navy-400 mt-1">Toutes les factures sont à jour</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-medium text-navy-400 border-b border-navy-100">
                <th className="text-left pb-2">{mode === 'clients' ? 'Client' : 'Fournisseur'}</th>
                <th className="text-left pb-2">N° Facture</th>
                <th className="text-left pb-2">Échéance</th>
                <th className="text-right pb-2">Restant dû</th>
                <th className="text-right pb-2">Retard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {items.slice(0, 8).map(f => (
                <tr key={f.id} className="hover:bg-navy-50/50 transition-colors">
                  <td className="py-2.5 pr-3 font-medium text-navy-800 truncate max-w-[120px]">
                    {f.nom}
                  </td>
                  <td className="py-2.5 pr-3 text-navy-500 font-mono text-xs">
                    {f.numero_facture}
                  </td>
                  <td className="py-2.5 pr-3 text-navy-500">
                    {formatDate(f.date_reference)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono font-semibold text-navy-900">
                    {formatCurrency(f.resteA)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] ${TRANCHE_COLORS[f.tranche]}`}>
                      {TRANCHE_LABELS[f.tranche]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length > 8 && (
            <div className="mt-3 text-center">
              <Link href={linkHref} className="text-xs text-emerald-600 hover:underline">
                + {items.length - 8} autres factures
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { subscription, isActive, initialized } = useSubscription()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFECModal, setShowFECModal] = useState(false)
  const [extraKpis, setExtraKpis] = useState<{ caHT: number | null; chargesHT: number | null; facturesCount: number; facturesClientsCount: number }>({ caHT: null, chargesHT: null, facturesCount: 0, facturesClientsCount: 0 })
  const [extraLoading, setExtraLoading] = useState(false)

  // Redirect to pricing only once both auth and subscription are fully loaded
  useEffect(() => {
if (!authLoading && initialized && user && !isActive) {
      router.push('/pricing?message=subscription_required')
    }
  }, [authLoading, initialized, user, isActive, router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/summary')
      const json = await res.json()
      if (json.success) setData(json as DashboardData)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user && isActive) fetchData()
    else if (!user) setLoading(false)
  }, [user, isActive, fetchData])

  useEffect(() => {
    if (!user?.id || !isActive) return
    void (async () => {
      setExtraLoading(true)
      try {
        const supabase = createClient()
        const year = new Date().getFullYear()
        const startOfYear = `${year}-01-01`
        const [caRes, chargesRes] = await Promise.all([
          supabase.from('factures_clients').select('total_ht').eq('user_id', user.id).gte('date_emission', startOfYear),
          supabase.from('factures').select('montant_ht').eq('user_id', user.id).gte('date_facture', startOfYear),
        ])
        const caHT = caRes.data ? caRes.data.reduce((s: number, r: { total_ht: number | null }) => s + (r.total_ht ?? 0), 0) : null
        const chargesHT = chargesRes.data ? chargesRes.data.reduce((s: number, r: { montant_ht: number | null }) => s + (r.montant_ht ?? 0), 0) : null
        const facturesClientsCount = caRes.data?.length ?? 0
        const facturesCount = chargesRes.data?.length ?? 0
        setExtraKpis({ caHT, chargesHT, facturesCount, facturesClientsCount })
      } catch {
        // silently fail
      } finally {
        setExtraLoading(false)
      }
    })()
  }, [user?.id, isActive])

  const handleValidateRapprochement = async (id: string) => {
    try {
      await fetch(`/api/rapprochement/${id}/validate`, { method: 'POST' })
      setData(prev =>
        prev ? { ...prev, rapprochements: prev.rapprochements.filter(r => r.id !== id) } : prev
      )
      toast.success('Rapprochement validé')
    } catch {
      toast.error('Erreur lors de la validation')
    }
  }

  const profileType: ProfileType = data?.profile_type ?? 'cabinet'
  const kpis = data?.kpis
  const rapprochements = data?.rapprochements ?? []
  const transactions = data?.transactions ?? []
  const balanceAgee =
    profileType === 'cabinet'
      ? (data?.balance_agee_fournisseurs ?? [])
      : (data?.balance_agee_clients ?? [])

  // ── KPIs adaptatifs ───────────────────────────────────────────────────────
  const kpiCards: KPICardProps[] = profileType === 'cabinet'
    ? [
        {
          title: 'Dossiers actifs',
          value: kpis ? String(kpis.dossiers_actifs) : '—',
          subtitle: kpis
            ? `${kpis.dossiers_actifs} dossier${kpis.dossiers_actifs !== 1 ? 's' : ''} en cours`
            : 'Chargement…',
          icon: <FolderOpen className="w-5 h-5 text-blue-600" />,
          accent: 'bg-blue-500',
          variant: 'default',
          loading,
        },
        {
          title: 'Factures en retard',
          value: kpis ? String(kpis.factures_en_retard_count) : '—',
          subtitle: kpis && kpis.factures_en_retard_count > 0
            ? `Éch. fournisseurs dépassée`
            : 'Aucun retard fournisseur',
          icon: <Clock className="w-5 h-5 text-red-600" />,
          accent: 'bg-red-500',
          variant: kpis && kpis.factures_en_retard_count > 0 ? 'danger' : 'default',
          loading,
        },
        {
          title: 'TVA du mois',
          value: kpis?.tva_nette != null ? formatCurrency(kpis.tva_nette) : 'Aucune décl.',
          subtitle: kpis?.tva_statut ? `Statut : ${kpis.tva_statut}` : 'Pas de déclaration',
          icon: <Euro className="w-5 h-5 text-amber-600" />,
          accent: 'bg-amber-500',
          variant: kpis?.tva_nette != null && kpis.tva_nette > 0 ? 'warning' : 'default',
          loading,
        },
        {
          title: 'Alertes actives',
          value: kpis ? String(kpis.alertes_count) : '—',
          subtitle: kpis
            ? kpis.alertes_critiques > 0
              ? `dont ${kpis.alertes_critiques} critique${kpis.alertes_critiques > 1 ? 's' : ''}`
              : 'Aucune critique'
            : 'Chargement…',
          icon: <Bell className="w-5 h-5 text-purple-600" />,
          accent: 'bg-purple-500',
          variant: kpis && kpis.alertes_critiques > 0 ? 'danger' : 'default',
          loading,
        },
      ]
    : [
        {
          title: 'Encours clients',
          value: kpis ? formatCurrency(kpis.encours_clients) : '—',
          subtitle: kpis
            ? `${kpis.count_en_attente} facture${kpis.count_en_attente !== 1 ? 's' : ''} en attente`
            : 'Chargement…',
          icon: <Users className="w-5 h-5 text-blue-600" />,
          accent: 'bg-blue-500',
          variant: 'default',
          loading,
        },
        {
          title: 'Fournisseurs à payer',
          value: kpis ? formatCurrency(kpis.fournisseurs_a_payer) : '—',
          subtitle: kpis && kpis.count_en_retard > 0
            ? `dont ${kpis.count_en_retard} en retard`
            : 'Pas de retard',
          icon: <ShoppingCart className="w-5 h-5 text-red-600" />,
          accent: 'bg-red-500',
          variant: kpis && kpis.count_en_retard > 0 ? 'danger' : 'default',
          loading,
        },
        {
          title: 'Trésorerie estimée',
          value: kpis != null ? formatCurrency(kpis.tresorerie) : '—',
          subtitle: 'Solde bancaire importé',
          icon: <Landmark className="w-5 h-5 text-emerald-600" />,
          accent: 'bg-emerald-500',
          variant: kpis && kpis.tresorerie < 0 ? 'danger' : 'success',
          loading,
        },
        {
          title: 'Alertes actives',
          value: kpis ? String(kpis.alertes_count) : '—',
          subtitle: kpis
            ? kpis.alertes_critiques > 0
              ? `dont ${kpis.alertes_critiques} critique${kpis.alertes_critiques > 1 ? 's' : ''}`
              : 'Aucune critique'
            : 'Chargement…',
          icon: <Bell className="w-5 h-5 text-purple-600" />,
          accent: 'bg-purple-500',
          variant: kpis && kpis.alertes_critiques > 0 ? 'danger' : 'default',
          loading,
        },
      ]

  // Wait for both auth and subscription to finish loading
  if (authLoading || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Bandeau essai gratuit urgent */}
        {(() => {
          const sub = subscription
          if (!sub || sub.status !== 'trialing' || !sub.current_period_end) return null
          const daysLeft = Math.max(0, Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86400000))
          if (daysLeft > 3) return null
          return (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 font-medium">
                Votre essai gratuit expire dans {daysLeft} jour{daysLeft !== 1 ? 's' : ''} !
              </span>
              <Link
                href="/pricing"
                className="ml-auto flex-shrink-0 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                Passer au plan payant →
              </Link>
            </div>
          )
        })()}

        {/* Bandeau e-invoicing */}
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
          <span className="text-emerald-700 font-medium">✅ Worthifast est conforme e-invoicing 2026 (Factur-X / EN16931)</span>
          <Link href="/comptabilite/factures/einvoicing" className="ml-auto flex-shrink-0 text-emerald-700 hover:underline text-xs font-medium">
            En savoir plus →
          </Link>
        </div>

        {/* ── Highlights WOW ─────────────────────────────────────────── */}
        {(() => {
          const totalDocs = extraKpis.facturesCount + extraKpis.facturesClientsCount
          const hoursSaved = Math.round(totalDocs * 0.15 * 10) / 10
          const moneySaved = Math.round(hoursSaved * 35)
          const isExpert = totalDocs >= 100
          return totalDocs > 0 || !extraLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/60 border border-emerald-200">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Euro className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700">{moneySaved > 0 ? `${moneySaved} €` : '—'}</p>
                  <p className="text-[11px] text-emerald-600">économisés cette année</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/60 border border-blue-200">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-700">{hoursSaved > 0 ? `${hoursSaved}h` : '—'}</p>
                  <p className="text-[11px] text-blue-600">de saisie automatisée</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/60 border border-purple-200">
                <div className="p-2 bg-purple-500 rounded-lg">
                  {isExpert ? <Award className="w-4 h-4 text-white" /> : <Target className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-700">{isExpert ? 'Expert' : `${totalDocs} docs`}</p>
                  <p className="text-[11px] text-purple-600">{isExpert ? `${totalDocs} documents traités` : 'précision OCR 98 %'}</p>
                </div>
              </div>
            </div>
          ) : null
        })()}

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-900">Tableau de bord</h1>
            <p className="mt-1 text-sm text-navy-500">
              {profileType === 'cabinet'
                ? 'Vue cabinet — gestion multi-dossiers'
                : 'Vue entreprise — gestion comptable'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Badge mode actif */}
            {!loading && (
              <Link
                href="/settings"
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  profileType === 'cabinet'
                    ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
                title="Changer de profil dans les paramètres"
              >
                {profileType === 'cabinet' ? '🏢 Cabinet' : '📊 Entreprise'}
              </Link>
            )}
            <button
              onClick={() => setShowFECModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-navy-600 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export FEC
            </button>
          </div>
        </div>

        {/* KPI Cards — adaptatifs selon profile_type */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((card, i) => (
            <SimpleKPICard key={i} {...card} />
          ))}
        </div>

        {/* ── Mini graphique activité semaine ──────────────────────────── */}
        {!loading && transactions.length > 0 && (() => {
          const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
          const counts = new Array(7).fill(0) as number[]
          const now = new Date()
          const dayOfWeek = (now.getDay() + 6) % 7 // Monday=0
          transactions.forEach(t => {
            const d = new Date(t.date)
            const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
            if (diff >= 0 && diff < 7) {
              const idx = (dayOfWeek - diff + 7) % 7
              counts[idx]++
            }
          })
          const max = Math.max(...counts, 1)
          return (
            <div className="mb-8 p-5 rounded-xl border border-navy-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Activité cette semaine</h3>
                <span className="text-xs text-navy-400">{transactions.length} transactions récentes</span>
              </div>
              <div className="flex items-end gap-2 h-16">
                {counts.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-emerald-400 transition-all duration-500"
                      style={{ height: `${Math.max((c / max) * 100, 4)}%` }}
                    />
                    <span className="text-[10px] text-navy-400">{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── KPIs Financiers étendus ─────────────────────────────────── */}
        <div className="space-y-5 mb-8">

          {/* Trésorerie */}
          <div>
            <h3 className="text-[11px] font-semibold text-navy-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Trésorerie
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SimpleKPICard
                title="Solde bancaire"
                value={kpis != null ? formatCurrency(kpis.tresorerie) : '—'}
                subtitle="Dernier relevé importé"
                icon={<Landmark className="w-5 h-5 text-emerald-600" />}
                accent="bg-emerald-500"
                variant={kpis && kpis.tresorerie < 0 ? 'danger' : 'success'}
                loading={loading}
              />
              <SimpleKPICard
                title="BFR estimé"
                value={kpis != null ? formatCurrency(kpis.encours_clients - kpis.fournisseurs_a_payer) : '—'}
                subtitle="Encours clients − fournisseurs"
                icon={kpis != null && (kpis.encours_clients - kpis.fournisseurs_a_payer) >= 0
                  ? <TrendingUp className="w-5 h-5 text-blue-600" />
                  : <TrendingDown className="w-5 h-5 text-red-600" />}
                accent="bg-blue-500"
                variant={kpis != null && (kpis.encours_clients - kpis.fournisseurs_a_payer) < 0 ? 'danger' : 'default'}
                loading={loading}
              />
              <SimpleKPICard
                title="Prévisionnel J+30"
                value="—"
                subtitle="Indisponible — connecter banque"
                icon={<Target className="w-5 h-5 text-navy-400" />}
                accent="bg-navy-300"
                variant="default"
                loading={false}
              />
              <SimpleKPICard
                title="Var. mois précédent"
                value="—"
                subtitle="Nécessite historique 2 mois"
                icon={<TrendingUp className="w-5 h-5 text-navy-400" />}
                accent="bg-navy-300"
                variant="default"
                loading={false}
              />
            </div>
          </div>

          {/* P&L */}
          <div>
            <h3 className="text-[11px] font-semibold text-navy-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Compte de résultat (YTD)
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SimpleKPICard
                title="CA HT (clients)"
                value={extraKpis.caHT != null ? formatCurrency(extraKpis.caHT) : '—'}
                subtitle={`Factures clients ${new Date().getFullYear()}`}
                icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
                accent="bg-emerald-500"
                variant="success"
                loading={extraLoading}
              />
              <SimpleKPICard
                title="Charges HT"
                value={extraKpis.chargesHT != null ? formatCurrency(extraKpis.chargesHT) : '—'}
                subtitle={`Factures fournisseurs ${new Date().getFullYear()}`}
                icon={<ArrowDownRight className="w-5 h-5 text-red-600" />}
                accent="bg-red-500"
                variant={extraKpis.chargesHT != null && extraKpis.chargesHT > 0 ? 'warning' : 'default'}
                loading={extraLoading}
              />
              <SimpleKPICard
                title="Marge brute"
                value={extraKpis.caHT != null && extraKpis.chargesHT != null
                  ? formatCurrency(extraKpis.caHT - extraKpis.chargesHT)
                  : '—'}
                subtitle={extraKpis.caHT != null && extraKpis.caHT > 0 && extraKpis.chargesHT != null
                  ? `Taux : ${Math.round(((extraKpis.caHT - extraKpis.chargesHT) / extraKpis.caHT) * 100)} %`
                  : 'CA clients – charges'}
                icon={<Euro className="w-5 h-5 text-amber-600" />}
                accent="bg-amber-500"
                variant={extraKpis.caHT != null && extraKpis.chargesHT != null && (extraKpis.caHT - extraKpis.chargesHT) < 0 ? 'danger' : 'default'}
                loading={extraLoading}
              />
              <SimpleKPICard
                title="CA N-1"
                value="—"
                subtitle="Données année précédente"
                icon={<TrendingDown className="w-5 h-5 text-navy-400" />}
                accent="bg-navy-300"
                variant="default"
                loading={false}
              />
            </div>
          </div>

          {/* Recouvrement */}
          <div>
            <h3 className="text-[11px] font-semibold text-navy-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Recouvrement clients
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SimpleKPICard
                title="Encours clients"
                value={kpis ? formatCurrency(kpis.encours_clients) : '—'}
                subtitle={kpis ? `${kpis.count_en_attente} facture${kpis.count_en_attente !== 1 ? 's' : ''} en attente` : 'Chargement…'}
                icon={<ReceiptText className="w-5 h-5 text-blue-600" />}
                accent="bg-blue-500"
                variant="default"
                loading={loading}
                sparklineData={[42, 45, 40, 48, 52, 47, 50]}
                sparklineColor="#3b82f6"
              />
              <SimpleKPICard
                title="Retard clients"
                value={kpis ? formatCurrency(kpis.total_en_retard) : '—'}
                subtitle={kpis ? `${kpis.count_en_retard} facture${kpis.count_en_retard !== 1 ? 's' : ''} en retard` : 'Chargement…'}
                icon={<Clock className="w-5 h-5 text-red-600" />}
                accent="bg-red-500"
                variant={kpis && kpis.count_en_retard > 0 ? 'danger' : 'default'}
                loading={loading}
                sparklineData={[18, 22, 20, 25, 19, 21, 17]}
                sparklineColor="#ef4444"
              />
              <SimpleKPICard
                title="DSO (jours)"
                value={kpis != null && extraKpis.caHT != null && extraKpis.caHT > 0
                  ? `${Math.round((kpis.encours_clients / (extraKpis.caHT / 365)))} j`
                  : '—'}
                subtitle="Délai moyen recouvrement"
                icon={<Target className="w-5 h-5 text-amber-600" />}
                accent="bg-amber-500"
                variant="default"
                loading={loading || extraLoading}
                sparklineData={[35, 33, 37, 34, 31, 32, 30]}
                sparklineColor="#f59e0b"
              />
              <SimpleKPICard
                title="Taux retard"
                value={kpis != null && kpis.encours_clients > 0
                  ? `${Math.round((kpis.total_en_retard / kpis.encours_clients) * 100)} %`
                  : '—'}
                subtitle="Retard / encours total"
                icon={kpis != null && kpis.encours_clients > 0 && (kpis.total_en_retard / kpis.encours_clients) > 0.2
                  ? <TrendingDown className="w-5 h-5 text-red-600" />
                  : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                accent={kpis != null && kpis.encours_clients > 0 && (kpis.total_en_retard / kpis.encours_clients) > 0.2 ? 'bg-red-500' : 'bg-emerald-500'}
                variant={kpis != null && kpis.encours_clients > 0 && (kpis.total_en_retard / kpis.encours_clients) > 0.2 ? 'danger' : 'success'}
                loading={loading}
                sparklineData={[15, 18, 14, 16, 12, 13, 11]}
                sparklineColor="#22D3A5"
              />
            </div>
          </div>

        </div>

        {/* Panel KPIs entreprise enrichis + graphique 6 mois */}
        {profileType === 'entreprise' && (
          <div className="mb-8">
            <EntrepriseDashboardPanel />
          </div>
        )}

        {/* Row 1: Balance âgée (2/3) + Rapprochements (1/3) */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <BalanceAgeeWidget
            items={balanceAgee}
            loading={loading}
            mode={profileType === 'cabinet' ? 'fournisseurs' : 'clients'}
          />

          {/* Rapprochements à valider */}
          <Card className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-semibold text-navy-900">Rapprochements</h2>
              <Link href="/rapprochement" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                Gérer <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-navy-50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : rapprochements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mb-2" />
                <p className="text-sm text-navy-500">Tout est validé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rapprochements.map(r => (
                  <div key={r.id} className="p-3 bg-navy-50 rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-navy-700 truncate">
                          {Array.isArray(r.facture) ? r.facture[0]?.fournisseur ?? '—' : '—'}
                        </p>
                        <p className="text-xs text-navy-400 truncate">
                          {Array.isArray(r.transaction) ? r.transaction[0]?.description ?? '—' : '—'}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-navy-800 whitespace-nowrap">
                        {formatCurrency(r.montant)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-navy-400">
                        Confiance : {Math.round(r.confidence_score)}%
                      </span>
                      <button
                        onClick={() => handleValidateRapprochement(r.id)}
                        className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Valider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Row 2: Activité récente (1/2) + Import + InsightsPanel (1/2) */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Activité récente */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-semibold text-navy-900">Activité récente</h2>
              <Link href="/transactions" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                Toutes <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-navy-50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-navy-400 py-6 text-center">Aucune transaction récente</p>
            ) : (
              <div className="space-y-1">
                {transactions.map(t => {
                  const isCredit = t.amount > 0
                  return (
                    <div key={t.id} className="flex items-center gap-3 py-2 border-b border-navy-50 last:border-0">
                      <div className={`p-1.5 rounded-lg ${isCredit ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {isCredit
                          ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                          : <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-navy-800 truncate">{t.description}</p>
                        <p className="text-[11px] text-navy-400">{formatDate(t.date)} &middot; {translateCategory(t.category)}</p>
                      </div>
                      <span className={`text-xs font-mono font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : ''}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Import + Recommandations IA */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-navy-400" />
                <h2 className="text-base font-display font-semibold text-navy-900">Importer un fichier</h2>
              </div>
              <p className="text-xs text-navy-400 mb-3">PDF, Excel, CSV, FEC — détection intelligente du type</p>
              <UniversalImportHub />
              <ImportHistoryList />
            </Card>

            <InsightsPanel userId={user?.id} />
          </div>
        </div>
      </div>

      {showFECModal && <ExportFECModal onClose={() => setShowFECModal(false)} />}
    </AppShell>
  )
}
