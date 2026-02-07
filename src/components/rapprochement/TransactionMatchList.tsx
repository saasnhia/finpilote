'use client'

import { useState } from 'react'
import { Card, Button } from '@/components/ui'
import { ConfidenceScore } from './ConfidenceScore'
import {
  ArrowRightLeft,
  FileText,
  Search,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import type { Facture, Transaction } from '@/types'
import type { RapprochementFacture } from '@/lib/matching/matching-types'

interface EnrichedRapprochement extends RapprochementFacture {
  facture: Facture | null
  transaction: Transaction | null
}

interface TransactionMatchListProps {
  rapprochements: EnrichedRapprochement[]
  onValidate: (id: string) => Promise<boolean>
  onReject: (id: string) => Promise<boolean>
  loading?: boolean
}

export function TransactionMatchList({
  rapprochements,
  onValidate,
  onReject,
  loading = false,
}: TransactionMatchListProps) {
  const [filter, setFilter] = useState<'all' | 'suggestion' | 'valide' | 'rejete'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = rapprochements.filter(r => {
    if (filter !== 'all' && r.statut !== filter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const fName = r.facture?.nom_fournisseur?.toLowerCase() || ''
      const tDesc = r.transaction?.description?.toLowerCase() || ''
      return fName.includes(q) || tDesc.includes(q)
    }
    return true
  })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleValidate = async (id: string) => {
    setActingId(id)
    await onValidate(id)
    setActingId(null)
  }

  const handleReject = async (id: string) => {
    setActingId(id)
    await onReject(id)
    setActingId(null)
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Rechercher par fournisseur ou description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 bg-navy-100 rounded-lg p-1">
          {[
            { key: 'all' as const, label: 'Tous' },
            { key: 'suggestion' as const, label: 'En attente' },
            { key: 'valide' as const, label: 'Validés' },
            { key: 'rejete' as const, label: 'Rejetés' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === f.key
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-navy-500 hover:text-navy-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <ArrowRightLeft className="w-12 h-12 text-navy-300 mx-auto mb-3" />
            <p className="text-sm text-navy-500">
              {searchQuery
                ? 'Aucun rapprochement trouvé pour cette recherche'
                : 'Aucun rapprochement dans cette catégorie'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const isExpanded = expandedId === r.id
            const isActing = actingId === r.id

            return (
              <Card key={r.id} padding="none">
                {/* Main row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-navy-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  {/* Status indicator */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      r.statut === 'valide'
                        ? 'bg-emerald-500'
                        : r.statut === 'rejete'
                          ? 'bg-coral-500'
                          : 'bg-amber-400'
                    }`}
                  />

                  {/* Facture info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-navy-900 truncate">
                        {r.facture?.nom_fournisseur ||
                          r.facture?.numero_facture ||
                          'Facture'}
                      </span>
                    </div>
                    <p className="text-xs text-navy-500 mt-0.5">
                      {formatDate(r.facture?.date_facture || null)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRightLeft className="w-4 h-4 text-navy-300 flex-shrink-0" />

                  {/* Transaction info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">
                      {r.transaction?.description || 'Transaction'}
                    </p>
                    <p className="text-xs text-navy-500 mt-0.5">
                      {formatDate(r.transaction?.date || null)}
                    </p>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-mono font-medium text-navy-900 flex-shrink-0">
                    {r.montant.toFixed(2)} €
                  </span>

                  {/* Confidence */}
                  <ConfidenceScore
                    score={r.confidence_score}
                    size="sm"
                    showLabel={false}
                  />

                  {/* Expand */}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-navy-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-navy-400" />
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-navy-100 p-4 bg-navy-50/30">
                    {/* Score breakdown */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-navy-500 mb-1">Montant</p>
                        <div className="w-full h-2 bg-navy-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${r.amount_score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium text-navy-700 mt-1">
                          {r.amount_score || 0}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-navy-500 mb-1">Date</p>
                        <div className="w-full h-2 bg-navy-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${r.date_score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium text-navy-700 mt-1">
                          {r.date_score || 0}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-navy-500 mb-1">Description</p>
                        <div className="w-full h-2 bg-navy-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${r.description_score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium text-navy-700 mt-1">
                          {r.description_score || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Detail cards */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-white rounded-lg border border-navy-100">
                        <p className="text-xs font-medium text-navy-500 uppercase mb-2">
                          Facture
                        </p>
                        <p className="text-sm text-navy-900">
                          {r.facture?.nom_fournisseur || '—'}
                        </p>
                        <p className="text-xs text-navy-500">
                          N° {r.facture?.numero_facture || '—'}
                        </p>
                        <p className="text-sm font-mono text-navy-700 mt-1">
                          HT: {(r.facture?.montant_ht || 0).toFixed(2)} € | TTC:{' '}
                          {(r.facture?.montant_ttc || 0).toFixed(2)} €
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-navy-100">
                        <p className="text-xs font-medium text-navy-500 uppercase mb-2">
                          Transaction
                        </p>
                        <p className="text-sm text-navy-900">
                          {r.transaction?.description || '—'}
                        </p>
                        <p className="text-xs text-navy-500">
                          Cat: {r.transaction?.category || '—'}
                        </p>
                        <p className="text-sm font-mono text-navy-700 mt-1">
                          {(r.transaction?.amount || 0).toFixed(2)} €
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {r.statut === 'suggestion' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            handleValidate(r.id)
                          }}
                          disabled={isActing}
                          icon={
                            isActing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          Valider le rapprochement
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation()
                            handleReject(r.id)
                          }}
                          disabled={isActing}
                          icon={<X className="w-3.5 h-3.5" />}
                        >
                          Rejeter
                        </Button>
                      </div>
                    )}
                    {r.statut === 'valide' && (
                      <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Validé
                        {r.validated_at &&
                          ` le ${formatDate(r.validated_at)}`}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
