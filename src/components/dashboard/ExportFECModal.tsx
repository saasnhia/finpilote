'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import {
  X,
  Download,
  FileText,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react'

interface ExportFECModalProps {
  onClose: () => void
}

interface FECPreview {
  filename: string
  total_entries: number
  total_debit: number
  total_credit: number
  warnings: string[]
  transaction_count: number
}

export function ExportFECModal({ onClose }: ExportFECModalProps) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [format, setFormat] = useState<'txt' | 'csv'>('txt')
  const [preview, setPreview] = useState<FECPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handlePreview = async () => {
    setLoading(true)
    setPreview(null)
    try {
      const res = await fetch(
        `/api/export/fec?year=${year}&format=${format}&preview=true`
      )
      const data = await res.json()
      if (data.success) {
        setPreview(data)
      }
    } catch (error) {
      console.error('Error fetching preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/export/fec?year=${year}&format=${format}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = preview?.filename || `FEC${year}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading:', error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-navy-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-display font-bold text-navy-900">
                Export FEC
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-navy-100 transition-colors"
            >
              <X className="w-5 h-5 text-navy-500" />
            </button>
          </div>
          <p className="text-sm text-navy-500 mt-1">
            Fichier des Écritures Comptables conforme DGFiP
          </p>
        </div>

        {/* Config */}
        <div className="p-6 space-y-4">
          {/* Year */}
          <div>
            <label className="text-sm font-medium text-navy-700 mb-1 block">
              Année fiscale
            </label>
            <select
              value={year}
              onChange={e => {
                setYear(parseInt(e.target.value))
                setPreview(null)
              }}
              className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-sm font-medium text-navy-700 mb-1 block">
              Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFormat('txt')
                  setPreview(null)
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  format === 'txt'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-navy-200 text-navy-600 hover:bg-navy-50'
                }`}
              >
                .TXT (norme FEC)
              </button>
              <button
                onClick={() => {
                  setFormat('csv')
                  setPreview(null)
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  format === 'csv'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-navy-200 text-navy-600 hover:bg-navy-50'
                }`}
              >
                .CSV
              </button>
            </div>
          </div>

          {/* Preview button */}
          {!preview && (
            <Button
              onClick={handlePreview}
              loading={loading}
              variant="outline"
              className="w-full"
            >
              Vérifier avant export
            </Button>
          )}

          {/* Preview result */}
          {preview && (
            <div className="p-4 bg-navy-50 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-sm text-navy-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">{preview.filename}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-navy-500">Transactions</p>
                  <p className="font-mono font-medium text-navy-900">
                    {preview.transaction_count}
                  </p>
                </div>
                <div>
                  <p className="text-navy-500">Écritures</p>
                  <p className="font-mono font-medium text-navy-900">
                    {preview.total_entries}
                  </p>
                </div>
                <div>
                  <p className="text-navy-500">Total Débit</p>
                  <p className="font-mono font-medium text-navy-900">
                    {preview.total_debit.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-navy-500">Total Crédit</p>
                  <p className="font-mono font-medium text-navy-900">
                    {preview.total_credit.toFixed(2)} €
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="space-y-1">
                  {preview.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-amber-700"
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0">
          <Button
            onClick={handleDownload}
            disabled={!preview || downloading}
            loading={downloading}
            icon={<Download className="w-4 h-4" />}
            className="w-full"
          >
            Télécharger le FEC
          </Button>
        </div>
      </div>
    </div>
  )
}
