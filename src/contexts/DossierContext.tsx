'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface Dossier {
  id: string
  nom: string
  siren?: string | null
  secteur?: string | null
  email?: string | null
  actif: boolean
}

interface DossierContextValue {
  dossiers: Dossier[]
  activeDossier: Dossier | null
  setActiveDossier: (d: Dossier | null) => void
  loadDossiers: () => Promise<void>
  loading: boolean
}

const DossierContext = createContext<DossierContextValue>({
  dossiers: [],
  activeDossier: null,
  setActiveDossier: () => {},
  loadDossiers: async () => {},
  loading: false,
})

const STORAGE_KEY = 'worthifast_active_dossier_id'

export function DossierProvider({ children }: { children: ReactNode }) {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [activeDossier, setActiveDossierState] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(false)

  const loadDossiers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dossiers')
      if (!res.ok) return
      const data = await res.json()
      const list: Dossier[] = data.dossiers ?? []
      setDossiers(list)

      // Restore previously selected dossier from localStorage
      const savedId = typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null
      const restored = savedId ? list.find(d => d.id === savedId) : null
      setActiveDossierState(restored ?? list[0] ?? null)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDossiers() }, [loadDossiers])

  const setActiveDossier = useCallback((d: Dossier | null) => {
    setActiveDossierState(d)
    if (typeof window !== 'undefined') {
      if (d) localStorage.setItem(STORAGE_KEY, d.id)
      else localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return (
    <DossierContext.Provider value={{ dossiers, activeDossier, setActiveDossier, loadDossiers, loading }}>
      {children}
    </DossierContext.Provider>
  )
}

export function useDossier() {
  return useContext(DossierContext)
}
