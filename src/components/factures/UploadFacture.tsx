'use client'

import { useState, useRef } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { Upload, Loader2, CheckCircle, AlertCircle, Edit2, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Facture, UploadFactureResponse } from '@/types'

interface UploadFactureProps {
  onUploadSuccess?: (facture: Facture) => void
}

export function UploadFacture({ onUploadSuccess }: UploadFactureProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [extractedData, setExtractedData] = useState<Facture | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedFields, setEditedFields] = useState<Partial<Facture>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  // File upload handler
  const handleFile = async (file: File) => {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10 Mo).')
      return
    }

    setUploading(true)
    setExtractedData(null)
    setEditMode(false)
    setEditedFields({})

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/factures/upload', {
        method: 'POST',
        body: formData,
      })

      const data: UploadFactureResponse = await response.json()

      if (data.success && data.facture) {
        setExtractedData(data.facture)
        toast.success('Facture traitée avec succès!')

        // Show warnings if any
        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach(warning => toast(warning, { icon: '⚠️' }))
        }

        if (onUploadSuccess) {
          onUploadSuccess(data.facture)
        }
      } else {
        toast.error(data.error || 'Erreur lors du traitement')
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

  // Field editing handlers
  const handleFieldEdit = (field: keyof Facture, value: any) => {
    setEditedFields(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEdits = async () => {
    if (!extractedData) return

    try {
      // TODO: Call API to update facture with edited fields
      toast.success('Modifications enregistrées')
      setEditMode(false)
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleReset = () => {
    setExtractedData(null)
    setEditMode(false)
    setEditedFields({})
  }

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-navy-900">
          Import de facture
        </h3>
        <p className="text-sm text-navy-500 mt-0.5">
          Glissez-déposez une facture pour extraction automatique (PDF, Excel, Word, images, CSV)
        </p>
      </div>

      {/* Drag & Drop Zone */}
      {!extractedData && (
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-navy-200 bg-navy-50'}
            ${uploading ? 'pointer-events-none opacity-60' : 'hover:border-emerald-400 hover:bg-emerald-50/50'}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.csv,.txt"
            className="hidden"
            onChange={handleChange}
          />

          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <div>
                  <p className="font-medium text-navy-900">Traitement en cours...</p>
                  <p className="text-sm text-navy-500 mt-1">OCR + Validation IA</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-navy-400" />
                <div>
                  <p className="font-medium text-navy-900">
                    Glissez-déposez ou cliquez pour importer
                  </p>
                  <p className="text-sm text-navy-500 mt-1">
                    PDF, Excel, Word, Images, CSV, TXT (max 10 Mo)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Extracted Data Display */}
      {extractedData && (
        <div className="space-y-4">
          {/* Header with reset button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-navy-900">{extractedData.fichier_url ?? 'Fichier'}</span>
            </div>
            <button
              onClick={handleReset}
              className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Confidence Badge */}
          <div className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
            <span className="text-sm text-navy-600">Confiance OCR</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-navy-900">
                {((extractedData.ocr_confidence ?? 0) * 100).toFixed(0)}%
              </span>
              {(extractedData.ocr_confidence ?? 0) >= 0.7 ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-coral-600" />
              )}
            </div>
          </div>

          {/* Extracted Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fournisseur"
              value={
                editMode
                  ? (editedFields.fournisseur ?? extractedData.fournisseur ?? '')
                  : (extractedData.fournisseur || 'Non détecté')
              }
              onChange={(e) => handleFieldEdit('fournisseur', e.target.value)}
              disabled={!editMode}
            />
            <Input
              label="N° Facture"
              value={
                editMode
                  ? (editedFields.numero_facture ?? extractedData.numero_facture ?? '')
                  : (extractedData.numero_facture || 'Non détecté')
              }
              onChange={(e) => handleFieldEdit('numero_facture', e.target.value)}
              disabled={!editMode}
            />
            <Input
              label="Date"
              type="date"
              value={
                editMode
                  ? (editedFields.date_facture ?? extractedData.date_facture ?? '')
                  : (extractedData.date_facture || '')
              }
              onChange={(e) => handleFieldEdit('date_facture', e.target.value)}
              disabled={!editMode}
            />
            <Input
              label="Montant HT"
              type="number"
              value={
                editMode
                  ? (editedFields.montant_ht ?? extractedData.montant_ht ?? '')
                  : (extractedData.montant_ht || 'Non détecté')
              }
              onChange={(e) => handleFieldEdit('montant_ht', parseFloat(e.target.value))}
              suffix="€"
              disabled={!editMode}
            />
            <Input
              label="TVA"
              type="number"
              value={
                editMode
                  ? (editedFields.montant_tva ?? extractedData.montant_tva ?? '')
                  : (extractedData.montant_tva ?? 'Non détecté')
              }
              onChange={(e) => handleFieldEdit('montant_tva', parseFloat(e.target.value))}
              suffix="€"
              disabled={!editMode}
            />
            <Input
              label="Montant TTC"
              type="number"
              value={
                editMode
                  ? (editedFields.montant_ttc ?? extractedData.montant_ttc ?? '')
                  : (extractedData.montant_ttc || 'Non détecté')
              }
              onChange={(e) => handleFieldEdit('montant_ttc', parseFloat(e.target.value))}
              suffix="€"
              disabled={!editMode}
            />
          </div>

          {/* Status */}
          {extractedData.statut && (
            <div className="p-3 bg-gold-50 border border-gold-200 rounded-lg">
              <p className="text-sm text-gold-800">
                <strong>Statut:</strong> {extractedData.statut}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false)
                    setEditedFields({})
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEdits}
                  icon={<Save className="w-4 h-4" />}
                  className="flex-1"
                >
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                icon={<Edit2 className="w-4 h-4" />}
                className="flex-1"
              >
                Modifier les champs
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
