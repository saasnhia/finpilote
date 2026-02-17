import type { Transaction, Facture } from '@/types'

// ========================================
// Matching Types (Smart Scoring System)
// ========================================

export interface MatchScore {
  total: number             // Score global 0-100 (normalized)
  amount: number            // Score montant 0-40
  date: number              // Score date 0-20
  supplier: number          // Score fournisseur 0-25
  invoice_number: number    // Score numero facture 0-30
  iban_bonus: number        // Bonus historique IBAN 0-15
  description: number       // Legacy compat (= supplier score mapped to 0-100)
  raw_total: number         // Score brut avant normalisation (0-130)
  details: MatchScoreDetails
}

export interface MatchScoreDetails {
  amount_diff_pct: number
  date_diff_days: number
  supplier_similarity: number   // 0-100
  invoice_number_found: boolean
  iban_match: boolean
  method: 'smart' | 'legacy'
}

export interface MatchSuggestion {
  facture: Facture
  transaction: Transaction
  score: MatchScore
  type: 'auto' | 'suggestion' | 'manuel'
  confidence: number // 0-100
  partial_payment?: PartialPaymentInfo
}

export interface MatchingResult {
  auto_matched: MatchSuggestion[]      // score >= auto_threshold
  suggestions: MatchSuggestion[]       // suggestion_threshold <= score < auto_threshold
  unmatched_factures: Facture[]
  unmatched_transactions: Transaction[]
}

export interface MatchingConfig {
  date_window_days: number       // ±7 jours par defaut
  amount_tolerance_pct: number   // ±2% par defaut
  auto_threshold: number         // 85 par defaut (smart scoring)
  suggestion_threshold: number   // 50 par defaut (smart scoring)
  anomaly_amount_threshold: number // 500 par defaut
  partial_payment_tolerance: number // 5% par defaut
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  date_window_days: 7,
  amount_tolerance_pct: 2,
  auto_threshold: 85,
  suggestion_threshold: 50,
  anomaly_amount_threshold: 500,
  partial_payment_tolerance: 5,
}

// ========================================
// Partial Payment Types
// ========================================

export interface PartialPaymentInfo {
  is_partial: boolean
  total_facture: number
  amount_paid: number
  remaining: number
  coverage_pct: number
  related_transaction_ids: string[]
}

export interface PartialPayment {
  id: string
  user_id: string
  facture_id: string
  transaction_id: string
  montant_paye: number
  date_paiement: string
  notes: string | null
  created_at: string
}

// ========================================
// Supplier Learning Types
// ========================================

export interface SupplierHistory {
  id: string
  user_id: string
  supplier_name: string
  supplier_normalized: string
  transaction_patterns: string[]   // Known transaction description patterns
  iban_patterns: string[]          // Known IBAN prefixes
  avg_amount: number
  match_count: number
  last_matched_at: string
  created_at: string
  updated_at: string
}

// ========================================
// Anomaly Types
// ========================================

export type AnomalyType =
  | 'doublon_transaction'
  | 'doublon_facture'
  | 'transaction_sans_facture'
  | 'facture_sans_transaction'
  | 'ecart_tva'
  | 'ecart_montant'
  | 'date_incoherente'
  | 'montant_eleve'

export type AnomalySeverity = 'info' | 'warning' | 'critical'
export type AnomalyStatus = 'ouverte' | 'resolue' | 'ignoree'

export interface DetectedAnomaly {
  type: AnomalyType
  severite: AnomalySeverity
  description: string
  transaction_id?: string
  facture_id?: string
  montant?: number
  montant_attendu?: number
  ecart?: number
}

export interface AnomalyDetectionResult {
  anomalies: DetectedAnomaly[]
  stats: {
    total: number
    critical: number
    warning: number
    info: number
  }
}

// ========================================
// DB Row Types
// ========================================

export interface RapprochementFacture {
  id: string
  user_id: string
  facture_id: string
  transaction_id: string
  montant: number
  type: 'auto' | 'manuel' | 'suggestion'
  statut: 'suggestion' | 'valide' | 'rejete'
  confidence_score: number
  date_score?: number
  amount_score?: number
  description_score?: number
  supplier_score?: number
  invoice_number_score?: number
  iban_bonus?: number
  validated_at?: string
  validated_by_user: boolean
  created_at: string
  updated_at: string
}

export interface AnomalieDetectee {
  id: string
  user_id: string
  type: AnomalyType
  severite: AnomalySeverity
  description: string
  transaction_id?: string
  facture_id?: string
  montant?: number
  montant_attendu?: number
  ecart?: number
  statut: AnomalyStatus
  resolved_at?: string
  notes?: string
  created_at: string
  updated_at: string
}
