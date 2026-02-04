// Types pour FinPilote

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_name?: string
  created_at: string
  updated_at: string
}

export interface FinancialData {
  id: string
  user_id: string
  month: string // Format: YYYY-MM
  
  // Charges fixes
  fixed_costs: {
    rent: number          // Loyer
    salaries: number      // Salaires
    insurance: number     // Assurances
    subscriptions: number // Abonnements
    loan_payments: number // Remboursements emprunts
    other: number         // Autres charges fixes
  }
  
  // Charges variables (en % du CA)
  variable_cost_rate: number // Taux de charges variables
  
  // Revenus
  revenue: number // Chiffre d'affaires réalisé
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface KPIs {
  // Charges fixes totales
  totalFixedCosts: number
  
  // Taux de marge sur coûts variables
  marginRate: number
  
  // Seuil de rentabilité
  breakEvenPoint: number
  
  // Point mort (en jours)
  breakEvenDays: number
  
  // Marge de sécurité
  safetyMargin: number
  safetyMarginPercent: number
  
  // Résultat
  currentResult: number
  
  // Indicateur de santé
  healthStatus: 'excellent' | 'good' | 'warning' | 'danger'
}

export interface ChartDataPoint {
  month: string
  revenue: number
  fixedCosts: number
  variableCosts: number
  breakEvenPoint: number
  result: number
}

export interface Transaction {
  id: string
  user_id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  is_fixed: boolean
  created_at: string

  // Phase 1: Bank automation fields (optional for backward compatibility, have DB defaults)
  bank_account_id?: string
  source?: 'manual' | 'bank_import' | 'invoice'
  status?: 'active' | 'reconciled' | 'duplicate' | 'pending'
  confidence_score?: number
  original_description?: string
  import_batch_id?: string
  suggested_category?: string
  category_confirmed?: boolean
}

export type TransactionCategory = 
  | 'rent'
  | 'salaries'
  | 'insurance'
  | 'subscriptions'
  | 'loan_payments'
  | 'supplies'
  | 'marketing'
  | 'utilities'
  | 'sales'
  | 'services'
  | 'other'

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  rent: 'Loyer',
  salaries: 'Salaires',
  insurance: 'Assurances',
  subscriptions: 'Abonnements',
  loan_payments: 'Emprunts',
  supplies: 'Fournitures',
  marketing: 'Marketing',
  utilities: 'Charges',
  sales: 'Ventes',
  services: 'Services',
  other: 'Autre',
}

export const FIXED_COST_CATEGORIES: TransactionCategory[] = [
  'rent',
  'salaries',
  'insurance',
  'subscriptions',
  'loan_payments',
]

export const VARIABLE_COST_CATEGORIES: TransactionCategory[] = [
  'supplies',
  'marketing',
]

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'sales',
  'services',
  'other',
]

// Invoice/Facture types
export interface Facture {
  id: string
  user_id: string

  // File metadata
  file_name: string
  file_type: 'pdf' | 'jpg' | 'jpeg' | 'png'
  file_size_bytes: number

  // Extracted fields
  montant_ht: number | null
  tva: number | null
  montant_ttc: number | null
  date_facture: string | null // ISO date string
  numero_facture: string | null
  nom_fournisseur: string | null

  // OCR processing metadata
  raw_ocr_text: string | null

  // AI validation metadata
  ai_confidence_score: number | null
  ai_extraction_notes: string | null

  // Validation status
  validation_status: 'pending' | 'validated' | 'rejected' | 'manual_review'
  validated_by_user: boolean

  // User edits tracking
  user_edited_fields: string[]

  // Timestamps
  created_at: string
  updated_at: string
}

// API Request/Response types
export interface UploadFactureResponse {
  success: boolean
  facture?: Facture
  error?: string
  warnings?: string[]
}

// Extracted invoice data structure from Claude
export interface ExtractedInvoiceData {
  montant_ht: number | null
  tva: number | null
  montant_ttc: number | null
  date_facture: string | null
  numero_facture: string | null
  nom_fournisseur: string | null
  confidence_score: number
  extraction_notes: string
}

// ========================================
// PHASE 1: Bank Automation Types
// ========================================

// Bank Accounts
export interface BankAccount {
  id: string
  user_id: string
  bank_name: string
  account_name: string
  iban: string
  bic?: string
  current_balance: number
  last_sync_date?: string
  account_type: 'checking' | 'savings' | 'business'
  is_active: boolean
  created_at: string
  updated_at: string
}

// Bank Import
export interface BankImportPreview {
  file_name: string
  bank_name: string
  detected_format: 'bnp' | 'societe_generale' | 'credit_agricole' | 'unknown'
  total_transactions: number
  date_range: { start: string; end: string }
  transactions: BankTransaction[]
  warnings: string[]
}

export interface BankTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  balance_after?: number
  suggested_category?: string
  confidence_score?: number
}

// Categorization
export interface CategorySuggestion {
  category: string
  confidence: number
  reasoning: string
  source: 'regex' | 'custom_pattern' | 'claude_api' | 'user_history'
}

export interface CustomCategoryPattern {
  id: string
  user_id: string
  description_pattern: string
  category: string
  is_fixed: boolean
  confidence_score: number
  usage_count: number
  last_used_at?: string
  pattern_type: 'substring' | 'regex' | 'exact'
  created_at: string
  updated_at: string
}

export interface CategorizationResult {
  transaction_id: string
  suggestions: CategorySuggestion[]
  applied_category?: string
  applied_automatically: boolean
}

// Reconciliation
export interface Reconciliation {
  id: string
  user_id: string
  transaction_id: string
  bank_transaction_id: string
  match_score: number
  match_method: 'auto' | 'manual' | 'suggested'
  date_score?: number
  amount_score?: number
  description_score?: number
  status: 'pending' | 'confirmed' | 'rejected'
  confirmed_at?: string
  confirmed_by_user: boolean
  created_at: string
  updated_at: string
}

export interface ReconciliationMatch {
  manual_transaction: Transaction
  bank_transaction: Transaction
  match_score: number
  date_score: number
  amount_score: number
  description_score: number
  suggested: boolean
}

// API Response types
export interface BankImportResponse {
  success: boolean
  preview?: BankImportPreview
  error?: string
}

export interface ImportConfirmResponse {
  success: boolean
  imported_count: number
  duplicate_count: number
  error?: string
}

export interface CategorizationResponse {
  success: boolean
  processed_count: number
  auto_categorized_count: number
  manual_review_count: number
  error?: string
}

export interface ReconciliationResponse {
  success: boolean
  auto_matched_count: number
  suggested_matches: ReconciliationMatch[]
  unmatched_manual_count: number
  unmatched_bank_count: number
  error?: string
}
