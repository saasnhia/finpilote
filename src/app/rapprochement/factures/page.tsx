'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRapprochement } from '@/hooks/useRapprochement'
import { Card, Button } from '@/components/ui'
import {
  ArrowLeft,
  FileText,
  ArrowRightLeft,
  Check,
  Loader2,
  Search,
} from 'lucide-react'
import type { Facture, Transaction } from '@/types'

export default function FacturesRapprochementPage() {
  const { user } = useAuth()
  const { creerRapprochementManuel } = useRapprochement(user?.id)

  const [factures, setFactures] = useState<Facture[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null)
  const [linkingId, setLinkingId] = useState<string | null>(null)

  // Fetch unmatched factures
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [facRes, txRes] = await Promise.all([
        fetch('/api/rapprochement/suggestions?statut=suggestion'),
        fetch('/api/rapprochement/suggestions?statut=valide'),
      ])
      const [facData, txData] = await Promise.all([facRes.json(), txRes.json()])

      // Get matched facture IDs
      const matchedFactureIds = new Set([
        ...(facData.rapprochements || []).map((r: { facture_id: string }) => r.facture_id),
        ...(txData.rapprochements || []).map((r: { facture_id: string }) => r.facture_id),
      ])

      // Fetch all factures
      const allFacturesRes = await fetch('/api/factures')
      const allFacturesData = await allFacturesRes.json()
      const unmatchedFactures = (allFacturesData.factures || []).filter(
        (f: Facture) => !matchedFactureIds.has(f.id)
      )
      setFactures(unmatchedFactures)

      // Fetch unmatched expense transactions for manual matching
      const allTxRes = await fetch('/api/transactions')
      const allTxData = await allTxRes.json()
      const matchedTxIds = new Set([
        ...(facData.rapprochements || []).map((r: { transaction_id: string }) => r.transaction_id),
        ...(txData.rapprochements || []).map((r: { transaction_id: string }) => r.transaction_id),
      ])
      const unmatchedTx = (allTxData.transactions || allTxData || []).filter(
        (t: Transaction) => t.type === 'expense' && !matchedTxIds.has(t.id)
      )
      setTransactions(unmatchedTx)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleManualMatch = async (factureId: string, transactionId: string) => {
    setLinkingId(factureId)
    const success = await creerRapprochementManuel(factureId, transactionId)
    if (success) {
      await fetchData()
      setSelectedFacture(null)
    }
    setLinkingId(null)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
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
            Factures non rapprochées
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            {factures.length} facture{factures.length > 1 ? 's' : ''} sans correspondance bancaire
          </p>
        </div>
      </div>

      {factures.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Check className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy-900 mb-2">
              Toutes les factures sont rapprochées
            </h3>
            <p className="text-sm text-navy-500">
              Aucune facture en attente de correspondance
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Unmatched factures */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-navy-600 uppercase tracking-wide">
              Factures ({factures.length})
            </h2>
            {factures.map(f => (
              <Card
                key={f.id}
                hover
                className={`cursor-pointer ${
                  selectedFacture?.id === f.id
                    ? 'ring-2 ring-emerald-500 border-emerald-500'
                    : ''
                }`}
                onClick={() =>
                  setSelectedFacture(selectedFacture?.id === f.id ? null : f)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-navy-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-navy-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        {f.nom_fournisseur || 'Fournisseur inconnu'}
                      </p>
                      <p className="text-xs text-navy-500">
                        N° {f.numero_facture || '—'} &middot; {formatDate(f.date_facture)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-medium text-navy-900">
                    {(f.montant_ttc || 0).toFixed(2)} €
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Right column: Transaction matching panel */}
          <div>
            <h2 className="text-sm font-medium text-navy-600 uppercase tracking-wide mb-3">
              {selectedFacture
                ? `Associer à "${selectedFacture.nom_fournisseur || 'Facture'}"`
                : 'Sélectionnez une facture'}
            </h2>

            {!selectedFacture ? (
              <Card>
                <div className="text-center py-8">
                  <ArrowRightLeft className="w-10 h-10 text-navy-300 mx-auto mb-3" />
                  <p className="text-sm text-navy-500">
                    Cliquez sur une facture pour la rapprocher manuellement
                  </p>
                </div>
              </Card>
            ) : transactions.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <Search className="w-10 h-10 text-navy-300 mx-auto mb-3" />
                  <p className="text-sm text-navy-500">
                    Aucune transaction disponible pour le rapprochement
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {transactions.map(t => (
                  <Card key={t.id} padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-navy-900 truncate">
                          {t.description}
                        </p>
                        <p className="text-xs text-navy-500">
                          {formatDate(t.date)} &middot; {t.category}
                        </p>
                      </div>
                      <span className="text-sm font-mono text-navy-700 mr-3 flex-shrink-0">
                        {t.amount.toFixed(2)} €
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation()
                          handleManualMatch(selectedFacture.id, t.id)
                        }}
                        disabled={linkingId !== null}
                        icon={
                          linkingId === selectedFacture.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        Associer
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
