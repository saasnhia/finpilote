'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, FileSpreadsheet, BarChart3, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { DetectResult, ImportType } from '@/app/api/import/detect/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessResult {
  success: boolean
  import_id: string
  processed_count: number
  error_count: number
  errors: string[]
  result_summary: Record<string, unknown>
}

type Step = 'idle' | 'detecting' | 'detected' | 'processing' | 'done' | 'error'

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function BankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" />
    </svg>
  )
}

function typeIcon(type: ImportType) {
  switch (type) {
    case 'facture_ocr':    return <FileText className="w-5 h-5 text-violet-400" />
    case 'releve_bancaire': return <BankIcon className="w-5 h-5 text-blue-400" />
    case 'fec_import':     return <BarChart3 className="w-5 h-5 text-emerald-400" />
    case 'excel_batch':    return <FileSpreadsheet className="w-5 h-5 text-orange-400" />
    default:               return <FileText className="w-5 h-5 text-slate-400" />
  }
}

function typeBadge(type: ImportType): { label: string; color: string } {
  switch (type) {
    case 'facture_ocr':    return { label: 'Facture OCR', color: 'bg-violet-900/50 text-violet-300 border-violet-700' }
    case 'releve_bancaire': return { label: 'Relevé bancaire', color: 'bg-blue-900/50 text-blue-300 border-blue-700' }
    case 'fec_import':     return { label: 'FEC', color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' }
    case 'excel_batch':    return { label: 'Import Excel', color: 'bg-orange-900/50 text-orange-300 border-orange-700' }
    default:               return { label: 'Inconnu', color: 'bg-slate-800 text-slate-400 border-slate-600' }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UniversalImportHub() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [detection, setDetection] = useState<DetectResult | null>(null)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const reset = () => {
    setStep('idle')
    setCurrentFile(null)
    setDetection(null)
    setResult(null)
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const detectFile = useCallback(async (file: File) => {
    setCurrentFile(file)
    setStep('detecting')
    setDetection(null)
    setResult(null)
    setErrorMsg(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/import/detect', { method: 'POST', body: fd })
      const data = await res.json() as DetectResult & { error?: string }
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur détection')
        setStep('error')
        return
      }
      setDetection(data)
      setStep('detected')
    } catch {
      setErrorMsg('Impossible de détecter le type de fichier')
      setStep('error')
    }
  }, [])

  const processFile = useCallback(async () => {
    if (!currentFile || !detection) return
    setStep('processing')

    // ── Redirect cases ──────────────────────────────────────────────
    if (detection.preview.action === 'redirect' && detection.preview.redirect_to) {
      router.push(detection.preview.redirect_to)
      return
    }

    // ── Process here (fec_import / excel_batch) ─────────────────────
    const fd = new FormData()
    fd.append('file', currentFile)
    fd.append('detected_type', detection.type)

    try {
      const res = await fetch('/api/import/process', { method: 'POST', body: fd })
      const data = await res.json() as ProcessResult & { error?: string }

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur traitement')
        setStep('error')
        return
      }

      setResult(data)
      setStep('done')
      toast.success(`${data.processed_count} éléments importés`)
    } catch {
      setErrorMsg('Erreur lors du traitement')
      setStep('error')
    }
  }, [currentFile, detection, router])

  const handleFile = (file: File) => {
    detectFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // ── Render ────────────────────────────────────────────────────────

  if (step === 'idle') {
    return (
      <div>
        <div
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-emerald-400 bg-emerald-950/30'
              : 'border-slate-600 bg-slate-800/40 hover:border-emerald-500 hover:bg-emerald-950/20'
          }`}
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,.fec,.jpg,.jpeg,.png,.ofx,.qif"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">
              Glissez ou cliquez pour importer
            </span>
            <span className="text-xs text-slate-500">
              PDF, Excel, CSV, FEC, image
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'detecting') {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Analyse de <span className="font-medium text-white">{currentFile?.name}</span>…</span>
        </div>
      </div>
    )
  }

  if (step === 'detected' && detection) {
    const badge = typeBadge(detection.type)
    const isRedirect = detection.preview.action === 'redirect'
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-3">
        {/* File + type */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {typeIcon(detection.type)}
            <span className="text-sm font-medium text-white truncate">{currentFile?.name}</span>
          </div>
          <button onClick={reset} className="text-slate-500 hover:text-slate-300 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-xs text-slate-400">
            confiance {detection.confidence}%
          </span>
        </div>

        <p className="text-xs text-slate-400">{detection.preview.description}</p>

        {/* Confidence bar */}
        <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${detection.confidence}%` }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={processFile}
            className="flex-1 text-sm py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
          >
            {isRedirect ? `Aller vers ${detection.preview.redirect_to?.replace('/', '')}` : 'Traiter maintenant'}
          </button>
          <button
            onClick={reset}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-400 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Traitement en cours…</span>
        </div>
      </div>
    )
  }

  if (step === 'done' && result) {
    return (
      <div className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Import terminé</span>
          </div>
          <button onClick={reset} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-4 text-xs text-slate-400">
          <span><span className="text-emerald-400 font-semibold">{result.processed_count}</span> importés</span>
          {result.error_count > 0 && (
            <span><span className="text-red-400 font-semibold">{result.error_count}</span> erreurs</span>
          )}
        </div>
        {result.errors.length > 0 && (
          <ul className="text-xs text-red-400 space-y-0.5 max-h-20 overflow-y-auto">
            {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        )}
        <button
          onClick={reset}
          className="text-xs text-emerald-400 hover:text-emerald-300 underline"
        >
          Importer un autre fichier
        </button>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Erreur</span>
        </div>
        <p className="text-xs text-slate-400">{errorMsg}</p>
        <button
          onClick={reset}
          className="text-xs text-emerald-400 hover:text-emerald-300 underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return null
}
