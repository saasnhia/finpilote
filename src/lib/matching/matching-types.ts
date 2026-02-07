import type { Transaction, Facture } from '@/types'

// ========================================
// Matching Types
// ========================================

export interface MatchScore {
  total: number       // Score global 0-100
  date: number        // Score date 0-100
  amount: number      // Score montant 0-100
  description: number // Score description 0-100
}

export interface MatchSuggestion {
  facture: Facture
  transaction: Transaction
  score: MatchScore
  type: 'auto' | 'suggestion' | 'manuel'
  confidence: number // 0-100
}

export interface MatchingResult {
  auto_matched: MatchSuggestion[]      // score > 95%
  suggestions: MatchSuggestion[]       // 70-95%
  unmatched_factures: Facture[]
  unmatched_transactions: Transaction[]
}

export interface MatchingConfig {
  date_window_days: number    // ±7 jours par défaut
  amount_tolerance_pct: number // ±2% par défaut
  auto_threshold: number      // 95 par défaut
  suggestion_threshold: number // 70 par défaut
  anomaly_amount_threshold: number // 500€ par défaut
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  date_window_days: 7,
  amount_tolerance_pct: 2,
  auto_threshold: 95,
  suggestion_threshold: 70,
  anomaly_amount_threshold: 500,
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
