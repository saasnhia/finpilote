import type { Transaction, Facture } from '@/types'
import type {
  MatchScore,
  MatchScoreDetails,
  MatchSuggestion,
  MatchingResult,
  MatchingConfig,
  PartialPaymentInfo,
  SupplierHistory,
} from './matching-types'
import { DEFAULT_MATCHING_CONFIG } from './matching-types'

// ========================================
// Text Normalization Utilities
// ========================================

/**
 * Normalise un texte pour la comparaison :
 * - Supprime accents (NFD + strip diacritics)
 * - Lowercase
 * - Supprime ponctuation et caracteres speciaux
 * - Trim + collapse spaces
 */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrait les mots significatifs (>= 3 caracteres) d'un texte
 */
function extractSignificantWords(text: string): string[] {
  const stopWords = new Set([
    'les', 'des', 'une', 'pour', 'par', 'sur', 'dans', 'avec', 'sans',
    'que', 'qui', 'est', 'son', 'ses', 'aux', 'du', 'de', 'la', 'le',
    'et', 'en', 'ce', 'sa', 'sas', 'sarl', 'eurl', 'srl', 'sci',
    'vir', 'virement', 'prlv', 'prelevement', 'carte', 'paiement', 'cb',
  ])
  return normalizeText(text)
    .split(' ')
    .filter(w => w.length >= 3 && !stopWords.has(w))
}

// ========================================
// Score Criteria Functions (5 criteria)
// ========================================

/**
 * CRITERE 1 : Montant (0-40 pts)
 * Exact (0%) = 40, ±0.5% = 38, ±1% = 35, ±2% = 25, ±5% = 15, >5% = 0
 */
function scoreAmount(
  factureTTC: number,
  transactionAmount: number
): { score: number; diffPct: number } {
  const fAbs = Math.abs(factureTTC)
  const tAbs = Math.abs(transactionAmount)

  if (fAbs === 0 && tAbs === 0) return { score: 40, diffPct: 0 }
  if (fAbs === 0 || tAbs === 0) return { score: 0, diffPct: 100 }

  const diff = Math.abs(fAbs - tAbs)
  const maxVal = Math.max(fAbs, tAbs)
  const diffPct = (diff / maxVal) * 100

  let score = 0
  if (diffPct === 0) score = 40
  else if (diffPct <= 0.5) score = 38
  else if (diffPct <= 1) score = 35
  else if (diffPct <= 2) score = 25
  else if (diffPct <= 5) score = 15
  // >5% = 0

  return { score, diffPct }
}

/**
 * CRITERE 2 : Date (0-20 pts)
 * Meme jour = 20, ±1j = 18, ±3j = 15, ±5j = 10, ±7j = 5, >7j = 0
 */
function scoreDate(
  factureDate: string,
  transactionDate: string,
  windowDays: number
): { score: number; diffDays: number } {
  const fd = new Date(factureDate)
  const td = new Date(transactionDate)

  // Handle invalid dates
  if (isNaN(fd.getTime()) || isNaN(td.getTime())) {
    return { score: 0, diffDays: 999 }
  }

  const diffMs = Math.abs(fd.getTime() - td.getTime())
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays > windowDays) return { score: 0, diffDays }

  let score = 0
  if (diffDays === 0) score = 20
  else if (diffDays <= 1) score = 18
  else if (diffDays <= 3) score = 15
  else if (diffDays <= 5) score = 10
  else if (diffDays <= 7) score = 5
  // >7 = 0

  return { score, diffDays }
}

/**
 * CRITERE 3 : Fournisseur (0-25 pts)
 * Compares facture supplier name against transaction description
 * using word-level matching after normalization.
 *
 * 100% word match = 25, >=75% = 20, >=50% = 15, >=25% = 8, <25% = 0
 */
function scoreSupplier(
  fournisseur: string | null,
  transactionDescription: string
): { score: number; similarity: number } {
  if (!fournisseur) return { score: 0, similarity: 0 }

  const supplierWords = extractSignificantWords(fournisseur)
  const descWords = extractSignificantWords(transactionDescription)

  if (supplierWords.length === 0) return { score: 0, similarity: 0 }

  // Check direct inclusion (normalized)
  const normSupplier = normalizeText(fournisseur)
  const normDesc = normalizeText(transactionDescription)

  if (normDesc.includes(normSupplier) || normSupplier.includes(normDesc)) {
    return { score: 25, similarity: 100 }
  }

  // Word-level matching: how many supplier words appear in description?
  let matchedWords = 0
  for (const sw of supplierWords) {
    if (descWords.some(dw => dw.includes(sw) || sw.includes(dw))) {
      matchedWords++
    }
  }

  const similarity = Math.round((matchedWords / supplierWords.length) * 100)

  let score = 0
  if (similarity >= 100) score = 25
  else if (similarity >= 75) score = 20
  else if (similarity >= 50) score = 15
  else if (similarity >= 25) score = 8
  // <25% = 0

  return { score, similarity }
}

/**
 * CRITERE 4 : Numero de facture (0-30 pts)
 * Checks if the invoice number appears in the transaction description.
 * Exact match = 30, partial match = 15, no match = 0
 */
function scoreInvoiceNumber(
  numeroFacture: string | null,
  transactionDescription: string
): { score: number; found: boolean } {
  if (!numeroFacture) return { score: 0, found: false }

  const normNum = normalizeText(numeroFacture)
  const normDesc = normalizeText(transactionDescription)

  if (normNum.length < 2) return { score: 0, found: false }

  // Exact match in description
  if (normDesc.includes(normNum)) {
    return { score: 30, found: true }
  }

  // Try without separators (FACT-2026-001 -> fact2026001)
  const numNoSep = normNum.replace(/\s/g, '')
  const descNoSep = normDesc.replace(/\s/g, '')
  if (descNoSep.includes(numNoSep)) {
    return { score: 30, found: true }
  }

  // Partial: check if numeric part of invoice number is in description
  const numericPart = normNum.replace(/[^0-9]/g, '')
  if (numericPart.length >= 4 && normDesc.includes(numericPart)) {
    return { score: 15, found: true }
  }

  return { score: 0, found: false }
}

/**
 * CRITERE 5 (BONUS) : Historique IBAN fournisseur (0-15 pts)
 * Uses supplier learning history to check if this transaction
 * matches a known pattern for this supplier.
 */
function scoreIBANHistory(
  fournisseur: string | null,
  transactionDescription: string,
  supplierHistories: SupplierHistory[]
): { score: number; match: boolean } {
  if (!fournisseur || supplierHistories.length === 0) {
    return { score: 0, match: false }
  }

  const normSupplier = normalizeText(fournisseur)

  // Find matching supplier history
  const history = supplierHistories.find(h =>
    h.supplier_normalized === normSupplier ||
    normalizeText(h.supplier_name) === normSupplier
  )

  if (!history) return { score: 0, match: false }

  // Check if transaction description matches any known pattern
  const normDesc = normalizeText(transactionDescription)
  const patternMatch = history.transaction_patterns.some(pattern => {
    const normPattern = normalizeText(pattern)
    return normDesc.includes(normPattern) || normPattern.includes(normDesc)
  })

  if (patternMatch) return { score: 15, match: true }

  // Check IBAN patterns
  const ibanMatch = history.iban_patterns.some(iban => {
    const normIban = normalizeText(iban)
    return normDesc.includes(normIban)
  })

  if (ibanMatch) return { score: 15, match: true }

  return { score: 0, match: false }
}

// ========================================
// Main Smart Matching Functions
// ========================================

/**
 * Calcule le score de matching multi-criteres entre une facture et une transaction.
 *
 * Bareme (total max = 130 pts, normalise sur 100) :
 * - Montant exact ±2% : 40 pts
 * - Date ±7 jours : 20 pts
 * - Fournisseur : 25 pts
 * - Numero facture : 30 pts
 * - Historique IBAN : 15 pts (bonus)
 */
export function calculateSmartScore(
  facture: Facture,
  transaction: Transaction,
  config: MatchingConfig,
  supplierHistories: SupplierHistory[] = []
): MatchScore {
  // Critere 1: Montant
  const amountResult = scoreAmount(
    facture.montant_ttc ?? 0,
    transaction.amount
  )

  // Critere 2: Date
  const dateResult = scoreDate(
    facture.date_facture || facture.created_at,
    transaction.date,
    config.date_window_days
  )

  // Critere 3: Fournisseur
  const supplierResult = scoreSupplier(
    facture.fournisseur,
    transaction.description
  )

  // Critere 4: Numero facture
  const invoiceResult = scoreInvoiceNumber(
    facture.numero_facture,
    transaction.description
  )

  // Critere 5: IBAN history bonus
  const ibanResult = scoreIBANHistory(
    facture.fournisseur,
    transaction.description,
    supplierHistories
  )

  // Raw total (max 130)
  const rawTotal =
    amountResult.score +
    dateResult.score +
    supplierResult.score +
    invoiceResult.score +
    ibanResult.score

  // Normalize to 0-100
  const total = Math.min(100, Math.round((rawTotal / 130) * 100))

  return {
    total,
    amount: amountResult.score,
    date: dateResult.score,
    supplier: supplierResult.score,
    invoice_number: invoiceResult.score,
    iban_bonus: ibanResult.score,
    description: supplierResult.similarity, // Legacy compat
    raw_total: rawTotal,
    details: {
      amount_diff_pct: amountResult.diffPct,
      date_diff_days: dateResult.diffDays,
      supplier_similarity: supplierResult.similarity,
      invoice_number_found: invoiceResult.found,
      iban_match: ibanResult.match,
      method: 'smart',
    },
  }
}

/**
 * Detecte les paiements partiels potentiels :
 * Une transaction couvre partiellement le montant d'une facture.
 */
function detectPartialPayment(
  facture: Facture,
  transaction: Transaction,
  allTransactions: Transaction[],
  config: MatchingConfig
): PartialPaymentInfo | undefined {
  const factureTTC = facture.montant_ttc ?? 0
  const txAmount = Math.abs(transaction.amount)

  if (factureTTC <= 0 || txAmount <= 0) return undefined

  // If transaction is less than facture but covers at least 20%
  const coveragePct = (txAmount / factureTTC) * 100

  if (coveragePct >= 20 && coveragePct < (100 - config.partial_payment_tolerance)) {
    // Look for other transactions that could complement
    const remaining = factureTTC - txAmount
    const relatedIds = [transaction.id]

    // Find potential complementary transactions (same supplier pattern, close dates)
    const normDesc = normalizeText(transaction.description)
    for (const tx of allTransactions) {
      if (tx.id === transaction.id) continue
      const txAmt = Math.abs(tx.amount)
      if (txAmt <= 0) continue

      // Check if this transaction + accumulated could fill the gap
      const currentPaid = relatedIds.reduce((sum, id) => {
        const t = allTransactions.find(at => at.id === id)
        return sum + (t ? Math.abs(t.amount) : 0)
      }, 0)

      const gap = factureTTC - currentPaid
      if (Math.abs(txAmt - gap) / gap < 0.05) {
        // Within 5% of remaining amount
        const otherNormDesc = normalizeText(tx.description)
        if (normDesc.substring(0, 10) === otherNormDesc.substring(0, 10)) {
          relatedIds.push(tx.id)
        }
      }
    }

    const totalPaid = relatedIds.reduce((sum, id) => {
      const t = allTransactions.find(at => at.id === id)
      return sum + (t ? Math.abs(t.amount) : 0)
    }, 0)

    return {
      is_partial: true,
      total_facture: factureTTC,
      amount_paid: totalPaid,
      remaining: factureTTC - totalPaid,
      coverage_pct: Math.round((totalPaid / factureTTC) * 100),
      related_transaction_ids: relatedIds,
    }
  }

  return undefined
}

/**
 * Trouve les meilleures correspondances pour chaque facture
 * en utilisant le scoring multi-criteres intelligent.
 */
export function smartMatchInvoicesWithTransactions(
  factures: Facture[],
  transactions: Transaction[],
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG,
  supplierHistories: SupplierHistory[] = []
): MatchingResult {
  const autoMatched: MatchSuggestion[] = []
  const suggestions: MatchSuggestion[] = []
  const matchedTransactionIds = new Set<string>()
  const matchedFactureIds = new Set<string>()

  // Filter expense transactions
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense')

  // Score all pairs and find best matches
  const allCandidates: Array<{
    facture: Facture
    transaction: Transaction
    score: MatchScore
  }> = []

  for (const facture of factures) {
    for (const transaction of expenseTransactions) {
      const score = calculateSmartScore(
        facture,
        transaction,
        config,
        supplierHistories
      )

      if (score.total >= config.suggestion_threshold) {
        allCandidates.push({ facture, transaction, score })
      }
    }
  }

  // Sort by score descending (greedy best-first assignment)
  allCandidates.sort((a, b) => b.score.total - a.score.total)

  // Assign best matches (each facture and transaction can only match once)
  for (const candidate of allCandidates) {
    if (matchedFactureIds.has(candidate.facture.id)) continue
    if (matchedTransactionIds.has(candidate.transaction.id)) continue

    const isAuto = candidate.score.total >= config.auto_threshold

    // Check for partial payment
    const partialPayment = !isAuto
      ? detectPartialPayment(
          candidate.facture,
          candidate.transaction,
          expenseTransactions,
          config
        )
      : undefined

    const suggestion: MatchSuggestion = {
      facture: candidate.facture,
      transaction: candidate.transaction,
      score: candidate.score,
      type: isAuto ? 'auto' : 'suggestion',
      confidence: candidate.score.total,
      partial_payment: partialPayment,
    }

    if (isAuto) {
      autoMatched.push(suggestion)
    } else {
      suggestions.push(suggestion)
    }

    matchedTransactionIds.add(candidate.transaction.id)
    matchedFactureIds.add(candidate.facture.id)
  }

  // Unmatched
  const unmatchedFactures = factures.filter(f => !matchedFactureIds.has(f.id))
  const unmatchedTransactions = expenseTransactions.filter(
    tx => !matchedTransactionIds.has(tx.id)
  )

  return {
    auto_matched: autoMatched,
    suggestions: suggestions,
    unmatched_factures: unmatchedFactures,
    unmatched_transactions: unmatchedTransactions,
  }
}
