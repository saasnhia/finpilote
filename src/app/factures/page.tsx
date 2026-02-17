'use client'

import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { UploadFacture } from '@/components/factures/UploadFacture'
import { useAuth } from '@/hooks/useAuth'
import { useFactures } from '@/hooks/useFactures'
import { formatCurrency } from '@/lib/calculations'
import {
  FileText,
  Calendar,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'

export default function FacturesPage() {
  const { user, loading: authLoading } = useAuth()
  const { factures, loading: dataLoading } = useFactures(user?.id)

  const loading = authLoading || dataLoading

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validee':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'en_attente':
        return <Loader2 className="w-4 h-4 text-gold-600 animate-spin" />
      case 'brouillon':
        return <AlertCircle className="w-4 h-4 text-coral-600" />
      case 'rejetee':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validee':
        return 'Validée'
      case 'en_attente':
        return 'En attente'
      case 'brouillon':
        return 'Brouillon'
      case 'rejetee':
        return 'Rejetée'
      default:
        return status
    }
  }

  return (
    <AppShell>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-navy-900">
            Factures
          </h1>
          <p className="mt-1 text-navy-500">
            Import intelligent de factures avec OCR et IA
          </p>
        </div>

        {/* Not Logged In Banner */}
        {!user && (
          <Card className="mb-8 bg-gradient-to-r from-emerald-500 to-emerald-600 border-none">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="font-display font-semibold text-lg">Connexion requise</h3>
                <p className="text-emerald-100 text-sm">
                  Connectez-vous pour importer et gérer vos factures
                </p>
              </div>
              <a
                href="/login"
                className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
              >
                Se connecter
              </a>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Component */}
          <div className="lg:col-span-2">
            <UploadFacture onUploadSuccess={() => {
              // Refresh factures list
              window.location.reload()
            }} />
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-display font-semibold text-navy-900 mb-4">
                Statistiques
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
                  <span className="text-sm text-navy-600">Total factures</span>
                  <span className="font-mono font-semibold text-navy-900">
                    {factures.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-emerald-700">Validées</span>
                  <span className="font-mono font-semibold text-emerald-900">
                    {factures.filter(f => f.statut === 'validee').length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-coral-50 rounded-lg">
                  <span className="text-sm text-coral-700">En attente</span>
                  <span className="font-mono font-semibold text-coral-900">
                    {factures.filter(f => f.statut === 'en_attente').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Factures List */}
        {loading ? (
          <div className="mt-8 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-navy-500">Chargement des factures...</p>
            </div>
          </div>
        ) : factures.length > 0 ? (
          <div className="mt-8">
            <Card padding="none">
              <div className="px-6 py-4 border-b border-navy-100">
                <h3 className="text-lg font-display font-semibold text-navy-900">
                  Mes factures ({factures.length})
                </h3>
              </div>

              <div className="divide-y divide-navy-100">
                {factures.map((facture) => (
                  <div
                    key={facture.id}
                    className="px-6 py-4 hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                          <FileText className="w-6 h-6 text-emerald-600" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-navy-900">
                              {facture.fournisseur ?? 'Fournisseur inconnu'}
                            </p>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-navy-100 rounded-full">
                              {getStatusIcon(facture.statut)}
                              <span className="text-xs text-navy-600">
                                {getStatusLabel(facture.statut)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-navy-500">
                            {facture.numero_facture && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {facture.numero_facture}
                              </span>
                            )}
                            {facture.date_facture && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(facture.date_facture).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>

                          {facture.ocr_confidence !== null && facture.ocr_confidence !== undefined && (
                            <div className="mt-2 text-xs text-navy-400">
                              Confiance OCR: {(facture.ocr_confidence * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {facture.montant_ttc != null && (
                          <div className="font-mono font-semibold text-lg text-navy-900">
                            {formatCurrency(facture.montant_ttc)}
                          </div>
                        )}
                        {(facture.montant_ht != null || facture.montant_tva != null) && (
                          <div className="text-xs text-navy-500 mt-1">
                            {facture.montant_ht != null && <>HT: {formatCurrency(facture.montant_ht)}</>}
                            {facture.montant_ht != null && facture.montant_tva != null && ' + '}
                            {facture.montant_tva != null && <>TVA: {formatCurrency(facture.montant_tva)}</>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : user ? (
          <div className="mt-8">
            <Card className="text-center py-12">
              <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
              <p className="text-navy-500">Aucune facture importée</p>
              <p className="text-sm text-navy-400 mt-1">
                Glissez-déposez une facture ci-dessus pour commencer
              </p>
            </Card>
          </div>
        ) : null}
      </main>
    </AppShell>
  )
}
