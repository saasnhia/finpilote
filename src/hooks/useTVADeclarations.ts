import { useState, useEffect, useCallback } from 'react'
import type { DeclarationTVA, TVACalculationResult } from '@/types'

export function useTVADeclarations(userId: string | undefined) {
  const [declarations, setDeclarations] = useState<DeclarationTVA[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all declarations
  const fetchDeclarations = useCallback(async () => {
    if (!userId) {
      setDeclarations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/tva/declarations')
      const data = await response.json()

      if (data.success) {
        setDeclarations(data.declarations || [])
      } else {
        setError(data.error || 'Erreur lors de la récupération des déclarations')
      }
    } catch (err: any) {
      setError('Erreur réseau: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Calculate TVA for a period
  const calculateTVA = useCallback(
    async (periode_debut: string, periode_fin: string) => {
      try {
        const response = await fetch('/api/tva/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periode_debut, periode_fin }),
        })

        const data = await response.json()

        if (data.success) {
          return { success: true, result: data.result as TVACalculationResult }
        } else {
          return { success: false, error: data.error }
        }
      } catch (err: any) {
        return { success: false, error: 'Erreur réseau: ' + err.message }
      }
    },
    []
  )

  // Generate CA3 declaration
  const generateCA3 = useCallback(
    async (
      periode_debut: string,
      periode_fin: string,
      regime: 'reel_normal' | 'reel_simplifie' | 'franchise' = 'reel_normal',
      notes?: string
    ) => {
      try {
        const response = await fetch('/api/tva/generate-ca3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periode_debut, periode_fin, regime, notes }),
        })

        const data = await response.json()

        if (data.success) {
          // Refresh declarations list
          await fetchDeclarations()
          return { success: true, declaration: data.declaration, lignes: data.lignes }
        } else {
          return { success: false, error: data.error }
        }
      } catch (err: any) {
        return { success: false, error: 'Erreur réseau: ' + err.message }
      }
    },
    [fetchDeclarations]
  )

  // Get single declaration
  const getDeclaration = useCallback(async (declarationId: string) => {
    try {
      const response = await fetch(`/api/tva/declarations/${declarationId}`)
      const data = await response.json()

      if (data.success) {
        return { success: true, declaration: data.declaration, lignes: data.lignes }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau: ' + err.message }
    }
  }, [])

  // Update declaration
  const updateDeclaration = useCallback(
    async (
      declarationId: string,
      updates: Partial<DeclarationTVA>
    ) => {
      try {
        const response = await fetch(`/api/tva/declarations/${declarationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        const data = await response.json()

        if (data.success) {
          // Update local state
          setDeclarations(prev =>
            prev.map(d => (d.id === declarationId ? data.declaration : d))
          )
          return { success: true, declaration: data.declaration }
        } else {
          return { success: false, error: data.error }
        }
      } catch (err: any) {
        return { success: false, error: 'Erreur réseau: ' + err.message }
      }
    },
    []
  )

  // Delete declaration
  const deleteDeclaration = useCallback(
    async (declarationId: string) => {
      try {
        const response = await fetch(`/api/tva/declarations/${declarationId}`, {
          method: 'DELETE',
        })

        const data = await response.json()

        if (data.success) {
          // Remove from local state
          setDeclarations(prev => prev.filter(d => d.id !== declarationId))
          return { success: true }
        } else {
          return { success: false, error: data.error }
        }
      } catch (err: any) {
        return { success: false, error: 'Erreur réseau: ' + err.message }
      }
    },
    []
  )

  // Initial fetch
  useEffect(() => {
    fetchDeclarations()
  }, [fetchDeclarations])

  return {
    declarations,
    loading,
    error,
    fetchDeclarations,
    calculateTVA,
    generateCA3,
    getDeclaration,
    updateDeclaration,
    deleteDeclaration,
  }
}
