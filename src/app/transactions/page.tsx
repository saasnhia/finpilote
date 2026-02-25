'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useFinancialData } from '@/hooks/useFinancialData'
import { useUserPlan } from '@/hooks/useUserPlan'
import { CATEGORY_LABELS, type TransactionCategory } from '@/types'
import { formatCurrency } from '@/lib/calculations'
import { StatusBadge } from '@/components/rapprochement/StatusBadge'
import { QuickValidateButton } from '@/components/rapprochement/QuickValidateButton'
import type { RapprochementStatus, RapprochementType } from '@/components/rapprochement/StatusBadge'
import {
  Plus,
  Trash2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Tag,
  Loader2,
  X,
  ArrowRightLeft,
} from 'lucide-react'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface RapprochementInfo {
  id: string
  statut: RapprochementStatus
  type: RapprochementType
  confidence_score: number | null
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth()
  const { transactions, loading: dataLoading, addTransaction, deleteTransaction } = useFinancialData(user?.id)
  const { can } = useUserPlan()
  const canRapprochement = can('rapprochement_auto')

  const [showAddForm, setShowAddForm] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')

  // Rapprochement data
  const [rapMap, setRapMap] = useState<Map<string, RapprochementInfo>>(new Map())
  const [rapLoading, setRapLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'other' as TransactionCategory,
    date: new Date().toISOString().split('T')[0],
    is_fixed: false,
  })
  const [formLoading, setFormLoading] = useState(false)

  const loading = authLoading || dataLoading

  // ---- Load rapprochement status for all transactions ----
  const loadRapprochements = useCallback(async () => {
    if (!user?.id || !canRapprochement) return
    setRapLoading(true)
    try {
      const res = await fetch('/api/rapprochement/suggestions')
      if (!res.ok) return
      const data = await res.json() as {
        rapprochements?: Array<{
          id: string
          transaction_id: string
          statut: string
          type: string
          confidence_score: number | null
        }>
      }
      const map = new Map<string, RapprochementInfo>()
      for (const r of data.rapprochements ?? []) {
        map.set(r.transaction_id, {
          id: r.id,
          statut: r.statut as RapprochementStatus,
          type: r.type as RapprochementType,
          confidence_score: r.confidence_score,
        })
      }
      setRapMap(map)
    } catch {
      // silent
    } finally {
      setRapLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!dataLoading && user?.id) {
      loadRapprochements()
    }
  }, [dataLoading, user?.id, loadRapprochements])

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true
    return t.type === filterType
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount) return

    setFormLoading(true)
    try {
      await addTransaction({
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        is_fixed: formData.is_fixed,
      })
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        is_fixed: false,
      })
      setShowAddForm(false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      await deleteTransaction(id)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-navy-500">Chargement des transactions...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-navy-900">
              Transactions
            </h1>
            <p className="mt-1 text-navy-500">
              Gérez vos revenus et dépenses
            </p>
          </div>

          <Button
            onClick={() => setShowAddForm(true)}
            icon={<Plus className="w-5 h-5" />}
            disabled={!user}
          >
            Ajouter
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6" padding="sm">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-navy-400" />
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${filterType === type
                      ? 'bg-navy-900 text-white'
                      : 'bg-navy-100 text-navy-600 hover:bg-navy-200'
                    }
                  `}
                >
                  {type === 'all' && 'Tout'}
                  {type === 'income' && 'Revenus'}
                  {type === 'expense' && 'Dépenses'}
                </button>
              ))}
            </div>
            {rapLoading && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Chargement rapprochements…
              </span>
            )}
          </div>
        </Card>

        {/* Add Transaction Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
              onClick={() => setShowAddForm(false)}
            />
            <Card className="relative w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-semibold text-navy-900">
                  Nouvelle transaction
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-navy-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-navy-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(d => ({ ...d, type: 'expense' }))}
                    className={`
                      flex-1 py-3 rounded-xl font-medium transition-colors
                      ${formData.type === 'expense'
                        ? 'bg-coral-100 text-coral-700 border-2 border-coral-300'
                        : 'bg-navy-100 text-navy-600 border-2 border-transparent'
                      }
                    `}
                  >
                    Dépense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(d => ({ ...d, type: 'income' }))}
                    className={`
                      flex-1 py-3 rounded-xl font-medium transition-colors
                      ${formData.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                        : 'bg-navy-100 text-navy-600 border-2 border-transparent'
                      }
                    `}
                  >
                    Revenu
                  </button>
                </div>

                <Input
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                  placeholder="Ex: Loyer bureau"
                  disabled={formLoading}
                />

                <Input
                  label="Montant"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(d => ({ ...d, amount: e.target.value }))}
                  placeholder="0"
                  suffix="€"
                  disabled={formLoading}
                />

                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(d => ({ ...d, date: e.target.value }))}
                  disabled={formLoading}
                />

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(d => ({ ...d, category: e.target.value as TransactionCategory }))}
                    className="w-full px-4 py-2.5 bg-white border-2 border-navy-200 rounded-xl text-navy-900 focus:outline-none focus:border-emerald-500"
                    disabled={formLoading}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {formData.type === 'expense' && (
                  <label className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_fixed}
                      onChange={(e) => setFormData(d => ({ ...d, is_fixed: e.target.checked }))}
                      className="w-5 h-5 rounded border-navy-300 text-emerald-600 focus:ring-emerald-500"
                      disabled={formLoading}
                    />
                    <span className="text-sm text-navy-700">
                      Charge fixe (récurrente chaque mois)
                    </span>
                  </label>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    loading={formLoading}
                    className="flex-1"
                  >
                    Ajouter
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Transactions List */}
        <Card padding="none">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-navy-500">Aucune transaction</p>
              {!user && (
                <p className="text-sm text-navy-400 mt-2">
                  Connectez-vous pour ajouter des transactions
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-navy-100">
              {filteredTransactions.map((transaction) => {
                const rap = rapMap.get(transaction.id)
                const rapStatut: RapprochementStatus = rap ? rap.statut : 'none'
                const showQuickValidate = rap?.statut === 'suggestion'

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 hover:bg-navy-50 transition-colors gap-3"
                  >
                    {/* Icon */}
                    <div className={`
                      flex-shrink-0 p-2 rounded-lg
                      ${transaction.type === 'income'
                        ? 'bg-emerald-100'
                        : 'bg-coral-100'
                      }
                    `}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-coral-600" />
                      )}
                    </div>

                    {/* Description + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy-900 truncate">
                        {transaction.description}
                      </p>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-navy-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(transaction.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-navy-400">
                          <Tag className="w-3 h-3" />
                          {CATEGORY_LABELS[transaction.category as TransactionCategory] || transaction.category}
                        </span>
                        {transaction.is_fixed && (
                          <span className="px-2 py-0.5 bg-navy-100 text-navy-600 text-xs rounded-full">
                            Fixe
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rapprochement status — cabinet+ only */}
                    {canRapprochement && transaction.type === 'expense' && (
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <StatusBadge
                          statut={rapStatut}
                          type={rap?.type ?? null}
                          confidence={rap?.confidence_score ?? undefined}
                        />
                        {showQuickValidate && rap && (
                          <QuickValidateButton
                            rapprochementId={rap.id}
                            onValidated={loadRapprochements}
                          />
                        )}
                      </div>
                    )}

                    {/* Amount + delete */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <span className={`
                        font-mono font-semibold
                        ${transaction.type === 'income'
                          ? 'text-emerald-600'
                          : 'text-coral-600'
                        }
                      `}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>

                      {user && (
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-navy-400 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Link to rapprochement page */}
        {rapMap.size > 0 && (
          <div className="mt-4 text-center">
            <a
              href="/rapprochement"
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Gérer tous les rapprochements →
            </a>
          </div>
        )}
      </main>
    </AppShell>
  )
}
