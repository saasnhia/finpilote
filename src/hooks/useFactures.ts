'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Facture } from '@/types'

export function useFactures(userId: string | undefined) {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch factures
  const fetchFactures = useCallback(async () => {
    if (!userId) {
      setFactures([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('factures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      setFactures(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching factures:', err)
      setError('Erreur lors du chargement des factures')
      setFactures([])
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchFactures()
  }, [fetchFactures])

  // Update facture
  const updateFacture = useCallback(async (id: string, updates: Partial<Facture>) => {
    if (!userId) return

    try {
      const { error: updateError } = await supabase
        .from('factures')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (updateError) throw updateError

      await fetchFactures()
    } catch (err) {
      console.error('Error updating facture:', err)
      setError('Erreur lors de la mise à jour')
    }
  }, [userId, supabase, fetchFactures])

  // Delete facture
  const deleteFacture = useCallback(async (id: string) => {
    if (!userId) return

    try {
      const { error: deleteError } = await supabase
        .from('factures')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      await fetchFactures()
    } catch (err) {
      console.error('Error deleting facture:', err)
      setError('Erreur lors de la suppression')
    }
  }, [userId, supabase, fetchFactures])

  return {
    factures,
    loading,
    error,
    fetchFactures,
    updateFacture,
    deleteFacture,
  }
}
