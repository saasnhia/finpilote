'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FinancialData, Transaction } from '@/types'
import { generateDemoData, generateDemoHistory } from '@/lib/calculations'

export function useFinancialData(userId: string | undefined) {
  const [currentData, setCurrentData] = useState<FinancialData | null>(null)
  const [history, setHistory] = useState<FinancialData[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch financial data
  const fetchData = useCallback(async () => {
    if (!userId) {
      // Use demo data when not logged in
      setCurrentData(generateDemoData())
      setHistory(generateDemoHistory())
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Fetch current month data
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: currentData, error: currentError } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single()

      if (currentError && currentError.code !== 'PGRST116') {
        throw currentError
      }

      // Fetch history (last 6 months)
      const { data: historyData, error: historyError } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', userId)
        .order('month', { ascending: true })
        .limit(6)

      if (historyError) throw historyError

      // Fetch transactions
      const { data: transactionsData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100)

      if (transError) throw transError

      setCurrentData(currentData || generateDemoData())
      setHistory(historyData?.length ? historyData : generateDemoHistory())
      setTransactions(transactionsData || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Erreur lors du chargement des données')
      // Fallback to demo data
      setCurrentData(generateDemoData())
      setHistory(generateDemoHistory())
      return
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Save financial data
  const saveData = useCallback(async (data: Partial<FinancialData>) => {
    if (!userId) return

    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      const { error } = await supabase
        .from('financial_data')
        .upsert({
          user_id: userId,
          month: currentMonth,
          ...data,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,month',
        })

      if (error) throw error
      
      await fetchData()
    } catch (err) {
      console.error('Error saving data:', err)
      setError('Erreur lors de la sauvegarde')
    }
  }, [userId, supabase, fetchData])

  // Add transaction
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          ...transaction,
        })

      if (error) throw error
      
      await fetchData()
    } catch (err) {
      console.error('Error adding transaction:', err)
      setError('Erreur lors de l\'ajout de la transaction')
    }
  }, [userId, supabase, fetchData])

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      
      await fetchData()
    } catch (err) {
      console.error('Error deleting transaction:', err)
      setError('Erreur lors de la suppression')
    }
  }, [userId, supabase, fetchData])

  return {
    currentData,
    history,
    transactions,
    loading,
    error,
    saveData,
    addTransaction,
    deleteTransaction,
    refetch: fetchData,
  }
}
