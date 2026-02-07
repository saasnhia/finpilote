/**
 * Benchmarks sectoriels pour TPE/PME françaises
 * Sources : INSEE, BPI France, CCI France (moyennes indicatives)
 */

export interface SectorData {
  id: string
  label: string
  ca_moyen_mensuel: number         // CA moyen mensuel en €
  marge_moyenne: number            // Marge sur coûts variables en %
  charges_fixes_ratio: number      // Charges fixes / CA en %
  point_mort_moyen: number         // Point mort moyen en jours
  taux_charges_variables: number   // Taux charges variables en %
}

export const SECTORS: Record<string, SectorData> = {
  commerce: {
    id: 'commerce',
    label: 'Commerce',
    ca_moyen_mensuel: 45000,
    marge_moyenne: 22,
    charges_fixes_ratio: 30,
    point_mort_moyen: 160,
    taux_charges_variables: 65,
  },
  services: {
    id: 'services',
    label: 'Services',
    ca_moyen_mensuel: 30000,
    marge_moyenne: 35,
    charges_fixes_ratio: 40,
    point_mort_moyen: 120,
    taux_charges_variables: 40,
  },
  artisanat: {
    id: 'artisanat',
    label: 'Artisanat',
    ca_moyen_mensuel: 25000,
    marge_moyenne: 28,
    charges_fixes_ratio: 35,
    point_mort_moyen: 150,
    taux_charges_variables: 50,
  },
  restauration: {
    id: 'restauration',
    label: 'Restauration',
    ca_moyen_mensuel: 35000,
    marge_moyenne: 18,
    charges_fixes_ratio: 45,
    point_mort_moyen: 200,
    taux_charges_variables: 60,
  },
  tech: {
    id: 'tech',
    label: 'Tech / Digital',
    ca_moyen_mensuel: 40000,
    marge_moyenne: 45,
    charges_fixes_ratio: 55,
    point_mort_moyen: 100,
    taux_charges_variables: 25,
  },
  btp: {
    id: 'btp',
    label: 'BTP',
    ca_moyen_mensuel: 50000,
    marge_moyenne: 20,
    charges_fixes_ratio: 25,
    point_mort_moyen: 175,
    taux_charges_variables: 55,
  },
  sante: {
    id: 'sante',
    label: 'Santé / Bien-être',
    ca_moyen_mensuel: 20000,
    marge_moyenne: 40,
    charges_fixes_ratio: 45,
    point_mort_moyen: 130,
    taux_charges_variables: 30,
  },
}

export const DEFAULT_SECTOR = 'services'

export function getSectorBenchmark(sectorId: string): SectorData {
  return SECTORS[sectorId] || SECTORS[DEFAULT_SECTOR]
}

export function compareToBenchmark(
  userValue: number,
  sectorValue: number,
  lowerIsBetter: boolean = false
): { delta: number; status: 'above' | 'below' | 'near' } {
  const delta = userValue - sectorValue
  const relDelta = sectorValue > 0 ? Math.abs(delta) / sectorValue : 0

  // Within 5% = near
  if (relDelta < 0.05) return { delta, status: 'near' }

  if (lowerIsBetter) {
    return { delta, status: delta <= 0 ? 'above' : 'below' }
  }
  return { delta, status: delta >= 0 ? 'above' : 'below' }
}

export function getAllSectors(): SectorData[] {
  return Object.values(SECTORS)
}
