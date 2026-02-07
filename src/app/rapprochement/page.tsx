'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRapprochement } from '@/hooks/useRapprochement'
import { Card, Button } from '@/components/ui'
import {
  ArrowRightLeft,
  AlertTriangle,
  Check,
  FileText,
  Receipt,
  Loader2,
  Play,
  RefreshCw,
} from 'lucide-react'

export default function RapprochementDashboardPage() {
  const { user } = useAuth()
  const {
    rapprochements,
    rapprochementStats,
    anomalyStats,
    loading,
    matching,
    launchMatching,
  } = useRapprochement(user?.id)

  const [lastResult, setLastResult] = useState<{
    auto_matched: number
    suggestions: number
    unmatched_factures: number
    unmatched_transactions: number
  } | null>(null)

  const handleLaunchMatching = async () => {
    const result = await launchMatching()
    if (result) {
      setLastResult(result)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Rapprochement Bancaire
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            Matching automatique factures - transactions avec détection d&apos;anomalies
          </p>
        </div>
        <Button
          onClick={handleLaunchMatching}
          loading={matching}
          icon={matching ? undefined : <Play className="w-4 h-4" />}
        >
          {matching ? 'Analyse en cours...' : 'Lancer le rapprochement'}
        </Button>
      </div>

      {/* Result banner */}
      {lastResult && (
        <Card className="mb-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-900">
                Rapprochement terminé
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {lastResult.auto_matched} auto-rapprochés, {lastResult.suggestions} suggestions,{' '}
                {lastResult.unmatched_factures} factures non rapprochées,{' '}
                {lastResult.unmatched_transactions} transactions non rapprochées
              </p>
            </div>
            <button
              onClick={() => setLastResult(null)}
              className="ml-auto text-emerald-600 hover:text-emerald-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-navy-500">Validés</p>
              <p className="text-2xl font-bold text-navy-900">
                {rapprochementStats.auto_valide + rapprochementStats.manuels}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-navy-500">En attente</p>
              <p className="text-2xl font-bold text-navy-900">
                {rapprochementStats.suggestions}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-navy-500">Anomalies</p>
              <p className="text-2xl font-bold text-navy-900">
                {anomalyStats.ouvertes}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-navy-600" />
            </div>
            <div>
              <p className="text-sm text-navy-500">Total</p>
              <p className="text-2xl font-bold text-navy-900">
                {rapprochementStats.total}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/rapprochement/transactions">
          <Card hover>
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-navy-900">
                  Transactions non rapprochées
                </p>
                <p className="text-xs text-navy-500">
                  Voir les transactions sans correspondance
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/rapprochement/factures">
          <Card hover>
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-navy-900">
                  Factures non rapprochées
                </p>
                <p className="text-xs text-navy-500">
                  Voir les factures sans correspondance
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/rapprochement/anomalies">
          <Card hover>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-sm font-medium text-navy-900">
                  Anomalies détectées
                </p>
                <p className="text-xs text-navy-500">
                  {anomalyStats.critical > 0
                    ? `${anomalyStats.critical} critique(s) à traiter`
                    : 'Aucune anomalie critique'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent suggestions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-navy-900">
            Suggestions récentes
          </h2>
          <Link href="/rapprochement/transactions">
            <Button variant="ghost" size="sm">
              Voir tout
            </Button>
          </Link>
        </div>

        {rapprochements.length === 0 ? (
          <div className="text-center py-8">
            <ArrowRightLeft className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <p className="text-sm text-navy-500 mb-4">
              Aucun rapprochement pour le moment
            </p>
            <Button
              onClick={handleLaunchMatching}
              loading={matching}
              icon={<Play className="w-4 h-4" />}
            >
              Lancer le rapprochement automatique
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-navy-700">
                    Facture
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-navy-700">
                    Transaction
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-navy-700">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-navy-700">
                    Score
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-navy-700">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {rapprochements.slice(0, 10).map(r => (
                  <tr key={r.id} className="hover:bg-navy-50">
                    <td className="px-4 py-3 text-sm text-navy-900">
                      {r.facture?.nom_fournisseur || r.facture?.numero_facture || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-700 truncate max-w-[200px]">
                      {r.transaction?.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-navy-900">
                      {r.montant.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.confidence_score >= 95
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.confidence_score >= 80
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.confidence_score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.statut === 'valide'
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.statut === 'rejete'
                              ? 'bg-coral-100 text-coral-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.statut === 'valide'
                          ? 'Validé'
                          : r.statut === 'rejete'
                            ? 'Rejeté'
                            : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
