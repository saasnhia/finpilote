import type { Transaction, TVACalculationResult } from '@/types'

/**
 * Taux de TVA français standards
 */
export const TVA_RATES = {
  STANDARD: 20.0, // Taux normal
  INTERMEDIAIRE: 10.0, // Taux intermédiaire
  REDUIT: 5.5, // Taux réduit
  SUPER_REDUIT: 2.1, // Taux super réduit
} as const

/**
 * Calcule le montant HT à partir du TTC et du taux de TVA
 */
function calculateHT(ttc: number, tauxTVA: number): number {
  return ttc / (1 + tauxTVA / 100)
}

/**
 * Calcule le montant de TVA à partir du TTC et du taux
 */
function calculateTVA(ttc: number, tauxTVA: number): number {
  const ht = calculateHT(ttc, tauxTVA)
  return ttc - ht
}

/**
 * Détermine le taux de TVA d'une transaction
 * Utilise le champ tva_taux si disponible, sinon devine selon la catégorie
 */
function getTauxTVA(transaction: Transaction): number {
  // Si le taux est explicitement défini, l'utiliser
  if (transaction.tva_taux !== undefined && transaction.tva_taux !== null) {
    return transaction.tva_taux
  }

  // Sinon, deviner selon la catégorie (à améliorer selon les besoins)
  const category = transaction.category.toLowerCase()

  // Taux réduit 5.5% : livres, restauration, énergie
  if (category.includes('livre') || category.includes('restauration') || category.includes('energie')) {
    return TVA_RATES.REDUIT
  }

  // Taux intermédiaire 10% : transport, hébergement
  if (category.includes('transport') || category.includes('hébergement') || category.includes('hotel')) {
    return TVA_RATES.INTERMEDIAIRE
  }

  // Taux super réduit 2.1% : médicaments remboursables
  if (category.includes('medicament') || category.includes('santé')) {
    return TVA_RATES.SUPER_REDUIT
  }

  // Par défaut : taux normal 20%
  return TVA_RATES.STANDARD
}

/**
 * Groupe les transactions par taux de TVA
 */
function groupByTauxTVA(transactions: Transaction[]): Map<number, Transaction[]> {
  const grouped = new Map<number, Transaction[]>()

  for (const transaction of transactions) {
    const taux = getTauxTVA(transaction)
    if (!grouped.has(taux)) {
      grouped.set(taux, [])
    }
    grouped.get(taux)!.push(transaction)
  }

  return grouped
}

/**
 * Calcule les montants pour un groupe de transactions à un taux donné
 */
function calculateGroupTotals(transactions: Transaction[], tauxTVA: number) {
  let totalTTC = 0
  let totalTVA = 0

  for (const tx of transactions) {
    totalTTC += tx.amount
    totalTVA += calculateTVA(tx.amount, tauxTVA)
  }

  const totalHT = totalTTC - totalTVA

  return {
    ht: Math.round(totalHT * 100) / 100,
    tva: Math.round(totalTVA * 100) / 100,
    ttc: Math.round(totalTTC * 100) / 100,
    count: transactions.length,
  }
}

/**
 * Calcule la TVA pour une période donnée
 */
export function calculateTVAPeriod(
  transactions: Transaction[],
  periodeDebut: string,
  periodeFin: string
): TVACalculationResult {
  // Filtrer les transactions dans la période
  const startDate = new Date(periodeDebut)
  const endDate = new Date(periodeFin)

  const transactionsInPeriod = transactions.filter(tx => {
    const txDate = new Date(tx.date)
    return txDate >= startDate && txDate <= endDate
  })

  // Séparer ventes (income) et achats (expense)
  const ventes = transactionsInPeriod.filter(tx => tx.type === 'income')
  const achats = transactionsInPeriod.filter(tx => tx.type === 'expense')

  // Grouper par taux de TVA
  const ventesParTaux = groupByTauxTVA(ventes)
  const achatsParTaux = groupByTauxTVA(achats)

  // Calculer les totaux par taux
  const ventes20 = calculateGroupTotals(ventesParTaux.get(20) || [], 20)
  const ventes10 = calculateGroupTotals(ventesParTaux.get(10) || [], 10)
  const ventes55 = calculateGroupTotals(ventesParTaux.get(5.5) || [], 5.5)
  const ventes21 = calculateGroupTotals(ventesParTaux.get(2.1) || [], 2.1)

  const achats20 = calculateGroupTotals(achatsParTaux.get(20) || [], 20)
  const achats10 = calculateGroupTotals(achatsParTaux.get(10) || [], 10)
  const achats55 = calculateGroupTotals(achatsParTaux.get(5.5) || [], 5.5)
  const achats21 = calculateGroupTotals(achatsParTaux.get(2.1) || [], 2.1)

  // Totaux généraux
  const totalVentesHT = ventes20.ht + ventes10.ht + ventes55.ht + ventes21.ht
  const totalVentesTTC = ventes20.ttc + ventes10.ttc + ventes55.ttc + ventes21.ttc
  const totalTVACollectee = ventes20.tva + ventes10.tva + ventes55.tva + ventes21.tva

  const totalAchatsHT = achats20.ht + achats10.ht + achats55.ht + achats21.ht
  const totalAchatsTTC = achats20.ttc + achats10.ttc + achats55.ttc + achats21.ttc
  const totalTVADeductible = achats20.tva + achats10.tva + achats55.tva + achats21.tva

  // TVA nette (positive = à payer, négative = crédit)
  const tvaNette = Math.round((totalTVACollectee - totalTVADeductible) * 100) / 100

  return {
    periode_debut: periodeDebut,
    periode_fin: periodeFin,

    ventes: {
      total_ht: Math.round(totalVentesHT * 100) / 100,
      total_ttc: Math.round(totalVentesTTC * 100) / 100,
      tva_collectee: Math.round(totalTVACollectee * 100) / 100,
      par_taux: {
        taux_20: ventes20,
        taux_10: ventes10,
        taux_55: ventes55,
        taux_21: ventes21,
      },
    },

    achats: {
      total_ht: Math.round(totalAchatsHT * 100) / 100,
      total_ttc: Math.round(totalAchatsTTC * 100) / 100,
      tva_deductible: Math.round(totalTVADeductible * 100) / 100,
      par_taux: {
        taux_20: achats20,
        taux_10: achats10,
        taux_55: achats55,
        taux_21: achats21,
      },
    },

    tva_nette: tvaNette,
    transactions_count: transactionsInPeriod.length,
  }
}

/**
 * Détermine la période de déclaration selon le régime
 */
export function getPeriodeDates(
  regime: 'reel_normal' | 'reel_simplifie' | 'franchise',
  date: Date = new Date()
): { debut: string; fin: string } {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-11

  if (regime === 'reel_normal') {
    // Déclaration mensuelle : mois précédent
    const debutMonth = month === 0 ? 11 : month - 1
    const debutYear = month === 0 ? year - 1 : year

    const debut = new Date(debutYear, debutMonth, 1)
    const fin = new Date(year, month, 0) // Dernier jour du mois précédent

    return {
      debut: debut.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0],
    }
  } else if (regime === 'reel_simplifie') {
    // Déclaration annuelle : année précédente
    const debut = new Date(year - 1, 0, 1)
    const fin = new Date(year - 1, 11, 31)

    return {
      debut: debut.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0],
    }
  } else {
    // Franchise en base : pas de déclaration
    return {
      debut: '',
      fin: '',
    }
  }
}

/**
 * Valide qu'une période est cohérente
 */
export function validatePeriode(debut: string, fin: string): { valid: boolean; error?: string } {
  const startDate = new Date(debut)
  const endDate = new Date(fin)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { valid: false, error: 'Dates invalides' }
  }

  if (startDate >= endDate) {
    return { valid: false, error: 'La date de début doit être antérieure à la date de fin' }
  }

  // Vérifier que la période ne dépasse pas 1 an
  const diffMs = endDate.getTime() - startDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays > 366) {
    return { valid: false, error: 'La période ne peut pas dépasser 1 an' }
  }

  return { valid: true }
}
