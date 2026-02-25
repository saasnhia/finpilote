'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Clock, Loader2, FileText, FileSpreadsheet, BarChart3 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportRecord {
  id: string
  file_name: string
  file_size: number | null
  detected_type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  processed_count: number
  error_count: number
  errors: string[]
  result_summary: Record<string, unknown>
  created_at: string
  completed_at: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusIcon(status: ImportRecord['status']) {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    case 'error':     return <AlertCircle className="w-3.5 h-3.5 text-red-400" />
    case 'processing': return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
    default:          return <Clock className="w-3.5 h-3.5 text-slate-400" />
  }
}

function typeIcon(type: string) {
  switch (type) {
    case 'fec_import':    return <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
    case 'excel_batch':   return <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
    case 'facture_ocr':   return <FileText className="w-3.5 h-3.5 text-violet-400" />
    case 'releve_bancaire': return <FileText className="w-3.5 h-3.5 text-blue-400" />
    default:              return <FileText className="w-3.5 h-3.5 text-slate-400" />
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'fec_import':    return 'FEC'
    case 'excel_batch':   return 'Excel'
    case 'facture_ocr':   return 'Facture'
    case 'releve_bancaire': return 'Relevé'
    default:              return 'Inconnu'
  }
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportHistoryList() {
  const [imports, setImports] = useState<ImportRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/import/history?limit=5')
      .then(r => r.json())
      .then((d: { imports?: ImportRecord[] }) => {
        setImports(d.imports ?? [])
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Chargement…
      </div>
    )
  }

  if (imports.length === 0) {
    return (
      <p className="text-xs text-slate-500 py-1">Aucun import récent</p>
    )
  }

  return (
    <ul className="space-y-1.5 mt-2">
      {imports.map(imp => (
        <li key={imp.id} className="flex items-center justify-between gap-2 group">
          <div className="flex items-center gap-1.5 min-w-0">
            {typeIcon(imp.detected_type)}
            <span className="text-xs text-slate-300 truncate max-w-[120px]" title={imp.file_name}>
              {imp.file_name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500 hidden group-hover:inline">
              {relativeTime(imp.created_at)}
            </span>
            <span className="text-xs text-slate-600 group-hover:hidden">
              {typeLabel(imp.detected_type)}
            </span>
            {statusIcon(imp.status)}
            {imp.status === 'completed' && (
              <span className="text-xs text-emerald-400">{imp.processed_count}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
