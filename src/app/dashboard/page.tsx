'use client'

import { useMemo } from 'react'
import { Header } from '@/components/layout'
import { Card } from '@/components/ui'
import {
  KPICard,
  BreakEvenChart,
  BreakEvenGauge,
  DataInputForm,
  AlertDetailModal,
  ComparativeMetrics,
  InsightsPanel,
  ExportFECModal,
} from '@/components/dashboard'
import { useAuth } from '@/hooks/useAuth'
import { useFinancialData } from '@/hooks/useFinancialData'
import { calculateKPIs, generateChartData, formatCurrency } from '@/lib/calculations'
import { getSectorBenchmark, compareToBenchmark } from '@/lib/benchmarks/sector-data'
import { analyzeResult } from '@/lib/analysis/result-analyzer'
import {
  Target,
  TrendingUp,
  Calendar,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Bell,
  Download,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import type { Alert } from '@/types'
import React, { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { 
    currentData, 
    history, 
    loading: dataLoading, 
    saveData 
  } = useFinancialData(user?.id)

  const [parsedData, setParsedData] = useState<ParsedFields | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importedData, setImportedData] = useState<any>(null)

  // Phase 4 state
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [showFECModal, setShowFECModal] = useState(false)

  // Fetch alerts on mount
  React.useEffect(() => {
    if (!user) return
    const fetchAlerts = async () => {
      try {
        // Generate alerts first
        await fetch('/api/alerts', { method: 'POST' })
        // Then fetch them
        const res = await fetch('/api/alerts?statut=nouvelle')
        const data = await res.json()
        if (data.success) setAlerts(data.alerts || [])
      } catch (e) {
        // Silently fail - alerts are non-critical
      }
    }
    fetchAlerts()
  }, [user])

  const handleResolveAlert = async (id: string, statut: 'resolue' | 'ignoree', notes?: string) => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, notes }),
      })
      setAlerts(prev => prev.filter(a => a.id !== id))
      setSelectedAlert(null)
    } catch (e) {
      console.error('Error resolving alert:', e)
    }
  }

  const kpis = useMemo(() => {
    if (!currentData) return null
    return calculateKPIs(currentData)
  }, [currentData])

  const chartData = useMemo(() => {
    if (!history.length) return []
    return generateChartData(history)
  }, [history])

  const loading = authLoading || dataLoading

  const ALL_FIELDS = [
    'chiffreAffaires',
    'loyer',
    'salaires',
    'assurances',
    'abonnements',
    'emprunts',
    'autres',
    'tauxChargesVariables',
  ]

  const missingFields = React.useMemo(() => {
    if (!parsedData) return ALL_FIELDS
    return ALL_FIELDS.filter(f => !parsedData.detectedFields?.includes(f))
  }, [parsedData])

  function handleParsedData(data: any) {
    if (data === 'loading') {
      setImportLoading(true)
      setParsedData(null)
    } else {
      setImportLoading(false)
      setParsedData(data)
    }
  }

  function handleValidateImport(data: ParsedFields) {
    setImportedData({
      revenue: data.chiffreAffaires || 0,
      rent: data.loyer || 0,
      salary: data.salaires || 0,
      insurance: data.assurances || 0,
      subscriptions: data.abonnements || 0,
      loans: data.emprunts || 0,
      other_expenses: data.autres || 0,
      variable_cost_rate: data.tauxChargesVariables || 0,
    })
    toast.success('Champs remplis automatiquement !')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-navy-500">Chargement de vos données...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentData || !kpis) {
    return (
      <div className="min-h-screen bg-navy-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-navy-500">Erreur lors du chargement des données</p>
        </div>
      </div>
    )
  }

  // Calculate trends (comparing to previous month)
  const previousMonth = history[history.length - 2]
  const previousKpis = previousMonth ? calculateKPIs(previousMonth) : null
  
  const revenueTrend = previousKpis 
    ? ((currentData.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
    : 0

  const resultTrend = previousKpis
    ? ((kpis.currentResult - previousKpis.currentResult) / Math.abs(previousKpis.currentResult)) * 100
    : 0

  // Phase 4D: Benchmarks sectoriels (default: Services)
  const sectorData = getSectorBenchmark('services')

  const caBenchmark = (() => {
    const comp = compareToBenchmark(currentData.revenue, sectorData.ca_moyen_mensuel)
    const delta = currentData.revenue - sectorData.ca_moyen_mensuel
    return {
      sectorLabel: sectorData.label,
      comparison: `${delta >= 0 ? '+' : ''}${formatCurrency(delta)}`,
      status: comp.status,
    }
  })()

  const pointMortBenchmark = (() => {
    const comp = compareToBenchmark(kpis.breakEvenDays, sectorData.point_mort_moyen, true)
    const delta = kpis.breakEvenDays - sectorData.point_mort_moyen
    return {
      sectorLabel: sectorData.label,
      comparison: `${delta >= 0 ? '+' : ''}${delta}j`,
      status: comp.status,
    }
  })()

  const margeBenchmark = (() => {
    const userMarge = Math.round(kpis.marginRate * 100)
    const comp = compareToBenchmark(userMarge, sectorData.marge_moyenne)
    const delta = userMarge - sectorData.marge_moyenne
    return {
      sectorLabel: sectorData.label,
      comparison: `${delta >= 0 ? '+' : ''}${delta} pts`,
      status: comp.status,
    }
  })()

  // Phase 4D: Analyse automatique du résultat
  const resultAnalysis = analyzeResult(currentData, previousMonth || null, kpis, previousKpis)

  return (
    <div className="min-h-screen bg-navy-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-navy-900">
              Dashboard
            </h1>
            <p className="mt-1 text-navy-500">
              Vue d&apos;ensemble de votre situation financière
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Alerts badge */}
            {alerts.length > 0 && (
              <button
                onClick={() => setSelectedAlert(alerts[0])}
                className="relative p-2 rounded-lg hover:bg-navy-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-navy-600" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowFECModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-navy-600 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export FEC
            </button>
            <Link
              href="/dashboard/settings/kpis"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-navy-600 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              KPIs
            </Link>
          </div>
        </div>

        {/* Alerts banner */}
        {alerts.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">
                  {alerts.length} alerte{alerts.length > 1 ? 's' : ''} en attente
                </span>
              </div>
              <div className="flex gap-1">
                {alerts.slice(0, 3).map(alert => (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                      alert.severite === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : alert.severite === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {alert.titre.length > 30
                      ? alert.titre.slice(0, 30) + '...'
                      : alert.titre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Demo Banner */}
        {!user && (
          <Card className="mb-8 bg-gradient-to-r from-emerald-500 to-emerald-600 border-none">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="font-display font-semibold text-lg">Mode Démonstration</h3>
                <p className="text-emerald-100 text-sm">
                  Créez un compte pour sauvegarder vos données réelles
                </p>
              </div>
              <a 
                href="/signup"
                className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
              >
                Créer un compte
              </a>
            </div>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Seuil de Rentabilité"
            value={formatCurrency(kpis.breakEvenPoint)}
            subtitle="Point mort mensuel"
            icon={<Target className="w-5 h-5" />}
            variant="success"
            benchmark={margeBenchmark}
          />
          
          <KPICard
            title="Chiffre d'Affaires"
            value={formatCurrency(currentData.revenue)}
            subtitle="Ce mois"
            trend={revenueTrend >= 0 ? 'up' : 'down'}
            trendValue={`${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            variant={revenueTrend >= 0 ? 'success' : 'danger'}
            benchmark={caBenchmark}
          />
          
          <KPICard
            title="Point Mort"
            value={`${kpis.breakEvenDays} jours`}
            subtitle="Pour atteindre le SR"
            icon={<Calendar className="w-5 h-5" />}
            variant={kpis.breakEvenDays <= 180 ? 'success' : 'warning'}
            benchmark={pointMortBenchmark}
          />
          
          <KPICard
            title="Résultat Mensuel"
            value={formatCurrency(kpis.currentResult)}
            subtitle={kpis.currentResult >= 0 ? 'Bénéfice' : 'Déficit'}
            trend={kpis.currentResult >= 0 ? 'up' : 'down'}
            trendValue={resultTrend !== 0 ? `${resultTrend >= 0 ? '+' : ''}${resultTrend.toFixed(0)}%` : undefined}
            icon={<PiggyBank className="w-5 h-5" />}
            variant={kpis.currentResult >= 0 ? 'success' : 'danger'}
            analysisTooltip={resultAnalysis ? {
              summary: resultAnalysis.summary,
              factors: resultAnalysis.factors.map(f => ({
                label: f.label,
                value: `${f.impact >= 0 ? '+' : ''}${formatCurrency(f.impact)}`,
                type: f.type,
              })),
            } : undefined}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <BreakEvenChart 
              data={chartData} 
              breakEvenPoint={kpis.breakEvenPoint}
            />
          </div>

          {/* Gauge */}
          <div className="lg:col-span-1">
            <BreakEvenGauge
              revenue={currentData.revenue}
              breakEvenPoint={kpis.breakEvenPoint}
              safetyMarginPercent={kpis.safetyMarginPercent}
              healthStatus={kpis.healthStatus}
            />
          </div>
        </div>

        {/* Data Input Form + Import */}
        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Import Fichier Comptable */}
            <div className="mb-6 p-6 bg-white border border-navy-100 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span role="img" aria-label="import">📁</span> Importer fichier comptable
              </h2>
              <p className="text-navy-500 mb-4 text-sm">PDF, Excel (.xlsx), ou CSV. Les champs détectés seront remplis automatiquement.</p>
              <FileImportZone onParsed={handleParsedData} loading={importLoading} parsedData={parsedData} missingFields={missingFields} onValidate={handleValidateImport} />
            </div>
            <DataInputForm
              initialData={currentData}
              onSave={saveData}
              disabled={!user}
              importedData={importedData}
            />
          </div>

          {/* Quick Stats + Phase 4 Panels */}
          <div className="lg:col-span-1 space-y-6">
            {/* Comparative Metrics (Phase 4) */}
            <ComparativeMetrics userId={user?.id} />

            {/* Insights Panel (Phase 4) */}
            <InsightsPanel userId={user?.id} />

            <Card>
              <h3 className="text-lg font-display font-semibold text-navy-900 mb-4">
                Analyse Rapide
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
                  <span className="text-sm text-navy-600">Charges fixes</span>
                  <span className="font-mono font-medium text-navy-900">
                    {formatCurrency(kpis.totalFixedCosts)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
                  <span className="text-sm text-navy-600">Taux de marge</span>
                  <span className="font-mono font-medium text-navy-900">
                    {(kpis.marginRate * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
                  <span className="text-sm text-navy-600">Charges variables</span>
                  <span className="font-mono font-medium text-navy-900">
                    {currentData.variable_cost_rate.toFixed(1)}% du CA
                  </span>
                </div>
              </div>
            </Card>

            <Card className={`
              ${kpis.safetyMarginPercent >= 0 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-coral-50 border-coral-200'
              }
            `}>
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${kpis.safetyMarginPercent >= 0 
                    ? 'bg-emerald-100' 
                    : 'bg-coral-100'
                  }
                `}>
                  {kpis.safetyMarginPercent >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-coral-600" />
                  )}
                </div>
                <div>
                  <h4 className={`
                    font-display font-semibold
                    ${kpis.safetyMarginPercent >= 0 
                      ? 'text-emerald-900' 
                      : 'text-coral-900'
                    }
                  `}>
                    {kpis.safetyMarginPercent >= 0 ? 'Marge positive' : 'Attention requise'}
                  </h4>
                  <p className={`
                    text-sm mt-1
                    ${kpis.safetyMarginPercent >= 0 
                      ? 'text-emerald-700' 
                      : 'text-coral-700'
                    }
                  `}>
                    {kpis.safetyMarginPercent >= 0 
                      ? `Vous êtes ${formatCurrency(kpis.safetyMargin)} au-dessus de votre seuil de rentabilité.`
                      : `Vous êtes ${formatCurrency(Math.abs(kpis.safetyMargin))} en dessous de votre seuil de rentabilité.`
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Phase 4 Modals */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={handleResolveAlert}
        />
      )}

      {showFECModal && (
        <ExportFECModal onClose={() => setShowFECModal(false)} />
      )}
    </div>
  )
}

// --- Types et constantes globales ---
type ParsedFields = {
  chiffreAffaires?: number
  loyer?: number
  salaires?: number
  assurances?: number
  abonnements?: number
  emprunts?: number
  autres?: number
  tauxChargesVariables?: number
  detectedFields?: string[]
}

const FIELD_LABELS: Record<string, string> = {
  chiffreAffaires: "Chiffre d'affaires",
  loyer: 'Loyer',
  salaires: 'Salaires',
  assurances: 'Assurances',
  abonnements: 'Abonnements',
  emprunts: 'Emprunts',
  autres: 'Autres charges',
  tauxChargesVariables: 'Taux charges variables',
}

function FileImportZone({ onParsed, loading, parsedData, missingFields, onValidate }: any) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)

  const handleFile = async (file: File) => {
    setFileName(file.name)
    onParsed(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      onParsed('loading')
      const res = await fetch('/api/parse-finance', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        onParsed(data)
      } else {
        toast.error(data.error || 'Erreur lors du parsing du fichier')
        onParsed(null)
      }
    } catch (e) {
      toast.error('Erreur lors du parsing du fichier')
      onParsed(null)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-navy-200 bg-navy-50'}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={onChange}
        />
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">⬇️</span>
          <span className="font-medium">Glissez-déposez ou cliquez pour importer</span>
          {fileName && <span className="text-xs text-navy-400">{fileName}</span>}
        </div>
      </div>
      {/* Résultats détectés */}
      <div className="mt-4">
        {loading === 'loading' && (
          <div className="flex items-center gap-2 text-emerald-600"><Loader2 className="animate-spin w-5 h-5" /> Analyse du fichier...</div>
        )}
        {parsedData && loading !== 'loading' && (
          <div className="space-y-2">
            <div className="text-emerald-700 font-semibold flex items-center gap-2">
              ✅ Détecté :
              {parsedData.detectedFields && parsedData.detectedFields.length > 0 ? (
                <span>
                  {parsedData.detectedFields.map((f: string) => `${FIELD_LABELS[f] || f}: ${parsedData[f]}€`).join(', ')}
                </span>
              ) : (
                <span>Aucun champ détecté</span>
              )}
            </div>
            {missingFields && missingFields.length > 0 && (
              <div className="text-coral-700 text-sm">Champs manquants : {missingFields.map((f: string) => FIELD_LABELS[f] || f).join(', ')}</div>
            )}
            <button
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              onClick={() => onValidate(parsedData)}
              disabled={missingFields && missingFields.length > 0}
            >Valider et Remplir</button>
          </div>
        )}
      </div>
    </div>
  )
}
