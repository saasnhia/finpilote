'use client'

import { useState } from 'react'
import { Card, Button } from '@/components/ui'
import { ConfidenceScore } from './ConfidenceScore'
import { Check, X, FileText, ArrowRightLeft, Loader2 } from 'lucide-react'
import type { Facture, Transaction } from '@/types'
import type { RapprochementFacture } from '@/lib/matching/matching-types'

interface EnrichedRapprochement extends RapprochementFacture {
  facture: Facture | null
  transaction: Transaction | null
}

interface MatchingSuggestionCardProps {
  rapprochement: EnrichedRapprochement
  onValidate: (id: string) => Promise<boolean>
  onReject: (id: string) => Promise<boolean>
}

export function MatchingSuggestionCard({
  rapprochement,
  onValidate,
  onReject,
}: MatchingSuggestionCardProps) {
  const [acting, setActing] = useState<'valider' | 'rejeter' | null>(null)

  const { facture, transaction } = rapprochement

  const handleValidate = async () => {
    setActing('valider')
    await onValidate(rapprochement.id)
    setActing(null)
  }

  const handleReject = async () => {
    setActing('rejeter')
    await onReject(rapprochement.id)
    setActing(null)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const isValidated = rapprochement.statut === 'valide'
  const isRejected = rapprochement.statut === 'rejete'

  return (
    <Card
      className={`${
        isValidated
          ? 'border-l-4 border-l-emerald-500'
          : isRejected
            ? 'border-l-4 border-l-coral-500 opacity-60'
            : 'border-l-4 border-l-amber-400'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-navy-400" />
          <span className="text-xs uppercase font-medium text-navy-500">
            {rapprochement.type === 'auto'
              ? 'Auto-rapproché'
              : rapprochement.type === 'manuel'
                ? 'Manuel'
                : 'Suggestion'}
          </span>
        </div>
        <ConfidenceScore score={rapprochement.confidence_score} size="sm" />
      </div>

      {/* Match details - two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Facture side */}
        <div className="p-3 bg-navy-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-navy-500" />
            <span className="text-xs font-medium text-navy-600 uppercase">Facture</span>
          </div>
          {facture ? (
            <>
              <p className="text-sm font-medium text-navy-900 truncate">
                {facture.nom_fournisseur || facture.numero_facture || 'Sans nom'}
              </p>
              <p className="text-sm font-mono text-navy-700">
                {(facture.montant_ttc || 0).toFixed(2)} €
              </p>
              <p className="text-xs text-navy-500">{formatDate(facture.date_facture)}</p>
            </>
          ) : (
            <p className="text-sm text-navy-400 italic">Facture non trouvée</p>
          )}
        </div>

        {/* Transaction side */}
        <div className="p-3 bg-navy-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="w-4 h-4 text-navy-500" />
            <span className="text-xs font-medium text-navy-600 uppercase">Transaction</span>
          </div>
          {transaction ? (
            <>
              <p className="text-sm font-medium text-navy-900 truncate">
                {transaction.description}
              </p>
              <p className="text-sm font-mono text-navy-700">
                {transaction.amount.toFixed(2)} €
              </p>
              <p className="text-xs text-navy-500">{formatDate(transaction.date)}</p>
            </>
          ) : (
            <p className="text-sm text-navy-400 italic">Transaction non trouvée</p>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="flex gap-4 mb-4 text-xs text-navy-500">
        <span>
          Montant:{' '}
          <span className="font-medium text-navy-700">
            {rapprochement.amount_score || 0}%
          </span>
        </span>
        <span>
          Date:{' '}
          <span className="font-medium text-navy-700">
            {rapprochement.date_score || 0}%
          </span>
        </span>
        <span>
          Description:{' '}
          <span className="font-medium text-navy-700">
            {rapprochement.description_score || 0}%
          </span>
        </span>
      </div>

      {/* Actions */}
      {rapprochement.statut === 'suggestion' && (
        <div className="flex gap-2">
          <Button
            onClick={handleValidate}
            disabled={acting !== null}
            icon={
              acting === 'valider' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )
            }
            className="flex-1"
          >
            Valider
          </Button>
          <Button
            onClick={handleReject}
            disabled={acting !== null}
            variant="outline"
            icon={
              acting === 'rejeter' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )
            }
            className="flex-1"
          >
            Rejeter
          </Button>
        </div>
      )}

      {isValidated && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <Check className="w-4 h-4" />
          <span>Rapprochement validé</span>
        </div>
      )}

      {isRejected && (
        <div className="flex items-center gap-2 text-sm text-coral-600">
          <X className="w-4 h-4" />
          <span>Rapprochement rejeté</span>
        </div>
      )}
    </Card>
  )
}
