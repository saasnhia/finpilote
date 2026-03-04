'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle, Sparkles, Euro, Download } from 'lucide-react'
import type { TVAResult, TVAAlerte } from '@/lib/agents/tva-agent'

type State = 'idle' | 'loading' | 'success' | 'error'

const ALERTE_STYLES: Record<string, string> = {
  erreur: 'bg-red-50 border-red-200 text-red-700',
  avertissement: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

function formatEur(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function TVAAgent() {
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<TVAResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/ai/agent-tva', { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Erreur inconnue')
      setResult(data)
      setState('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setState('error')
    }
  }

  const exportTxt = () => {
    if (!result) return
    const content = [
      'RÉSUMÉ CA3 — Worthifast',
      '='.repeat(40),
      '',
      result.resume_ca3,
      '',
      `TVA collectée  : ${formatEur(result.tva_collectee)}`,
      `TVA déductible : ${formatEur(result.tva_deductible)}`,
      `Solde à payer  : ${formatEur(result.solde)}`,
      '',
      'CONSEILS :',
      ...result.conseils.map(c => `• ${c}`),
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume-ca3-worthifast.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {state === 'idle' && (
        <p className="text-sm text-gray-500">
          Analyse les transactions du trimestre courant, vérifie les taux TVA et génère un résumé CA3.
        </p>
      )}

      {state !== 'loading' && (
        <button
          onClick={run}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Analyser la TVA
        </button>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-3 py-6 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm">Calcul TVA en cours…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {state === 'success' && result && (
        <div className="space-y-4">
          {/* KPIs TVA */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Collectée', val: result.tva_collectee, color: 'text-emerald-600' },
              { label: 'Déductible', val: result.tva_deductible, color: 'text-blue-600' },
              { label: 'À payer', val: result.solde, color: result.solde > 0 ? 'text-amber-600' : 'text-emerald-600' },
            ].map(({ label, val, color }) => (
              <div key={label} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                <Euro className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                <p className={`text-lg font-bold ${color}`}>{formatEur(val)}</p>
                <p className="text-[11px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Alertes */}
          {result.alertes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Alertes</p>
              {result.alertes.map((a: TVAAlerte, i) => (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm ${ALERTE_STYLES[a.type] ?? ALERTE_STYLES.info}`}>
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {a.message}
                </div>
              ))}
            </div>
          )}

          {/* Résumé CA3 */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Résumé CA3</p>
            <p className="text-sm text-gray-700 leading-relaxed">{result.resume_ca3}</p>
          </div>

          {/* Conseils */}
          {result.conseils.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Conseils</p>
              {result.conseils.map((c, i) => (
                <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-emerald-500 flex-shrink-0">›</span>{c}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={exportTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter résumé
            </button>
            <button
              onClick={run}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ↻ Relancer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
