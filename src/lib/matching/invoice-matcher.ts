import type { Transaction, Facture } from '@/types'
import type {
  MatchingResult,
  MatchingConfig,
  SupplierHistory,
} from './matching-types'
import { DEFAULT_MATCHING_CONFIG } from './matching-types'
import { smartMatchInvoicesWithTransactions } from './smart-matcher'

/**
 * Trouve les meilleures correspondances pour chaque facture.
 * Delegue au smart matcher multi-criteres (5 criteres, 130 pts normalises sur 100).
 */
export function matchInvoicesWithTransactions(
  factures: Facture[],
  transactions: Transaction[],
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG,
  supplierHistories: SupplierHistory[] = []
): MatchingResult {
  return smartMatchInvoicesWithTransactions(
    factures,
    transactions,
    config,
    supplierHistories
  )
}
