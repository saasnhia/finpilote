import { useState, useEffect, useCallback } from 'react'
import type { BankAccount } from '@/types'

export function useBankAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all bank accounts
  const fetchAccounts = useCallback(async () => {
    if (!userId) {
      setAccounts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/banques')
      const data = await response.json()

      if (data.success) {
        setAccounts(data.accounts || [])
      } else {
        setError(data.error || 'Erreur lors de la récupération des comptes')
      }
    } catch (err: any) {
      setError('Erreur réseau: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Add new bank account
  const addAccount = useCallback(
    async (accountData: {
      bank_name: string
      account_name: string
      iban: string
      bic?: string
      account_type?: 'checking' | 'savings' | 'business'
      current_balance?: number
    }) => {
      try {
        const response = await fetch('/api/banques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountData),
        })

        const data = await response.json()

        if (data.success) {
          setAccounts(prev => [data.account, ...prev])
          return { success: true, account: data.account }
        } else {
          return { success: false, error: data.error }
        }
      } catch (err: any) {
        return { success: false, error: 'Erreur réseau: ' + err.message }
      }
    },
    []
  )

  // Update bank account
  const updateAccount = useCallback(
    async (
      accountId: string,
      updates: {
        account_name?: string
        bank_name?: string
        current_balance?: number
        is_active?: boolean
      }
    ) => {
      try {
        const response = await fetch(`/api/banques/${accountId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        const data = await response.json()

        if (data.success) {
          setAccounts(prev =>
            prev.map(acc => (acc.id === accountId ? data.account : acc))
          )
          return { success: true, account: data.account }
        } else {
          return { success: false, error: data.error }
        }
      } catch (err: any) {
        return { success: false, error: 'Erreur réseau: ' + err.message }
      }
    },
    []
  )

  // Delete bank account
  const deleteAccount = useCallback(async (accountId: string) => {
    try {
      const response = await fetch(`/api/banques/${accountId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau: ' + err.message }
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  }
}
