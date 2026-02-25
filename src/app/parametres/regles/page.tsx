'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Wand2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronDown,
} from 'lucide-react'
import { PCG_COMPTES, TVA_CODES } from '@/lib/categorization/matcher'
import { FeatureGate } from '@/components/plans/FeatureGate'
import type { CategorizationRule } from '@/lib/categorization/matcher'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface BatchResult {
  created: number
  updated: number
  auto_applied: number
  message: string
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value)
  const color =
    pct >= 85 ? 'bg-emerald-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-9 text-right">{pct}%</span>
    </div>
  )
}

const pcgOptions = Object.entries(PCG_COMPTES).map(([code, label]) => ({
  value: code,
  label: `${code} — ${label}`,
}))

const tvaOptions = Object.entries(TVA_CODES).map(([code, label]) => ({
  value: code,
  label,
}))

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export default function ReglesPage() {
  const [rules, setRules] = useState<CategorizationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // New rule form
  const [showForm, setShowForm] = useState(false)
  const [formFournisseur, setFormFournisseur] = useState('')
  const [formCompte, setFormCompte] = useState('')
  const [formTva, setFormTva] = useState('TVA20')
  const [formCategorie, setFormCategorie] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/categorization/rules')
      const data = await res.json() as { rules?: CategorizationRule[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setRules(data.rules ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  // ---- Create rule ----
  async function handleCreate() {
    if (!formFournisseur.trim() || !formCompte) {
      setFormError('Fournisseur et compte sont requis')
      return
    }
    setFormLoading(true)
    setFormError(null)
    try {
      const res = await fetch('/api/categorization/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fournisseur_display: formFournisseur.trim(),
          compte_comptable: formCompte,
          code_tva: formTva,
          categorie: formCategorie.trim() || null,
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setShowForm(false)
      setFormFournisseur('')
      setFormCompte('')
      setFormTva('TVA20')
      setFormCategorie('')
      await fetchRules()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setFormLoading(false)
    }
  }

  // ---- Toggle active ----
  async function handleToggle(rule: CategorizationRule) {
    try {
      await fetch(`/api/categorization/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      })
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
    } catch {
      // silent
    }
  }

  // ---- Delete rule ----
  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette règle ?')) return
    try {
      await fetch(`/api/categorization/rules/${id}`, { method: 'DELETE' })
      setRules(prev => prev.filter(r => r.id !== id))
    } catch {
      // silent
    }
  }

  // ---- Batch learn ----
  async function handleBatch() {
    setBatchLoading(true)
    setBatchResult(null)
    try {
      const res = await fetch('/api/categorization/learn/batch', { method: 'POST' })
      const data = await res.json() as BatchResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setBatchResult(data)
      await fetchRules()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setBatchLoading(false)
    }
  }

  const filtered = rules.filter(r =>
    !search ||
    r.fournisseur_display?.toLowerCase().includes(search.toLowerCase()) ||
    r.compte_comptable.includes(search) ||
    r.compte_label?.toLowerCase().includes(search.toLowerCase())
  )

  const sourceBadge = (source: string) => {
    switch (source) {
      case 'manual': return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">Manuel</span>
      case 'learned': return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300">Appris</span>
      case 'suggested': return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300">Suggéré</span>
      default: return null
    }
  }

  return (
    <AppShell>
      <FeatureGate feature="categorization_rules" requiredPlan="cabinet">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-400/10">
              <Wand2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Règles automatiques</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Associez vos fournisseurs à un compte PCG — appliqué automatiquement à chaque import
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleBatch}
              disabled={batchLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${batchLoading ? 'animate-spin' : ''}`} />
              {batchLoading ? 'Apprentissage…' : 'Apprendre des factures'}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle règle
            </Button>
          </div>
        </div>

        {/* Batch result banner */}
        {batchResult && (
          <Card className="!bg-emerald-900/30 !border-emerald-500/30">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm">{batchResult.message}</p>
              <button className="ml-auto text-emerald-500 hover:text-emerald-300" onClick={() => setBatchResult(null)}>✕</button>
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="!bg-red-900/30 !border-red-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* New rule form */}
        {showForm && (
          <Card>
            <h2 className="text-white font-semibold mb-4">Nouvelle règle de catégorisation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fournisseur *</label>
                <Input
                  value={formFournisseur}
                  onChange={e => setFormFournisseur(e.target.value)}
                  placeholder="Ex: EDF, Orange, Freelance Studio…"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Compte PCG *</label>
                <div className="relative">
                  <select
                    value={formCompte}
                    onChange={e => setFormCompte(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-600 text-white px-3 py-2 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  >
                    <option value="">Choisir un compte…</option>
                    {pcgOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Code TVA</label>
                <div className="relative">
                  <select
                    value={formTva}
                    onChange={e => setFormTva(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-600 text-white px-3 py-2 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  >
                    {tvaOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Catégorie (optionnel)</label>
                <Input
                  value={formCategorie}
                  onChange={e => setFormCategorie(e.target.value)}
                  placeholder="Ex: Fournitures, Loyer, SaaS…"
                />
              </div>
            </div>
            {formError && (
              <p className="text-red-400 text-sm mt-3">{formError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="primary" onClick={handleCreate} disabled={formLoading}>
                {formLoading ? 'Création…' : 'Créer la règle'}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setFormError(null) }}>
                Annuler
              </Button>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card padding="sm">
            <p className="text-xs text-slate-400">Règles actives</p>
            <p className="text-2xl font-bold text-white mt-1">
              {rules.filter(r => r.is_active).length}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-slate-400">Règles apprises</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {rules.filter(r => r.source === 'learned').length}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-slate-400">Applications totales</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {rules.reduce((sum, r) => sum + r.match_count, 0)}
            </p>
          </Card>
        </div>

        {/* Rules table */}
        <Card padding="none">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher fournisseur ou compte PCG…"
                className="w-full pl-9 pr-4 py-2 bg-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 border border-slate-700"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Wand2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {search ? 'Aucune règle ne correspond à votre recherche.' : 'Aucune règle encore. Créez-en une ou cliquez sur "Apprendre des factures".'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs text-slate-500 font-medium uppercase tracking-wide">
                <div className="col-span-3">Fournisseur</div>
                <div className="col-span-3">Compte PCG</div>
                <div className="col-span-1">TVA</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-1 text-center">Usages</div>
                <div className="col-span-1">Source</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {filtered.map(rule => (
                <div
                  key={rule.id}
                  className={`grid grid-cols-12 gap-3 px-4 py-3 items-center transition-colors hover:bg-slate-800/30 ${!rule.is_active ? 'opacity-50' : ''}`}
                >
                  {/* Fournisseur */}
                  <div className="col-span-3">
                    <p className="text-sm text-white font-medium truncate">
                      {rule.fournisseur_display ?? rule.fournisseur_pattern}
                    </p>
                    {rule.categorie && (
                      <p className="text-xs text-slate-500 truncate">{rule.categorie}</p>
                    )}
                  </div>

                  {/* Compte PCG */}
                  <div className="col-span-3">
                    <p className="text-sm text-emerald-400 font-mono">{rule.compte_comptable}</p>
                    <p className="text-xs text-slate-400 truncate">{rule.compte_label ?? '—'}</p>
                  </div>

                  {/* TVA */}
                  <div className="col-span-1">
                    <span className="text-xs text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded">
                      {rule.code_tva}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="col-span-2">
                    <ConfidenceBar value={rule.confidence} />
                  </div>

                  {/* Usages */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-slate-300">{rule.match_count}</span>
                  </div>

                  {/* Source */}
                  <div className="col-span-1">
                    {sourceBadge(rule.source)}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggle(rule)}
                      className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                      title={rule.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {rule.is_active
                        ? <ToggleRight className="h-4 w-4 text-emerald-400" />
                        : <ToggleLeft className="h-4 w-4 text-slate-500" />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-1.5 rounded-lg hover:bg-red-900/40 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Info box */}
        <Card className="!bg-slate-800/50 !border-slate-700">
          <div className="flex gap-3">
            <Wand2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-400 space-y-1">
              <p className="text-white font-medium">Comment fonctionnent les règles ?</p>
              <p>À chaque import de facture, FinSoft compare le nom du fournisseur à vos règles actives. Si une correspondance est trouvée avec une confiance ≥ 90%, le compte PCG est appliqué automatiquement.</p>
              <p>Le bouton <strong className="text-white">"Apprendre des factures"</strong> scanne vos factures déjà catégorisées pour créer ou renforcer les règles existantes.</p>
            </div>
          </div>
        </Card>
      </div>
      </FeatureGate>
    </AppShell>
  )
}
