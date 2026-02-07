import type { Transaction, Facture } from '@/types'
import type {
  MatchScore,
  MatchSuggestion,
  MatchingResult,
  MatchingConfig,
} from './matching-types'
import { DEFAULT_MATCHING_CONFIG } from './matching-types'

/**
 * Levenshtein distance for description matching
 */
function levenshtein(a: string, b: string): number {
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()
  const m = s1.length
  const n = s2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const dist = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  return maxLen === 0 ? 100 : Math.round((1 - dist / maxLen) * 100)
}

/**
 * Score la proximité temporelle entre facture et transaction
 * ±0 jours → 100, ±1j → 95, ±3j → 80, ±7j → 60, >7j → 0
 */
function scoreDateMatch(
  factureDate: string,
  transactionDate: string,
  windowDays: number
): number {
  const fd = new Date(factureDate)
  const td = new Date(transactionDate)
  const diffMs = Math.abs(fd.getTime() - td.getTime())
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays > windowDays) return 0
  if (diffDays === 0) return 100
  if (diffDays <= 1) return 95
  if (diffDays <= 3) return 80
  if (diffDays <= 5) return 70
  return 60 // 5-7 jours
}

/**
 * Score la proximité de montant entre facture TTC et transaction
 * Exact → 100, ±0.5% → 98, ±1% → 95, ±2% → 85, >2% → 0
 */
function scoreAmountMatch(
  factureMontantTTC: number,
  transactionAmount: number,
  tolerancePct: number
): number {
  const fAbs = Math.abs(factureMontantTTC)
  const tAbs = Math.abs(transactionAmount)

  if (fAbs === 0 || tAbs === 0) {
    return fAbs === tAbs ? 100 : 0
  }

  const diff = Math.abs(fAbs - tAbs)
  const maxVal = Math.max(fAbs, tAbs)
  const diffPct = (diff / maxVal) * 100

  if (diffPct > tolerancePct) return 0
  if (diffPct === 0) return 100
  if (diffPct <= 0.5) return 98
  if (diffPct <= 1) return 95
  return 85 // 1-2%
}

/**
 * Score la similarité de description entre fournisseur facture et libellé transaction
 */
function scoreDescriptionMatch(
  factureNomFournisseur: string | null,
  transactionDescription: string
): number {
  if (!factureNomFournisseur) return 50 // Neutre si pas de fournisseur

  // Vérifier inclusion directe (fournisseur dans le libellé)
  const normFournisseur = factureNomFournisseur.toLowerCase().trim()
  const normDesc = transactionDescription.toLowerCase().trim()

  if (normDesc.includes(normFournisseur)) return 100
  if (normFournisseur.includes(normDesc)) return 90

  // Sinon, Levenshtein
  return stringSimilarity(normFournisseur, normDesc)
}

/**
 * Calcule le score global de matching entre une facture et une transaction
 * Pondération : Montant 50%, Date 30%, Description 20%
 */
function calculateMatchScore(
  facture: Facture,
  transaction: Transaction,
  config: MatchingConfig
): MatchScore {
  const dateScore = scoreDateMatch(
    facture.date_facture || facture.created_at,
    transaction.date,
    config.date_window_days
  )

  const amountScore = scoreAmountMatch(
    facture.montant_ttc || 0,
    transaction.amount,
    config.amount_tolerance_pct
  )

  const descriptionScore = scoreDescriptionMatch(
    facture.nom_fournisseur,
    transaction.description
  )

  // Pondération : Montant 50%, Date 30%, Description 20%
  const total = Math.round(amountScore * 0.5 + dateScore * 0.3 + descriptionScore * 0.2)

  return {
    total,
    date: dateScore,
    amount: amountScore,
    description: descriptionScore,
  }
}

/**
 * Trouve les meilleures correspondances pour chaque facture
 */
export function matchInvoicesWithTransactions(
  factures: Facture[],
  transactions: Transaction[],
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): MatchingResult {
  const autoMatched: MatchSuggestion[] = []
  const suggestions: MatchSuggestion[] = []
  const matchedTransactionIds = new Set<string>()
  const matchedFactureIds = new Set<string>()

  // Filtrer transactions de type expense (achats = factures fournisseurs)
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense')

  // Pour chaque facture, trouver la meilleure transaction correspondante
  for (const facture of factures) {
    let bestMatch: MatchSuggestion | null = null
    let bestScore = 0

    for (const transaction of expenseTransactions) {
      // Skip si déjà matchée
      if (matchedTransactionIds.has(transaction.id)) continue

      const score = calculateMatchScore(facture, transaction, config)

      if (score.total > bestScore && score.total >= config.suggestion_threshold) {
        bestScore = score.total
        bestMatch = {
          facture,
          transaction,
          score,
          type: score.total >= config.auto_threshold ? 'auto' : 'suggestion',
          confidence: score.total,
        }
      }
    }

    if (bestMatch) {
      if (bestMatch.type === 'auto') {
        autoMatched.push(bestMatch)
      } else {
        suggestions.push(bestMatch)
      }
      matchedTransactionIds.add(bestMatch.transaction.id)
      matchedFactureIds.add(bestMatch.facture.id)
    }
  }

  // Factures non rapprochées
  const unmatchedFactures = factures.filter(f => !matchedFactureIds.has(f.id))

  // Transactions non rapprochées
  const unmatchedTransactions = expenseTransactions.filter(
    tx => !matchedTransactionIds.has(tx.id)
  )

  return {
    auto_matched: autoMatched.sort((a, b) => b.confidence - a.confidence),
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
    unmatched_factures: unmatchedFactures,
    unmatched_transactions: unmatchedTransactions,
  }
}
