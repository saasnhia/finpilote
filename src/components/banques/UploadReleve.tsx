'use client'

import { useState, useRef } from 'react'
import { Card, Button } from '@/components/ui'
import { Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { BankAccount, BankImportPreview } from '@/types'

interface UploadReleveProps {
  bankAccounts: BankAccount[]
  onImportSuccess?: () => void
}

export function UploadReleve({ bankAccounts, onImportSuccess }: UploadReleveProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<BankImportPreview | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // File upload handler
  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Format non supporté. Utilisez un fichier CSV.')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5MB).')
      return
    }

    setUploading(true)
    setPreview(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/banques/import-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.preview) {
        setPreview(data.preview)
        toast.success('Fichier analysé avec succès!')

        // Show warnings if any
        if (data.preview.warnings && data.preview.warnings.length > 0) {
          data.preview.warnings.forEach((warning: string) =>
            toast(warning, { icon: '⚠️' })
          )
        }
      } else {
        toast.error(data.error || 'Erreur lors de l\'analyse')
      }
    } catch (error: any) {
      toast.error('Erreur réseau: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  // Confirm import
  const handleConfirmImport = async () => {
    if (!selectedAccountId) {
      toast.error('Veuillez sélectionner un compte bancaire')
      return
    }

    if (!preview) {
      toast.error('Aucune prévisualisation disponible')
      return
    }

    setImporting(true)

    try {
      const response = await fetch('/api/banques/confirm-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_account_id: selectedAccountId,
          transactions: preview.transactions,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          `${data.imported_count} transaction(s) importée(s)${
            data.duplicate_count > 0 ? ` (${data.duplicate_count} doublon(s) ignoré(s))` : ''
          }`
        )
        setPreview(null)
        setSelectedAccountId('')
        if (onImportSuccess) {
          onImportSuccess()
        }
      } else {
        toast.error(data.error || 'Erreur lors de l\'import')
      }
    } catch (error: any) {
      toast.error('Erreur réseau: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setPreview(null)
    setSelectedAccountId('')
  }

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-navy-900">
          Import relevé bancaire
        </h3>
        <p className="text-sm text-navy-500 mt-0.5">
          Importez un fichier CSV de votre banque (BNP, Société Générale, Crédit Agricole)
        </p>
      </div>

      {/* Drag & Drop Zone */}
      {!preview && (
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-navy-200 bg-navy-50'}
            ${uploading ? 'pointer-events-none opacity-60' : 'hover:border-emerald-400 hover:bg-emerald-50/50'}
          `}
          onDragOver={e => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={e => {
            e.preventDefault()
            setDragActive(false)
          }}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleChange}
          />

          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <div>
                  <p className="font-medium text-navy-900">Analyse en cours...</p>
                  <p className="text-sm text-navy-500 mt-1">Détection du format bancaire</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-navy-400" />
                <div>
                  <p className="font-medium text-navy-900">
                    Glissez-déposez ou cliquez pour importer
                  </p>
                  <p className="text-sm text-navy-500 mt-1">CSV uniquement (max 5MB)</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-medium text-navy-900">{preview.bank_name}</p>
                <p className="text-sm text-navy-600">
                  {preview.total_transactions} transactions détectées
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-navy-500 hover:text-navy-700 transition-colors"
            >
              Annuler
            </button>
          </div>

          {/* Date Range */}
          <div className="p-3 bg-navy-50 rounded-lg">
            <p className="text-sm text-navy-600">
              Période: {new Date(preview.date_range.start).toLocaleDateString('fr-FR')} →{' '}
              {new Date(preview.date_range.end).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Compte de destination
            </label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Sélectionnez un compte</option>
              {bankAccounts
                .filter(acc => acc.is_active)
                .map(account => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} - {account.bank_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Transaction Preview Table */}
          <div>
            <p className="text-sm font-medium text-navy-700 mb-2">
              Aperçu (10 premières transactions)
            </p>
            <div className="border border-navy-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-navy-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-navy-700 font-medium">Date</th>
                      <th className="px-4 py-2 text-left text-navy-700 font-medium">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right text-navy-700 font-medium">Montant</th>
                      <th className="px-4 py-2 text-center text-navy-700 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {preview.transactions.slice(0, 10).map((tx, idx) => (
                      <tr key={idx} className="hover:bg-navy-50">
                        <td className="px-4 py-2 text-navy-900">
                          {new Date(tx.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-2 text-navy-900 max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-navy-900">
                          {tx.amount.toFixed(2)} €
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              tx.type === 'income'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-coral-100 text-coral-700'
                            }`}
                          >
                            {tx.type === 'income' ? 'Crédit' : 'Débit'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {preview.transactions.length > 10 && (
              <p className="text-xs text-navy-500 mt-2">
                + {preview.transactions.length - 10} autre(s) transaction(s)
              </p>
            )}
          </div>

          {/* Warnings */}
          {preview.warnings && preview.warnings.length > 0 && (
            <div className="p-3 bg-gold-50 border border-gold-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-gold-600 mt-0.5" />
                <div className="space-y-1">
                  {preview.warnings.map((warning, idx) => (
                    <p key={idx} className="text-sm text-gold-800">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleConfirmImport}
            disabled={!selectedAccountId || importing}
            className="w-full"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Import en cours...
              </>
            ) : (
              `Importer ${preview.total_transactions} transaction(s)`
            )}
          </Button>
        </div>
      )}
    </Card>
  )
}
