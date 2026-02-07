'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  EyeOff,
  ExternalLink,
  Loader2,
  Mail,
  CheckCircle,
  FileText,
  Clock,
  Banknote,
} from 'lucide-react'
import type { Alert } from '@/types'

interface AlertDetailModalProps {
  alert: Alert
  onClose: () => void
  onResolve: (id: string, statut: 'resolue' | 'ignoree', notes?: string) => Promise<void>
}

const SEVERITY_CONFIG = {
  critical: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    label: 'Critique',
    headerGradient: 'from-red-50 to-red-100/50',
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5" />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Attention',
    headerGradient: 'from-amber-50 to-amber-100/50',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Information',
    headerGradient: 'from-blue-50 to-blue-100/50',
  },
}

const TYPE_LABELS: Record<string, string> = {
  facture_impayee: 'Facture impayée',
  ecart_tva: 'Écart de TVA',
  transaction_anormale: 'Transaction anormale',
  seuil_depasse: 'Seuil dépassé',
  doublon_detecte: 'Doublon détecté',
  rapprochement_echoue: 'Rapprochement échoué',
  point_mort_eleve: 'Point Mort élevé',
  marge_faible: 'Marge faible',
  ca_baisse: 'CA en baisse',
  tresorerie_basse: 'Trésorerie basse',
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  facture_impayee: <FileText className="w-4 h-4" />,
  ecart_tva: <Banknote className="w-4 h-4" />,
  transaction_anormale: <AlertTriangle className="w-4 h-4" />,
  rapprochement_echoue: <ExternalLink className="w-4 h-4" />,
  point_mort_eleve: <Clock className="w-4 h-4" />,
  marge_faible: <AlertCircle className="w-4 h-4" />,
  ca_baisse: <AlertCircle className="w-4 h-4" />,
}

export function AlertDetailModal({ alert, onClose, onResolve }: AlertDetailModalProps) {
  const [notes, setNotes] = useState(alert.notes || '')
  const [acting, setActing] = useState<string | null>(null)

  const sev = SEVERITY_CONFIG[alert.severite]
  const isResolved = alert.statut === 'resolue' || alert.statut === 'ignoree'

  const handleAction = async (statut: 'resolue' | 'ignoree') => {
    setActing(statut)
    await onResolve(alert.id, statut, notes || undefined)
    setActing(null)
  }

  const handleEmailRelaunch = () => {
    const subject = encodeURIComponent(`Relance – ${alert.titre}`)
    const body = encodeURIComponent(
      `Bonjour,\n\nJe me permets de vous relancer concernant :\n\n${alert.titre}\n${alert.description}\n\nMerci de bien vouloir régulariser cette situation dans les meilleurs délais.\n\nCordialement`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleMarkPaid = async () => {
    setActing('mark_paid')
    await onResolve(alert.id, 'resolue', 'Marqué comme payé')
    setActing(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 rounded-t-2xl bg-gradient-to-b ${sev.headerGradient} border-b ${sev.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${sev.badge}`}>{sev.icon}</div>
              <div>
                <span className={`text-xs font-medium uppercase ${sev.text}`}>
                  {TYPE_LABELS[alert.type] || alert.type}
                </span>
                <h2 className="text-lg font-display font-bold text-navy-900 mt-0.5">
                  {alert.titre}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-navy-500" />
            </button>
          </div>

          {/* Badges */}
          <div className="mt-3 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sev.badge}`}>
              {sev.label}
            </span>
            <span className="text-xs text-navy-500">
              {new Date(alert.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3">
            {alert.impact_financier != null && (
              <div className="p-3 bg-navy-50 rounded-xl">
                <p className="text-[11px] font-medium text-navy-400 uppercase tracking-wide">Montant</p>
                <p className="text-xl font-display font-bold text-navy-900 mt-0.5">
                  {alert.impact_financier.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
              </div>
            )}
            <div className="p-3 bg-navy-50 rounded-xl">
              <p className="text-[11px] font-medium text-navy-400 uppercase tracking-wide">Type</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={sev.text}>{TYPE_ICON[alert.type]}</span>
                <p className="text-sm font-medium text-navy-800">
                  {TYPE_LABELS[alert.type] || alert.type}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-navy-600 mb-1">Description détaillée</h3>
            <p className="text-sm text-navy-800 leading-relaxed">{alert.description}</p>
          </div>

          {/* Quick action buttons */}
          {!isResolved && (
            <div>
              <h3 className="text-sm font-medium text-navy-600 mb-2">Actions rapides</h3>
              <div className="flex flex-wrap gap-2">
                {alert.type === 'facture_impayee' && (
                  <>
                    <button
                      onClick={handleEmailRelaunch}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Relancer par email
                    </button>
                    <button
                      onClick={handleMarkPaid}
                      disabled={acting !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marquer comme payé
                    </button>
                  </>
                )}
                {alert.type === 'transaction_anormale' && (
                  <button
                    onClick={() => handleAction('resolue')}
                    disabled={acting !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Confirmer le montant
                  </button>
                )}
                {alert.type === 'ecart_tva' && (
                  <a
                    href="/tva"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Corriger les taux TVA
                  </a>
                )}
                {alert.type === 'rapprochement_echoue' && (
                  <a
                    href="/rapprochement"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Lancer le rapprochement
                  </a>
                )}
                {(alert.type === 'point_mort_eleve' || alert.type === 'marge_faible' || alert.type === 'ca_baisse') && (
                  <a
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-navy-50 hover:bg-navy-100 text-navy-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir le dashboard
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Suggested actions / Recommandations */}
          {alert.actions_suggerees && alert.actions_suggerees.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-navy-600 mb-2">Recommandations</h3>
              <ul className="space-y-2">
                {alert.actions_suggerees.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-navy-700"
                  >
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2">
            {alert.transaction_id && (
              <a
                href={`/rapprochement/transactions?id=${alert.transaction_id}`}
                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir la transaction
              </a>
            )}
            {alert.facture_id && (
              <a
                href={`/rapprochement/factures?id=${alert.facture_id}`}
                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir la facture
              </a>
            )}
          </div>

          {/* Notes */}
          {!isResolved && (
            <div>
              <h3 className="text-sm font-medium text-navy-600 mb-1">Notes</h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ajouter une note..."
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={2}
              />
            </div>
          )}

          {/* Resolved info */}
          {isResolved && (
            <div className={`p-3 rounded-lg ${alert.statut === 'resolue' ? 'bg-emerald-50' : 'bg-navy-50'}`}>
              <p className={`text-sm font-medium ${alert.statut === 'resolue' ? 'text-emerald-700' : 'text-navy-600'}`}>
                {alert.statut === 'resolue' ? 'Résolue' : 'Ignorée'}
                {alert.resolved_at &&
                  ` le ${new Date(alert.resolved_at).toLocaleDateString('fr-FR')}`}
              </p>
              {alert.notes && <p className="text-xs text-navy-500 mt-1">{alert.notes}</p>}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isResolved && (
          <div className="p-6 pt-0 flex gap-2">
            <Button
              onClick={() => handleAction('resolue')}
              disabled={acting !== null}
              icon={
                acting === 'resolue' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )
              }
              className="flex-1"
            >
              Résoudre
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('ignoree')}
              disabled={acting !== null}
              icon={
                acting === 'ignoree' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )
              }
              className="flex-1"
            >
              Ignorer
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
