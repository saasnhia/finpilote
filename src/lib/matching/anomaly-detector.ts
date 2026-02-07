import type { Transaction, Facture } from '@/types'
import type {
  DetectedAnomaly,
  AnomalyDetectionResult,
  MatchingConfig,
} from './matching-types'
import { DEFAULT_MATCHING_CONFIG } from './matching-types'

/**
 * Détecte les transactions en doublon
 * Critères : même date + même montant + description similaire
 */
function detectDuplicateTransactions(transactions: Transaction[]): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = []
  const seen = new Map<string, Transaction>()

  for (const tx of transactions) {
    const key = `${tx.date}|${Math.abs(tx.amount)}`
    const existing = seen.get(key)

    if (existing && existing.id !== tx.id) {
      // Vérifier la similarité de description
      const desc1 = existing.description.toLowerCase()
      const desc2 = tx.description.toLowerCase()

      if (desc1 === desc2 || desc1.includes(desc2) || desc2.includes(desc1)) {
        anomalies.push({
          type: 'doublon_transaction',
          severite: 'warning',
          description: `Doublon possible : "${tx.description}" (${tx.amount}€) le ${tx.date}`,
          transaction_id: tx.id,
          montant: tx.amount,
        })
      }
    }

    seen.set(key, tx)
  }

  return anomalies
}

/**
 * Détecte les factures en doublon
 * Critères : même numéro ou même fournisseur + même montant
 */
function detectDuplicateInvoices(factures: Facture[]): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = []
  const seenByNumero = new Map<string, Facture>()
  const seenByAmount = new Map<string, Facture>()

  for (const f of factures) {
    // Doublon par numéro de facture
    if (f.numero_facture) {
      const existing = seenByNumero.get(f.numero_facture)
      if (existing) {
        anomalies.push({
          type: 'doublon_facture',
          severite: 'critical',
          description: `Facture en doublon : N°${f.numero_facture} de ${f.nom_fournisseur || 'inconnu'}`,
          facture_id: f.id,
          montant: f.montant_ttc || 0,
        })
      }
      seenByNumero.set(f.numero_facture, f)
    }

    // Doublon par fournisseur + montant
    if (f.nom_fournisseur && f.montant_ttc) {
      const key = `${f.nom_fournisseur.toLowerCase()}|${f.montant_ttc}`
      const existing = seenByAmount.get(key)
      if (existing && existing.id !== f.id) {
        anomalies.push({
          type: 'doublon_facture',
          severite: 'warning',
          description: `Facture possible doublon : ${f.nom_fournisseur} - ${f.montant_ttc}€`,
          facture_id: f.id,
          montant: f.montant_ttc,
        })
      }
      seenByAmount.set(key, f)
    }
  }

  return anomalies
}

/**
 * Détecte les transactions > seuil sans facture associée
 */
function detectTransactionsWithoutInvoice(
  transactions: Transaction[],
  matchedTransactionIds: Set<string>,
  threshold: number
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = []

  for (const tx of transactions) {
    if (
      tx.type === 'expense' &&
      tx.amount >= threshold &&
      !matchedTransactionIds.has(tx.id)
    ) {
      anomalies.push({
        type: 'transaction_sans_facture',
        severite: tx.amount >= 1000 ? 'critical' : 'warning',
        description: `Transaction de ${tx.amount}€ sans facture : "${tx.description}" du ${tx.date}`,
        transaction_id: tx.id,
        montant: tx.amount,
      })
    }
  }

  return anomalies
}

/**
 * Détecte les factures sans transaction correspondante
 */
function detectInvoicesWithoutTransaction(
  factures: Facture[],
  matchedFactureIds: Set<string>
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = []

  for (const f of factures) {
    if (!matchedFactureIds.has(f.id) && f.validation_status === 'validated') {
      anomalies.push({
        type: 'facture_sans_transaction',
        severite: 'warning',
        description: `Facture validée non rapprochée : ${f.nom_fournisseur || f.numero_facture || 'N/A'} - ${f.montant_ttc || 0}€`,
        facture_id: f.id,
        montant: f.montant_ttc || 0,
      })
    }
  }

  return anomalies
}

/**
 * Détecte les écarts de TVA entre facture et transaction
 */
function detectTVADiscrepancies(
  factures: Facture[],
  transactions: Transaction[],
  matchedPairs: Array<{ facture_id: string; transaction_id: string }>
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = []

  const factureMap = new Map(factures.map(f => [f.id, f]))
  const transactionMap = new Map(transactions.map(t => [t.id, t]))

  for (const pair of matchedPairs) {
    const facture = factureMap.get(pair.facture_id)
    const transaction = transactionMap.get(pair.transaction_id)

    if (!facture || !transaction) continue
    if (!facture.tva || !facture.montant_ht) continue

    // Vérifier cohérence TVA
    const expectedTTC = facture.montant_ht + facture.tva
    const ecart = Math.abs(expectedTTC - (facture.montant_ttc || 0))

    if (ecart > 0.01) {
      anomalies.push({
        type: 'ecart_tva',
        severite: ecart > 10 ? 'critical' : 'info',
        description: `Écart TVA sur facture ${facture.numero_facture || 'N/A'} : HT(${facture.montant_ht}) + TVA(${facture.tva}) ≠ TTC(${facture.montant_ttc})`,
        facture_id: facture.id,
        transaction_id: transaction.id,
        montant: facture.montant_ttc || 0,
        montant_attendu: expectedTTC,
        ecart,
      })
    }
  }

  return anomalies
}

/**
 * Détecte les montants élevés inhabituels
 */
function detectHighAmounts(transactions: Transaction[]): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = []

  // Calculer la moyenne et l'écart-type
  const amounts = transactions.map(t => t.amount)
  if (amounts.length < 5) return anomalies // Pas assez de données

  const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
  const variance =
    amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)

  const threshold = mean + 3 * stdDev // 3 écarts-types

  for (const tx of transactions) {
    if (tx.amount > threshold && tx.amount > 5000) {
      anomalies.push({
        type: 'montant_eleve',
        severite: 'info',
        description: `Montant inhabituel : ${tx.amount}€ (moyenne: ${Math.round(mean)}€) - "${tx.description}"`,
        transaction_id: tx.id,
        montant: tx.amount,
        montant_attendu: mean,
        ecart: tx.amount - mean,
      })
    }
  }

  return anomalies
}

/**
 * Lance la détection complète d'anomalies
 */
export function detectAnomalies(
  transactions: Transaction[],
  factures: Facture[],
  matchedPairs: Array<{ facture_id: string; transaction_id: string }> = [],
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): AnomalyDetectionResult {
  const matchedTransactionIds = new Set(matchedPairs.map(p => p.transaction_id))
  const matchedFactureIds = new Set(matchedPairs.map(p => p.facture_id))

  const allAnomalies: DetectedAnomaly[] = [
    ...detectDuplicateTransactions(transactions),
    ...detectDuplicateInvoices(factures),
    ...detectTransactionsWithoutInvoice(
      transactions,
      matchedTransactionIds,
      config.anomaly_amount_threshold
    ),
    ...detectInvoicesWithoutTransaction(factures, matchedFactureIds),
    ...detectTVADiscrepancies(factures, transactions, matchedPairs),
    ...detectHighAmounts(transactions),
  ]

  // Dédupliquer par transaction_id + type
  const seen = new Set<string>()
  const unique = allAnomalies.filter(a => {
    const key = `${a.type}|${a.transaction_id || ''}|${a.facture_id || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Trier par sévérité (critical > warning > info)
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  unique.sort((a, b) => severityOrder[a.severite] - severityOrder[b.severite])

  return {
    anomalies: unique,
    stats: {
      total: unique.length,
      critical: unique.filter(a => a.severite === 'critical').length,
      warning: unique.filter(a => a.severite === 'warning').length,
      info: unique.filter(a => a.severite === 'info').length,
    },
  }
}
