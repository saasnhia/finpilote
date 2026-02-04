'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { UploadReleve } from '@/components/banques/UploadReleve'
import { Card, Button } from '@/components/ui'
import { ArrowLeft, Building2, AlertCircle, Plus } from 'lucide-react'

export default function ImportRelevePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { accounts, loading } = useBankAccounts(user?.id)

  const handleImportSuccess = () => {
    // Redirect to transactions page after successful import
    router.push('/transactions')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-navy-200 rounded w-1/4" />
          <div className="h-64 bg-navy-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-2 text-sm text-navy-600 hover:text-navy-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux transactions
        </Link>
        <h1 className="text-2xl font-display font-bold text-navy-900">
          Import relevé bancaire
        </h1>
        <p className="text-sm text-navy-500 mt-1">
          Importez automatiquement vos transactions depuis un fichier CSV
        </p>
      </div>

      {/* No Accounts Warning */}
      {accounts.length === 0 ? (
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-gold-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-navy-900 mb-1">
                Aucun compte bancaire configuré
              </h3>
              <p className="text-sm text-navy-600 mb-4">
                Vous devez d'abord ajouter un compte bancaire avant de pouvoir importer des relevés.
              </p>
              <Link href="/parametres/banques">
                <Button icon={<Plus className="w-4 h-4" />}>Ajouter un compte bancaire</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Accounts Info */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-medium text-navy-900">Comptes disponibles</h3>
            </div>
            <div className="space-y-2">
              {accounts
                .filter(acc => acc.is_active)
                .map(account => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-navy-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy-900">{account.account_name}</p>
                      <p className="text-xs text-navy-500">{account.bank_name}</p>
                    </div>
                    <p className="text-sm font-mono text-navy-600">
                      {account.iban.slice(0, 4)} •••• {account.iban.slice(-4)}
                    </p>
                  </div>
                ))}
            </div>
            <Link
              href="/parametres/banques"
              className="inline-block text-sm text-emerald-600 hover:text-emerald-700 mt-3"
            >
              Gérer les comptes →
            </Link>
          </Card>

          {/* Upload Component */}
          <UploadReleve bankAccounts={accounts} onImportSuccess={handleImportSuccess} />

          {/* Help Section */}
          <Card className="bg-navy-50 border-navy-200">
            <h3 className="font-medium text-navy-900 mb-3">Formats supportés</h3>
            <div className="space-y-2 text-sm text-navy-600">
              <p>
                <strong>BNP Paribas:</strong> Exportez vos opérations au format CSV depuis votre
                espace en ligne
              </p>
              <p>
                <strong>Société Générale:</strong> Téléchargez l'historique des transactions en
                CSV
              </p>
              <p>
                <strong>Crédit Agricole:</strong> Exportez le relevé de compte au format CSV
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-navy-200">
              <p className="text-xs text-navy-500">
                💡 Les doublons sont automatiquement détectés et ignorés lors de l'import
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
