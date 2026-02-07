import type {
  CompanyAuditData,
  AuditResult,
  AuditThresholds,
  AccountBalance,
  AccountRisk,
} from '@/types'

// ========================================
// Seuils légaux français (Code de commerce)
// Mis à jour : seuils 2024 applicables à partir de 2025
// Art. L823-1, R823-1 du Code de commerce
// ========================================

const LEGAL_THRESHOLDS = {
  // Seuils pour les sociétés commerciales (SA, SAS, SARL)
  // Obligation si 2 des 3 critères dépassés à la clôture de l'exercice
  ca: 8_000_000,       // 8 M€ de CA HT
  bilan: 4_000_000,    // 4 M€ de total bilan
  effectif: 50,        // 50 salariés en moyenne
}

// Fourchettes de calcul du seuil de signification
const SIGNIFICATION_RANGES = {
  bilan: { min: 0.005, max: 0.02, default: 0.01 },    // 0.5% à 2% du bilan
  ca: { min: 0.005, max: 0.01, default: 0.0075 },      // 0.5% à 1% du CA
  resultat: { min: 0.05, max: 0.10, default: 0.05 },   // 5% à 10% du résultat
}

// Coefficients de calcul
const PLANIFICATION_RATIO = 0.70  // 70% du seuil de signification
const ANOMALIES_RATIO = 0.05     // 5% du seuil de planification

/**
 * Vérifie si l'audit légal est obligatoire selon les seuils français.
 * Obligation déclenchée si 2 des 3 critères sont dépassés.
 */
export function isAuditRequired(data: CompanyAuditData): {
  required: boolean
  criteres: AuditResult['criteres_depasses']
  count: number
} {
  const criteres: AuditResult['criteres_depasses'] = [
    {
      critere: 'ca',
      valeur: data.chiffre_affaires_ht,
      seuil: LEGAL_THRESHOLDS.ca,
      depasse: data.chiffre_affaires_ht > LEGAL_THRESHOLDS.ca,
    },
    {
      critere: 'bilan',
      valeur: data.total_bilan,
      seuil: LEGAL_THRESHOLDS.bilan,
      depasse: data.total_bilan > LEGAL_THRESHOLDS.bilan,
    },
    {
      critere: 'effectif',
      valeur: data.effectif_moyen,
      seuil: LEGAL_THRESHOLDS.effectif,
      depasse: data.effectif_moyen > LEGAL_THRESHOLDS.effectif,
    },
  ]

  const count = criteres.filter(c => c.depasse).length

  return {
    required: count >= 2,
    criteres,
    count,
  }
}

/**
 * Calcule les seuils d'audit (signification, planification, anomalies)
 * selon la norme NEP 320 – Détermination du seuil de signification.
 *
 * Le seuil de signification est basé sur :
 * - Le total bilan (méthode préférée pour les entités patrimoniales)
 * - Le CA HT (méthode alternative)
 * - Le résultat net (si stable sur plusieurs exercices)
 *
 * On retient la base la plus pertinente selon la taille de l'entreprise.
 */
export function calculateAuditThresholds(data: CompanyAuditData): AuditThresholds {
  // Déterminer la meilleure base de calcul
  const { method, percentage, value: significationValue } = computeSignification(data)

  const planificationValue = Math.round(significationValue * PLANIFICATION_RATIO)
  const anomaliesValue = Math.round(planificationValue * ANOMALIES_RATIO)

  return {
    legal: {
      ca: LEGAL_THRESHOLDS.ca,
      bilan: LEGAL_THRESHOLDS.bilan,
      effectif: LEGAL_THRESHOLDS.effectif,
    },
    signification: {
      value: significationValue,
      percentage,
      method,
    },
    planification: {
      value: planificationValue,
      percentage: PLANIFICATION_RATIO * 100,
    },
    anomalies: {
      value: anomaliesValue,
      percentage: ANOMALIES_RATIO * 100,
    },
  }
}

/**
 * Calcule le seuil de signification selon la méthode la plus adaptée.
 *
 * Logique de sélection :
 * 1. Si résultat net stable (>0) et représentatif (>1% du CA) → base résultat (5%)
 * 2. Si total bilan significatif → base bilan (0.5-2%)
 * 3. Sinon → base CA (0.5-1%)
 */
function computeSignification(data: CompanyAuditData): {
  method: 'bilan' | 'ca' | 'resultat'
  percentage: number
  value: number
} {
  // Option 1: Résultat net (si positif et représentatif)
  if (
    data.resultat_net > 0 &&
    data.chiffre_affaires_ht > 0 &&
    data.resultat_net / data.chiffre_affaires_ht > 0.01
  ) {
    const pct = SIGNIFICATION_RANGES.resultat.default
    return {
      method: 'resultat',
      percentage: pct * 100,
      value: Math.round(data.resultat_net * pct),
    }
  }

  // Option 2: Total bilan (méthode standard pour entités patrimoniales)
  if (data.total_bilan > 0) {
    // Adapter le pourcentage en fonction de la taille
    // Plus l'entreprise est grande, plus le % est faible
    let pct = SIGNIFICATION_RANGES.bilan.default
    if (data.total_bilan > 50_000_000) {
      pct = SIGNIFICATION_RANGES.bilan.min // 0.5% pour les grandes entreprises
    } else if (data.total_bilan < 2_000_000) {
      pct = SIGNIFICATION_RANGES.bilan.max // 2% pour les petites
    }

    return {
      method: 'bilan',
      percentage: pct * 100,
      value: Math.round(data.total_bilan * pct),
    }
  }

  // Option 3: Chiffre d'affaires (fallback)
  const pct = SIGNIFICATION_RANGES.ca.default
  return {
    method: 'ca',
    percentage: pct * 100,
    value: Math.round(data.chiffre_affaires_ht * pct),
  }
}

/**
 * Effectue l'analyse complète d'audit : obligation + seuils + classification des comptes.
 */
export function performAuditAnalysis(data: CompanyAuditData): AuditResult {
  const { required, criteres, count } = isAuditRequired(data)
  const thresholds = calculateAuditThresholds(data)

  // Classifier les comptes si la balance est fournie
  const { significatifs, aVerifier, insignifiants } = classifyAccounts(
    data.balance || [],
    thresholds,
    data.total_bilan
  )

  return {
    audit_obligatoire: required,
    criteres_depasses: criteres,
    nombre_criteres_depasses: count,
    thresholds,
    comptes_significatifs: significatifs,
    comptes_a_verifier: aVerifier,
    comptes_insignifiants: insignifiants,
  }
}

/**
 * Classe les comptes en 3 catégories selon les seuils d'audit :
 * - Significatif : solde > seuil de signification → audit approfondi
 * - À vérifier : solde > seuil de planification → procédures analytiques
 * - Insignifiant : solde < seuil de planification → revue limitée
 */
function classifyAccounts(
  balance: AccountBalance[],
  thresholds: AuditThresholds,
  totalBilan: number
): {
  significatifs: AccountRisk[]
  aVerifier: AccountRisk[]
  insignifiants: AccountRisk[]
} {
  const significatifs: AccountRisk[] = []
  const aVerifier: AccountRisk[] = []
  const insignifiants: AccountRisk[] = []

  for (const account of balance) {
    const absSolde = Math.abs(account.solde_net)
    const mouvementTotal = account.mouvement_debit + account.mouvement_credit
    const ratioBilan = totalBilan > 0 ? (absSolde / totalBilan) * 100 : 0

    let riskLevel: AccountRisk['risk_level']
    let classification: AccountRisk['classification']
    let notes: string | undefined

    if (absSolde >= thresholds.signification.value) {
      riskLevel = 'high'
      classification = 'significatif'
      notes = `Solde supérieur au seuil de signification (${formatEuro(thresholds.signification.value)}). Audit détaillé requis.`
    } else if (absSolde >= thresholds.planification.value) {
      riskLevel = 'medium'
      classification = 'a_verifier'
      notes = `Solde entre le seuil de planification (${formatEuro(thresholds.planification.value)}) et de signification. Procédures analytiques recommandées.`
    } else {
      riskLevel = 'low'
      classification = 'insignifiant'
    }

    // Vérifier aussi les mouvements (un compte avec peu de solde mais beaucoup de mouvements peut être à risque)
    if (classification === 'insignifiant' && mouvementTotal >= thresholds.signification.value) {
      riskLevel = 'medium'
      classification = 'a_verifier'
      notes = `Solde faible mais mouvements élevés (${formatEuro(mouvementTotal)}). Vérification recommandée.`
    }

    const accountRisk: AccountRisk = {
      numero_compte: account.numero_compte,
      libelle: account.libelle,
      classe: account.classe,
      solde_net: account.solde_net,
      mouvement_total: mouvementTotal,
      ratio_bilan: Math.round(ratioBilan * 100) / 100,
      risk_level: riskLevel,
      classification,
      notes,
    }

    switch (classification) {
      case 'significatif':
        significatifs.push(accountRisk)
        break
      case 'a_verifier':
        aVerifier.push(accountRisk)
        break
      case 'insignifiant':
        insignifiants.push(accountRisk)
        break
    }
  }

  // Trier par solde décroissant dans chaque catégorie
  const sortBySolde = (a: AccountRisk, b: AccountRisk) =>
    Math.abs(b.solde_net) - Math.abs(a.solde_net)

  significatifs.sort(sortBySolde)
  aVerifier.sort(sortBySolde)
  insignifiants.sort(sortBySolde)

  return { significatifs, aVerifier, insignifiants }
}

/**
 * Retourne les seuils légaux actuels (pour référence / affichage).
 */
export function getLegalThresholds() {
  return { ...LEGAL_THRESHOLDS }
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
