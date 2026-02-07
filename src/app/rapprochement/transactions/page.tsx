'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRapprochement } from '@/hooks/useRapprochement'
import { TransactionMatchList } from '@/components/rapprochement/TransactionMatchList'
import { Button } from '@/components/ui'
import { ArrowLeft, Play, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function TransactionsRapprochementPage() {
  const { user } = useAuth()
  const {
    rapprochements,
    loading,
    matching,
    launchMatching,
    validerRapprochement,
    rejeterRapprochement,
  } = useRapprochement(user?.id)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/rapprochement"
            className="p-2 rounded-lg hover:bg-navy-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-navy-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Rapprochements Transactions
            </h1>
            <p className="text-sm text-navy-500 mt-1">
              {rapprochements.length} rapprochement{rapprochements.length > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
        <Button
          onClick={() => launchMatching()}
          loading={matching}
          icon={matching ? undefined : <Play className="w-4 h-4" />}
          size="sm"
        >
          {matching ? 'Analyse...' : 'Relancer'}
        </Button>
      </div>

      {/* Match List */}
      <TransactionMatchList
        rapprochements={rapprochements}
        onValidate={validerRapprochement}
        onReject={rejeterRapprochement}
        loading={loading}
      />
    </div>
  )
}
