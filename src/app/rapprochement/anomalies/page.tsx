'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRapprochement } from '@/hooks/useRapprochement'
import { AnomalyCard } from '@/components/rapprochement/AnomalyCard'
import { Card, Button } from '@/components/ui'
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Loader2,
  Filter,
} from 'lucide-react'

export default function AnomaliesPage() {
  const { user } = useAuth()
  const { anomalies, anomalyStats, loading, fetchAnomalies, updateAnomalyStatus } =
    useRapprochement(user?.id)

  const [filterStatut, setFilterStatut] = useState<'ouverte' | 'resolue' | 'ignoree' | 'all'>(
    'ouverte'
  )
  const [filterSeverite, setFilterSeverite] = useState<'critical' | 'warning' | 'info' | 'all'>(
    'all'
  )

  const handleFilterChange = (statut: typeof filterStatut) => {
    setFilterStatut(statut)
    fetchAnomalies(
      statut === 'all' ? undefined : statut,
      filterSeverite === 'all' ? undefined : filterSeverite
    )
  }

  const handleSeveriteChange = (severite: typeof filterSeverite) => {
    setFilterSeverite(severite)
    fetchAnomalies(
      filterStatut === 'all' ? undefined : filterStatut,
      severite === 'all' ? undefined : severite
    )
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
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/rapprochement"
          className="p-2 rounded-lg hover:bg-navy-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-navy-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Anomalies détectées
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            Surveillez et résolvez les anomalies comptables
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card
          className={`cursor-pointer transition-all ${
            filterSeverite === 'all' ? 'ring-2 ring-navy-300' : ''
          }`}
          onClick={() => handleSeveriteChange('all')}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy-100 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-navy-600" />
            </div>
            <div>
              <p className="text-xs text-navy-500">Total ouvertes</p>
              <p className="text-xl font-bold text-navy-900">{anomalyStats.ouvertes}</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            filterSeverite === 'critical' ? 'ring-2 ring-red-300' : ''
          }`}
          onClick={() => handleSeveriteChange('critical')}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-navy-500">Critiques</p>
              <p className="text-xl font-bold text-red-600">{anomalyStats.critical}</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            filterSeverite === 'warning' ? 'ring-2 ring-amber-300' : ''
          }`}
          onClick={() => handleSeveriteChange('warning')}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-navy-500">Attention</p>
              <p className="text-xl font-bold text-amber-600">{anomalyStats.warning}</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            filterSeverite === 'info' ? 'ring-2 ring-blue-300' : ''
          }`}
          onClick={() => handleSeveriteChange('info')}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-navy-500">Information</p>
              <p className="text-xl font-bold text-blue-600">{anomalyStats.info}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-navy-100 rounded-lg p-1 mb-6 w-fit">
        {[
          { key: 'ouverte' as const, label: 'Ouvertes' },
          { key: 'resolue' as const, label: 'Résolues' },
          { key: 'ignoree' as const, label: 'Ignorées' },
          { key: 'all' as const, label: 'Toutes' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterStatut === f.key
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Anomaly list */}
      {anomalies.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Check className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy-900 mb-2">
              {filterStatut === 'ouverte'
                ? 'Aucune anomalie ouverte'
                : 'Aucune anomalie trouvée'}
            </h3>
            <p className="text-sm text-navy-500">
              {filterStatut === 'ouverte'
                ? 'Toutes les anomalies ont été traitées'
                : 'Aucune anomalie ne correspond aux filtres sélectionnés'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {anomalies.map(anomaly => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              onResolve={updateAnomalyStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}
