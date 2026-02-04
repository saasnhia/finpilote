import type { Transaction, ReconciliationMatch } from '@/types'

/**
 * Calculate Levenshtein distance between two strings
 * Used for description similarity matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  const len1 = s1.length
  const len2 = s2.length

  // Create matrix
  const matrix: number[][] = []

  // Initialize first column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity score (0.0 to 1.0) between two strings
 */
function stringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2)
  const maxLen = Math.max(str1.length, str2.length)

  if (maxLen === 0) return 1.0

  return 1.0 - distance / maxLen
}

/**
 * Calculate date score based on difference in days
 * 0 days → 1.0
 * ≤1 day → 0.9
 * ≤3 days → 0.7
 * >3 days → 0.0
 */
function calculateDateScore(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)

  const diffMs = Math.abs(d1.getTime() - d2.getTime())
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays === 0) return 1.0
  if (diffDays <= 1) return 0.9
  if (diffDays <= 3) return 0.7
  return 0.0
}

/**
 * Calculate amount score based on difference percentage
 * exact → 1.0
 * ≤1% diff → 0.95
 * ≤5% diff → 0.7
 * >5% diff → 0.0
 */
function calculateAmountScore(amount1: number, amount2: number): number {
  const abs1 = Math.abs(amount1)
  const abs2 = Math.abs(amount2)

  if (abs1 === 0 || abs2 === 0) {
    return abs1 === abs2 ? 1.0 : 0.0
  }

  const diff = Math.abs(abs1 - abs2)
  const maxAmount = Math.max(abs1, abs2)
  const diffPercent = (diff / maxAmount) * 100

  if (diffPercent === 0) return 1.0
  if (diffPercent <= 1) return 0.95
  if (diffPercent <= 5) return 0.7
  return 0.0
}

/**
 * Calculate description score using Levenshtein distance
 */
function calculateDescriptionScore(desc1: string, desc2: string): number {
  return stringSimilarity(desc1, desc2)
}

/**
 * Calculate overall match score
 * Formula: (date_score * 0.4) + (amount_score * 0.5) + (description_score * 0.1)
 */
function calculateMatchScore(
  dateScore: number,
  amountScore: number,
  descriptionScore: number
): number {
  return dateScore * 0.4 + amountScore * 0.5 + descriptionScore * 0.1
}

/**
 * Find matching bank transaction for a manual transaction
 */
function findBestMatch(
  manualTransaction: Transaction,
  bankTransactions: Transaction[]
): ReconciliationMatch | null {
  let bestMatch: ReconciliationMatch | null = null
  let bestScore = 0

  for (const bankTx of bankTransactions) {
    // Calculate individual scores
    const dateScore = calculateDateScore(manualTransaction.date, bankTx.date)
    const amountScore = calculateAmountScore(manualTransaction.amount, bankTx.amount)
    const descriptionScore = calculateDescriptionScore(
      manualTransaction.description,
      bankTx.original_description || bankTx.description
    )

    // Calculate overall match score
    const matchScore = calculateMatchScore(dateScore, amountScore, descriptionScore)

    // Update best match if this is better
    if (matchScore > bestScore) {
      bestScore = matchScore
      bestMatch = {
        manual_transaction: manualTransaction,
        bank_transaction: bankTx,
        match_score: matchScore,
        date_score: dateScore,
        amount_score: amountScore,
        description_score: descriptionScore,
        suggested: matchScore >= 0.6, // Suggest if score ≥ 0.6
      }
    }
  }

  return bestMatch
}

/**
 * Match manual transactions with bank transactions
 * Returns matches grouped by confidence level
 */
export function matchTransactions(
  manualTransactions: Transaction[],
  bankTransactions: Transaction[]
): {
  autoMatches: ReconciliationMatch[] // score ≥ 0.8
  suggestedMatches: ReconciliationMatch[] // 0.6 ≤ score < 0.8
  unmatchedManual: Transaction[]
  unmatchedBank: Transaction[]
} {
  const autoMatches: ReconciliationMatch[] = []
  const suggestedMatches: ReconciliationMatch[] = []
  const unmatchedManual: Transaction[] = []
  const matchedBankIds = new Set<string>()

  // Filter transactions that are not already reconciled
  const availableManual = manualTransactions.filter(
    tx => tx.status !== 'reconciled' && tx.source === 'manual'
  )
  const availableBank = bankTransactions.filter(
    tx => tx.status !== 'reconciled' && tx.source === 'bank_import'
  )

  // Find best match for each manual transaction
  for (const manualTx of availableManual) {
    const match = findBestMatch(manualTx, availableBank)

    if (!match) {
      unmatchedManual.push(manualTx)
      continue
    }

    // Auto-match if score ≥ 0.8
    if (match.match_score >= 0.8) {
      autoMatches.push(match)
      matchedBankIds.add(match.bank_transaction.id)
    }
    // Suggest if 0.6 ≤ score < 0.8
    else if (match.match_score >= 0.6) {
      suggestedMatches.push(match)
      matchedBankIds.add(match.bank_transaction.id)
    }
    // Otherwise, consider unmatched
    else {
      unmatchedManual.push(manualTx)
    }
  }

  // Find unmatched bank transactions
  const unmatchedBank = availableBank.filter(tx => !matchedBankIds.has(tx.id))

  return {
    autoMatches,
    suggestedMatches,
    unmatchedManual,
    unmatchedBank,
  }
}

/**
 * Validate a potential match
 * Returns validation result with warnings
 */
export function validateMatch(match: ReconciliationMatch): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // Check if amounts have different signs (income vs expense)
  const sameType = match.manual_transaction.type === match.bank_transaction.type
  if (!sameType) {
    warnings.push('Les types de transaction sont différents (revenu vs dépense)')
  }

  // Check if date difference is significant
  if (match.date_score < 0.7) {
    const date1 = new Date(match.manual_transaction.date)
    const date2 = new Date(match.bank_transaction.date)
    const diffDays = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
    warnings.push(`Écart de dates important: ${Math.round(diffDays)} jours`)
  }

  // Check if amount difference is significant
  if (match.amount_score < 0.95) {
    const diff = Math.abs(match.manual_transaction.amount - match.bank_transaction.amount)
    warnings.push(`Écart de montants: ${diff.toFixed(2)}€`)
  }

  // Valid if no critical issues
  const valid = sameType && match.date_score > 0 && match.amount_score > 0

  return { valid, warnings }
}

/**
 * Calculate reconciliation statistics
 */
export function calculateStats(result: {
  autoMatches: ReconciliationMatch[]
  suggestedMatches: ReconciliationMatch[]
  unmatchedManual: Transaction[]
  unmatchedBank: Transaction[]
}) {
  const total = result.autoMatches.length + result.suggestedMatches.length +
                result.unmatchedManual.length

  const autoMatchRate = total > 0
    ? (result.autoMatches.length / total) * 100
    : 0

  return {
    totalManual: total,
    totalBank: result.autoMatches.length + result.suggestedMatches.length +
               result.unmatchedBank.length,
    autoMatched: result.autoMatches.length,
    suggested: result.suggestedMatches.length,
    unmatchedManual: result.unmatchedManual.length,
    unmatchedBank: result.unmatchedBank.length,
    autoMatchRate: Math.round(autoMatchRate),
  }
}
