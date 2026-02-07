'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Facture, Transaction } from '@/types'
import type {
  RapprochementFacture,
  AnomalieDetectee,
  AnomalyStatus,
} from '@/lib/matching/matching-types'

interface EnrichedRapprochement extends RapprochementFacture {
  facture: Facture | null
  transaction: Transaction | null
}

interface RapprochementStats {
  total: number
  auto_valide: number
  suggestions: number
  manuels: number
  rejetes: number
}

interface AnomalyStats {
  total: number
  ouvertes: number
  critical: number
  warning: number
  info: number
}

interface MatchResult {
  auto_matched: number
  suggestions: number
  unmatched_factures: number
  unmatched_transactions: number
  anomalies: {
    total: number
    critical: number
    warning: number
    info: number
  }
}

export function useRapprochement(userId: string | undefined) {
  const [rapprochements, setRapprochements] = useState<EnrichedRapprochement[]>([])
  const [anomalies, setAnomalies] = useState<AnomalieDetectee[]>([])
  const [rapprochementStats, setRapprochementStats] = useState<RapprochementStats>({
    total: 0,
    auto_valide: 0,
    suggestions: 0,
    manuels: 0,
    rejetes: 0,
  })
  const [anomalyStats, setAnomalyStats] = useState<AnomalyStats>({
    total: 0,
    ouvertes: 0,
    critical: 0,
    warning: 0,
    info: 0,
  })
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)

  // Fetch suggestions/rapprochements
  const fetchRapprochements = useCallback(
    async (statut?: string) => {
      if (!userId) return

      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (statut) params.set('statut', statut)

        const res = await fetch(`/api/rapprochement/suggestions?${params.toString()}`)
        const data = await res.json()

        if (data.success) {
          setRapprochements(data.rapprochements)
          setRapprochementStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching rapprochements:', error)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  // Fetch anomalies
  const fetchAnomalies = useCallback(
    async (statut?: string, severite?: string) => {
      if (!userId) return

      try {
        const params = new URLSearchParams()
        if (statut) params.set('statut', statut)
        if (severite) params.set('severite', severite)

        const res = await fetch(`/api/rapprochement/anomalies?${params.toString()}`)
        const data = await res.json()

        if (data.success) {
          setAnomalies(data.anomalies)
          setAnomalyStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching anomalies:', error)
      }
    },
    [userId]
  )

  // Launch automatic matching
  const launchMatching = useCallback(async (): Promise<MatchResult | null> => {
    if (!userId) return null

    setMatching(true)
    try {
      const res = await fetch('/api/rapprochement/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()

      if (data.success) {
        // Refresh data after matching
        await Promise.all([fetchRapprochements(), fetchAnomalies()])
        return data as MatchResult
      }
      return null
    } catch (error) {
      console.error('Error launching matching:', error)
      return null
    } finally {
      setMatching(false)
    }
  }, [userId, fetchRapprochements, fetchAnomalies])

  // Validate a suggestion
  const validerRapprochement = useCallback(
    async (rapprochementId: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/rapprochement/valider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rapprochement_id: rapprochementId,
            action: 'valider',
          }),
        })
        const data = await res.json()

        if (data.success) {
          await fetchRapprochements()
          return true
        }
        return false
      } catch (error) {
        console.error('Error validating match:', error)
        return false
      }
    },
    [fetchRapprochements]
  )

  // Reject a suggestion
  const rejeterRapprochement = useCallback(
    async (rapprochementId: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/rapprochement/valider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rapprochement_id: rapprochementId,
            action: 'rejeter',
          }),
        })
        const data = await res.json()

        if (data.success) {
          await fetchRapprochements()
          return true
        }
        return false
      } catch (error) {
        console.error('Error rejecting match:', error)
        return false
      }
    },
    [fetchRapprochements]
  )

  // Create manual match
  const creerRapprochementManuel = useCallback(
    async (factureId: string, transactionId: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/rapprochement/valider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            facture_id: factureId,
            transaction_id: transactionId,
            action: 'creer',
          }),
        })
        const data = await res.json()

        if (data.success) {
          await fetchRapprochements()
          return true
        }
        return false
      } catch (error) {
        console.error('Error creating manual match:', error)
        return false
      }
    },
    [fetchRapprochements]
  )

  // Update anomaly status
  const updateAnomalyStatus = useCallback(
    async (
      anomalieId: string,
      statut: 'resolue' | 'ignoree',
      notes?: string
    ): Promise<boolean> => {
      try {
        const res = await fetch('/api/rapprochement/anomalies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anomalie_id: anomalieId,
            statut,
            notes,
          }),
        })
        const data = await res.json()

        if (data.success) {
          await fetchAnomalies()
          return true
        }
        return false
      } catch (error) {
        console.error('Error updating anomaly:', error)
        return false
      }
    },
    [fetchAnomalies]
  )

  // Auto-load on mount
  useEffect(() => {
    if (userId) {
      fetchRapprochements()
      fetchAnomalies('ouverte')
    }
  }, [userId, fetchRapprochements, fetchAnomalies])

  return {
    // Data
    rapprochements,
    anomalies,
    rapprochementStats,
    anomalyStats,

    // Loading states
    loading,
    matching,

    // Actions
    launchMatching,
    fetchRapprochements,
    fetchAnomalies,
    validerRapprochement,
    rejeterRapprochement,
    creerRapprochementManuel,
    updateAnomalyStatus,
  }
}
