import type { TVACalculationResult, CA3FormData, LigneCA3 } from '@/types'

/**
 * Génère les données du formulaire CA3 à partir d'un résultat de calcul TVA
 */
export function generateCA3Form(result: TVACalculationResult): CA3FormData {
  const { ventes, achats, tva_nette } = result

  // Section 1: Ventes et prestations de services
  const ligne_01 = ventes.par_taux.taux_20.ht
  const ligne_02 = ventes.par_taux.taux_20.tva

  const ligne_03 = ventes.par_taux.taux_10.ht
  const ligne_04 = ventes.par_taux.taux_10.tva

  const ligne_05 = ventes.par_taux.taux_55.ht
  const ligne_06 = ventes.par_taux.taux_55.tva

  const ligne_07 = ventes.par_taux.taux_21.ht
  const ligne_08 = ventes.par_taux.taux_21.tva

  // Section 2: Acquisitions intracommunautaires (non géré pour l'instant)
  const ligne_09 = 0
  const ligne_10 = 0

  // Section 3: Autres opérations imposables (non géré pour l'instant)
  const ligne_11 = 0
  const ligne_12 = 0

  // Section 4: Total TVA brute due
  const ligne_15 = ligne_02 + ligne_04 + ligne_06 + ligne_08 + ligne_10 + ligne_12

  // Section 5: TVA déductible
  // Ligne 19: Biens constituant des immobilisations (pour simplifier, on met 20% de la TVA déductible)
  const ligne_19 = Math.round(achats.tva_deductible * 0.2 * 100) / 100

  // Ligne 20: Autres biens et services (80% restant)
  const ligne_20 = Math.round(achats.tva_deductible * 0.8 * 100) / 100

  // Total TVA déductible
  const ligne_21 = ligne_19 + ligne_20

  // Section 6: TVA nette due ou crédit
  const ligne_23 = tva_nette

  // Section 7: Crédit de TVA à reporter
  const ligne_24 = tva_nette < 0 ? Math.abs(tva_nette) : 0

  return {
    ligne_01: Math.round(ligne_01 * 100) / 100,
    ligne_02: Math.round(ligne_02 * 100) / 100,
    ligne_03: Math.round(ligne_03 * 100) / 100,
    ligne_04: Math.round(ligne_04 * 100) / 100,
    ligne_05: Math.round(ligne_05 * 100) / 100,
    ligne_06: Math.round(ligne_06 * 100) / 100,
    ligne_07: Math.round(ligne_07 * 100) / 100,
    ligne_08: Math.round(ligne_08 * 100) / 100,
    ligne_09: Math.round(ligne_09 * 100) / 100,
    ligne_10: Math.round(ligne_10 * 100) / 100,
    ligne_11: Math.round(ligne_11 * 100) / 100,
    ligne_12: Math.round(ligne_12 * 100) / 100,
    ligne_15: Math.round(ligne_15 * 100) / 100,
    ligne_19: Math.round(ligne_19 * 100) / 100,
    ligne_20: Math.round(ligne_20 * 100) / 100,
    ligne_21: Math.round(ligne_21 * 100) / 100,
    ligne_23: Math.round(ligne_23 * 100) / 100,
    ligne_24: Math.round(ligne_24 * 100) / 100,
  }
}

/**
 * Génère les lignes CA3 pour la base de données
 */
export function generateLignesCA3(
  result: TVACalculationResult,
  ca3Form: CA3FormData
): Omit<LigneCA3, 'id' | 'declaration_id' | 'created_at' | 'updated_at'>[] {
  const lignes: Omit<LigneCA3, 'id' | 'declaration_id' | 'created_at' | 'updated_at'>[] = []

  // Ventes à 20%
  if (ca3Form.ligne_01 > 0) {
    lignes.push({
      ligne_numero: '01',
      ligne_libelle: 'Ventes et prestations de services (20%)',
      base_ht: ca3Form.ligne_01,
      taux_tva: 20.0,
      montant_tva: ca3Form.ligne_02,
      categorie: 'ventes',
      auto_calculated: true,
      transaction_count: result.ventes.par_taux.taux_20.count,
    })
  }

  // Ventes à 10%
  if (ca3Form.ligne_03 > 0) {
    lignes.push({
      ligne_numero: '03',
      ligne_libelle: 'Ventes et prestations de services (10%)',
      base_ht: ca3Form.ligne_03,
      taux_tva: 10.0,
      montant_tva: ca3Form.ligne_04,
      categorie: 'ventes',
      auto_calculated: true,
      transaction_count: result.ventes.par_taux.taux_10.count,
    })
  }

  // Ventes à 5.5%
  if (ca3Form.ligne_05 > 0) {
    lignes.push({
      ligne_numero: '05',
      ligne_libelle: 'Ventes et prestations de services (5.5%)',
      base_ht: ca3Form.ligne_05,
      taux_tva: 5.5,
      montant_tva: ca3Form.ligne_06,
      categorie: 'ventes',
      auto_calculated: true,
      transaction_count: result.ventes.par_taux.taux_55.count,
    })
  }

  // Ventes à 2.1%
  if (ca3Form.ligne_07 > 0) {
    lignes.push({
      ligne_numero: '07',
      ligne_libelle: 'Ventes et prestations de services (2.1%)',
      base_ht: ca3Form.ligne_07,
      taux_tva: 2.1,
      montant_tva: ca3Form.ligne_08,
      categorie: 'ventes',
      auto_calculated: true,
      transaction_count: result.ventes.par_taux.taux_21.count,
    })
  }

  // Total TVA brute due
  lignes.push({
    ligne_numero: '15',
    ligne_libelle: 'Total TVA brute due',
    montant_tva: ca3Form.ligne_15,
    categorie: 'ventes',
    auto_calculated: true,
    transaction_count: 0,
  })

  // TVA déductible - Immobilisations
  if (ca3Form.ligne_19 > 0) {
    lignes.push({
      ligne_numero: '19',
      ligne_libelle: 'TVA déductible - Biens constituant des immobilisations',
      montant_tva: ca3Form.ligne_19,
      categorie: 'achats',
      auto_calculated: true,
      transaction_count: Math.round(result.achats.par_taux.taux_20.count * 0.2),
    })
  }

  // TVA déductible - Autres biens et services
  if (ca3Form.ligne_20 > 0) {
    lignes.push({
      ligne_numero: '20',
      ligne_libelle: 'TVA déductible - Autres biens et services',
      montant_tva: ca3Form.ligne_20,
      categorie: 'achats',
      auto_calculated: true,
      transaction_count: Math.round(result.achats.par_taux.taux_20.count * 0.8),
    })
  }

  // Total TVA déductible
  lignes.push({
    ligne_numero: '21',
    ligne_libelle: 'Total TVA déductible',
    montant_tva: ca3Form.ligne_21,
    categorie: 'achats',
    auto_calculated: true,
    transaction_count: 0,
  })

  // TVA nette due
  lignes.push({
    ligne_numero: '23',
    ligne_libelle: ca3Form.ligne_23 >= 0 ? 'TVA nette due' : 'Crédit de TVA',
    montant_tva: ca3Form.ligne_23,
    categorie: ca3Form.ligne_23 >= 0 ? 'ventes' : 'credit_tva',
    auto_calculated: true,
    transaction_count: 0,
  })

  // Crédit de TVA à reporter
  if (ca3Form.ligne_24 > 0) {
    lignes.push({
      ligne_numero: '24',
      ligne_libelle: 'Crédit de TVA à reporter',
      montant_tva: ca3Form.ligne_24,
      categorie: 'credit_tva',
      auto_calculated: true,
      transaction_count: 0,
    })
  }

  return lignes
}

/**
 * Libellés des lignes CA3
 */
export const CA3_LABELS: Record<string, string> = {
  '01': 'Ventes et prestations de services - Taux normal (20%)',
  '02': 'TVA collectée sur ligne 01',
  '03': 'Ventes et prestations de services - Taux intermédiaire (10%)',
  '04': 'TVA collectée sur ligne 03',
  '05': 'Ventes et prestations de services - Taux réduit (5.5%)',
  '06': 'TVA collectée sur ligne 05',
  '07': 'Ventes et prestations de services - Taux super réduit (2.1%)',
  '08': 'TVA collectée sur ligne 07',
  '09': 'Acquisitions intracommunautaires',
  '10': 'TVA due sur ligne 09',
  '11': 'Livraisons à soi-même',
  '12': 'TVA due sur ligne 11',
  '15': 'Total TVA brute due (lignes 02+04+06+08+10+12)',
  '19': 'TVA déductible sur immobilisations',
  '20': 'TVA déductible sur autres biens et services',
  '21': 'Total TVA déductible (lignes 19+20)',
  '23': 'TVA nette due (ligne 15 - ligne 21)',
  '24': 'Crédit de TVA à reporter',
}
