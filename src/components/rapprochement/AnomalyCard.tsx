'use client'

import { useState } from 'react'
import { Card, Button } from '@/components/ui'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  EyeOff,
  Loader2,
  Copy,
  FileText,
  Receipt,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react'
import type { AnomalieDetectee, AnomalyType, AnomalySeverity } from '@/lib/matching/matching-types'

interface AnomalyCardProps {
  anomaly: AnomalieDetectee
  onResolve: (id: string, statut: 'resolue' | 'ignoree', notes?: string) => Promise<boolean>
}

const ANOMALY_LABELS: Record<AnomalyType, string> = {
  doublon_transaction: 'Doublon de transaction',
  doublon_facture: 'Doublon de facture',
  transaction_sans_facture: 'Transaction sans facture',
  facture_sans_transaction: 'Facture sans transaction',
  ecart_tva: 'Écart de TVA',
  ecart_montant: 'Écart de montant',
  date_incoherente: 'Date incohérente',
  montant_eleve: 'Montant inhabituellement élevé',
}

const ANOMALY_ICONS: Record<AnomalyType, React.ReactNode> = {
  doublon_transaction: <Copy className="w-4 h-4" />,
  doublon_facture: <Copy className="w-4 h-4" />,
  transaction_sans_facture: <Receipt className="w-4 h-4" />,
  facture_sans_transaction: <FileText className="w-4 h-4" />,
  ecart_tva: <TrendingUp className="w-4 h-4" />,
  ecart_montant: <ArrowRightLeft className="w-4 h-4" />,
  date_incoherente: <AlertCircle className="w-4 h-4" />,
  montant_eleve: <TrendingUp className="w-4 h-4" />,
}

const SEVERITY_CONFIG: Record<
  AnomalySeverity,
  { icon: React.ReactNode; bgColor: string; borderColor: string; textColor: string; label: string }
> = {
  critical: {
    icon: <AlertTriangle className="w-4 h-4" />,
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500',
    textColor: 'text-red-700',
    label: 'Critique',
  },
  warning: {
    icon: <AlertCircle className="w-4 h-4" />,
    bgColor: 'bg-amber-50',
    borderColor: 'border-l-amber-500',
    textColor: 'text-amber-700',
    label: 'Attention',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-blue-500',
    textColor: 'text-blue-700',
    label: 'Information',
  },
}

export function AnomalyCard({ anomaly, onResolve }: AnomalyCardProps) {
  const [acting, setActing] = useState<'resolue' | 'ignoree' | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const severity = SEVERITY_CONFIG[anomaly.severite]

  const handleAction = async (statut: 'resolue' | 'ignoree') => {
    setActing(statut)
    await onResolve(anomaly.id, statut, notes || undefined)
    setActing(null)
    setShowNotes(false)
  }

  const isResolved = anomaly.statut !== 'ouverte'

  return (
    <Card
      className={`border-l-4 ${severity.borderColor} ${isResolved ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${severity.bgColor}`}>
            <span className={severity.textColor}>
              {ANOMALY_ICONS[anomaly.type]}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-navy-900">
              {ANOMALY_LABELS[anomaly.type]}
            </p>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${severity.textColor}`}
            >
              {severity.icon}
              {severity.label}
            </span>
          </div>
        </div>

        {isResolved && (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              anomaly.statut === 'resolue'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-navy-100 text-navy-600'
            }`}
          >
            {anomaly.statut === 'resolue' ? 'Résolue' : 'Ignorée'}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-navy-700 mb-3">{anomaly.description}</p>

      {/* Amounts if present */}
      {(anomaly.montant != null || anomaly.montant_attendu != null) && (
        <div className="flex gap-4 mb-3 text-sm">
          {anomaly.montant != null && (
            <span className="text-navy-600">
              Montant :{' '}
              <span className="font-mono font-medium text-navy-900">
                {anomaly.montant.toFixed(2)} €
              </span>
            </span>
          )}
          {anomaly.montant_attendu != null && (
            <span className="text-navy-600">
              Attendu :{' '}
              <span className="font-mono font-medium text-navy-900">
                {anomaly.montant_attendu.toFixed(2)} €
              </span>
            </span>
          )}
          {anomaly.ecart != null && (
            <span className="text-coral-600">
              Écart :{' '}
              <span className="font-mono font-medium">
                {anomaly.ecart.toFixed(2)} €
              </span>
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {anomaly.notes && (
        <p className="text-xs text-navy-500 italic mb-3">
          Note : {anomaly.notes}
        </p>
      )}

      {/* Actions */}
      {!isResolved && (
        <div className="space-y-2">
          {showNotes && (
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={2}
            />
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAction('resolue')}
              disabled={acting !== null}
              icon={
                acting === 'resolue' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )
              }
            >
              Résoudre
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('ignoree')}
              disabled={acting !== null}
              icon={
                acting === 'ignoree' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )
              }
            >
              Ignorer
            </Button>
            {!showNotes && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNotes(true)}
              >
                + Note
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
