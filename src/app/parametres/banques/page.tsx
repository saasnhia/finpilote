'use client'

import { useState } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { Plus, Trash2, Building2, CreditCard, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { BankAccount } from '@/types'

export default function BankAccountsPage() {
  const { user } = useAuth()
  const { accounts, loading, addAccount, deleteAccount, updateAccount } = useBankAccounts(user?.id)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    iban: '',
    bic: '',
    account_type: 'checking' as 'checking' | 'savings' | 'business',
    current_balance: '0',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const result = await addAccount({
        bank_name: formData.bank_name,
        account_name: formData.account_name,
        iban: formData.iban.replace(/\s/g, ''),
        bic: formData.bic || undefined,
        account_type: formData.account_type,
        current_balance: parseFloat(formData.current_balance) || 0,
      })

      if (result.success) {
        toast.success('Compte bancaire ajouté')
        setShowAddModal(false)
        setFormData({
          bank_name: '',
          account_name: '',
          iban: '',
          bic: '',
          account_type: 'checking',
          current_balance: '0',
        })
      } else {
        toast.error(result.error || 'Erreur lors de l\'ajout')
      }
    } catch (error: any) {
      toast.error('Erreur réseau')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm('Supprimer ce compte bancaire ?')) return

    const result = await deleteAccount(accountId)
    if (result.success) {
      toast.success('Compte supprimé')
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  const toggleActive = async (account: BankAccount) => {
    const result = await updateAccount(account.id, {
      is_active: !account.is_active,
    })

    if (result.success) {
      toast.success(account.is_active ? 'Compte désactivé' : 'Compte activé')
    } else {
      toast.error(result.error || 'Erreur')
    }
  }

  const formatIBAN = (iban: string) => {
    return iban.match(/.{1,4}/g)?.join(' ') || iban
  }

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      checking: 'Compte courant',
      savings: 'Compte épargne',
      business: 'Compte professionnel',
    }
    return labels[type as keyof typeof labels] || type
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-navy-200 rounded w-1/4" />
          <div className="h-32 bg-navy-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Comptes bancaires
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            Gérez vos comptes bancaires pour l'import automatique
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Ajouter un compte
        </Button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-navy-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy-900 mb-2">
              Aucun compte bancaire
            </h3>
            <p className="text-sm text-navy-500 mb-6">
              Ajoutez votre premier compte pour commencer l'import automatique
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Ajouter un compte
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(account => (
            <Card key={account.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-navy-900">{account.account_name}</h3>
                    <p className="text-sm text-navy-500">{account.bank_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(account)}
                  className="p-1 hover:bg-navy-100 rounded transition-colors"
                >
                  {account.is_active ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-navy-400" />
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-navy-500 mb-1">IBAN</p>
                  <p className="text-sm font-mono text-navy-900">
                    {formatIBAN(account.iban)}
                  </p>
                </div>

                {account.bic && (
                  <div>
                    <p className="text-xs text-navy-500 mb-1">BIC</p>
                    <p className="text-sm font-mono text-navy-900">{account.bic}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Type</p>
                    <p className="text-sm text-navy-900">
                      {getAccountTypeLabel(account.account_type)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-navy-500 mb-1">Solde</p>
                    <p className="text-sm font-semibold text-navy-900">
                      {account.current_balance.toFixed(2)} €
                    </p>
                  </div>
                </div>

                {account.last_sync_date && (
                  <div>
                    <p className="text-xs text-navy-500">
                      Dernière synchro: {new Date(account.last_sync_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-navy-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(account.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="flex-1 text-coral-600 hover:bg-coral-50 border-coral-200"
                >
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-navy-900">
                Ajouter un compte bancaire
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-navy-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-navy-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom du compte"
                placeholder="Ex: Compte Pro FinPilote"
                value={formData.account_name}
                onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                required
              />

              <Input
                label="Banque"
                placeholder="Ex: BNP Paribas"
                value={formData.bank_name}
                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                required
              />

              <Input
                label="IBAN"
                placeholder="FR76 3000 1007 9412 3456 7890 185"
                value={formData.iban}
                onChange={e => setFormData({ ...formData, iban: e.target.value })}
                required
              />

              <Input
                label="BIC (optionnel)"
                placeholder="BNPAFRPP"
                value={formData.bic}
                onChange={e => setFormData({ ...formData, bic: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Type de compte
                </label>
                <select
                  value={formData.account_type}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      account_type: e.target.value as 'checking' | 'savings' | 'business',
                    })
                  }
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="checking">Compte courant</option>
                  <option value="business">Compte professionnel</option>
                  <option value="savings">Compte épargne</option>
                </select>
              </div>

              <Input
                label="Solde actuel"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.current_balance}
                onChange={e => setFormData({ ...formData, current_balance: e.target.value })}
                suffix="€"
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                  disabled={formLoading}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={formLoading}>
                  {formLoading ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
