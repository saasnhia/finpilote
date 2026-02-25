// Types pour FinSoft

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_name?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  plan: 'starter' | 'cabinet' | 'pro'
  factures_count: number
  factures_limit: number
  max_users: number
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

  // Phase 2: TVA fields
  tva_taux?: number // Taux de TVA (20, 10, 5.5, 2.1)
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
  fichier_url: string | null

  // Extracted fields (match DB column names)
  montant_ht: number | null
  montant_tva: number | null
  montant_ttc: number | null
  date_facture: string | null // ISO date string
  numero_facture: string | null
  fournisseur: string | null

  // OCR processing metadata
  ocr_raw_text: string | null
  ocr_confidence: number | null

  // Status
  statut: string

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
  source: 'regex' | 'custom_pattern' | 'local_ai' | 'claude_api' | 'user_history'
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

// ========================================
// PHASE 2: TVA CA3 Types
// ========================================

// TVA Declarations
export interface DeclarationTVA {
  id: string
  user_id: string

  // Période
  periode_debut: string
  periode_fin: string
  regime: 'reel_normal' | 'reel_simplifie' | 'franchise'

  // Montants calculés
  montant_ht: number
  tva_collectee: number
  tva_deductible: number
  tva_nette: number // positif = à payer, négatif = crédit

  // Détail par taux
  ventes_tva_20: number
  ventes_tva_10: number
  ventes_tva_55: number
  ventes_tva_21: number
  achats_tva_20: number
  achats_tva_10: number
  achats_tva_55: number
  achats_tva_21: number

  // Statut
  statut: 'brouillon' | 'validee' | 'envoyee' | 'payee'
  date_validation?: string
  date_envoi?: string
  date_paiement?: string

  // Fichiers
  fichier_ca3_url?: string

  // Notes
  notes?: string

  // Timestamps
  created_at: string
  updated_at: string
}

// Lignes CA3
export interface LigneCA3 {
  id: string
  declaration_id: string

  // Ligne CA3
  ligne_numero: string // '01', '02', '08', '20', etc.
  ligne_libelle: string

  // Montants
  base_ht?: number
  taux_tva?: number
  montant_tva: number

  // Catégorie
  categorie: 'ventes' | 'achats' | 'autres_operations' | 'credit_tva'

  // Métadonnées
  auto_calculated: boolean
  transaction_count: number

  created_at: string
  updated_at: string
}

// TVA Calculation Result
export interface TVACalculationResult {
  periode_debut: string
  periode_fin: string

  // Ventes
  ventes: {
    total_ht: number
    total_ttc: number
    tva_collectee: number
    par_taux: {
      taux_20: { ht: number; tva: number; ttc: number; count: number }
      taux_10: { ht: number; tva: number; ttc: number; count: number }
      taux_55: { ht: number; tva: number; ttc: number; count: number }
      taux_21: { ht: number; tva: number; ttc: number; count: number }
    }
  }

  // Achats
  achats: {
    total_ht: number
    total_ttc: number
    tva_deductible: number
    par_taux: {
      taux_20: { ht: number; tva: number; ttc: number; count: number }
      taux_10: { ht: number; tva: number; ttc: number; count: number }
      taux_55: { ht: number; tva: number; ttc: number; count: number }
      taux_21: { ht: number; tva: number; ttc: number; count: number }
    }
  }

  // Résultat
  tva_nette: number // positif = à payer, négatif = crédit

  // Transactions utilisées
  transactions_count: number
}

// CA3 Form Data
export interface CA3FormData {
  // Section 1: Ventes et prestations de services
  ligne_01: number // Ventes, prestations de services (base HT)
  ligne_02: number // TVA collectée sur ligne 01 (20%)
  ligne_03: number // Ventes et prestations (base HT)
  ligne_04: number // TVA collectée sur ligne 03 (10%)
  ligne_05: number // Ventes et prestations (base HT)
  ligne_06: number // TVA collectée sur ligne 05 (5.5%)
  ligne_07: number // Ventes et prestations (base HT)
  ligne_08: number // TVA collectée sur ligne 07 (2.1%)

  // Section 2: Acquisitions intracommunautaires
  ligne_09: number // Acquisitions intracommunautaires (base HT)
  ligne_10: number // TVA due sur ligne 09

  // Section 3: Autres opérations imposables
  ligne_11: number // Livraisons à soi-même
  ligne_12: number // TVA due sur ligne 11

  // Section 4: Total TVA brute due
  ligne_15: number // Total TVA brute (02+04+06+08+10+12)

  // Section 5: TVA déductible
  ligne_19: number // Biens constituant des immobilisations
  ligne_20: number // Autres biens et services
  ligne_21: number // Total TVA déductible (19+20)

  // Section 6: TVA nette due
  ligne_23: number // TVA nette due (15-21) ou crédit (21-15)

  // Section 7: Crédit de TVA
  ligne_24: number // Crédit de TVA à reporter
}

// API Response types
export interface TVACalculateResponse {
  success: boolean
  result?: TVACalculationResult
  error?: string
}

export interface TVAGenerateCA3Response {
  success: boolean
  declaration?: DeclarationTVA
  lignes?: LigneCA3[]
  error?: string
}

export interface TVADeclarationsListResponse {
  success: boolean
  declarations?: DeclarationTVA[]
  error?: string
}

// ========================================
// PHASE 4: Alerts, Insights, KPIs, FEC
// ========================================

// Alert types
export type AlertType =
  | 'facture_impayee'
  | 'ecart_tva'
  | 'transaction_anormale'
  | 'seuil_depasse'
  | 'doublon_detecte'
  | 'rapprochement_echoue'
  | 'point_mort_eleve'
  | 'marge_faible'
  | 'ca_baisse'
  | 'tresorerie_basse'

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertStatus = 'nouvelle' | 'vue' | 'resolue' | 'ignoree'

export interface Alert {
  id: string
  user_id: string
  type: AlertType
  severite: AlertSeverity
  titre: string
  description: string
  impact_financier?: number
  actions_suggerees: string[]
  transaction_id?: string
  facture_id?: string
  statut: AlertStatus
  resolved_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Phase 4D: Insight Action Plan
export interface InsightAction {
  label: string
  impact_estimate: string
  type: 'simulate' | 'plan' | 'action'
}

// Insight types
export interface Insight {
  key: string
  titre: string
  analyse: string
  actions: string[]
  action_plan?: InsightAction[]
  severite: AlertSeverity
  applied: boolean
  metric_value?: number
  metric_label?: string
  benchmark_value?: number
  benchmark_label?: string
}

// Comparative metrics
export interface ComparativeMetric {
  label: string
  current_value: number
  previous_value: number
  delta_percent: number
  trend: 'up' | 'down' | 'stable'
}

// Dashboard preferences
export interface DashboardPreferences {
  id: string
  user_id: string
  kpi_order: string[]
  visible_kpis: string[]
  created_at: string
  updated_at: string
}

// FEC types
export interface FECEntry {
  JournalCode: string
  JournalLib: string
  EcritureNum: string
  EcritureDate: string
  CompteNum: string
  CompteLib: string
  CompAuxNum: string
  CompAuxLib: string
  PieceRef: string
  PieceDate: string
  EcritureLib: string
  Debit: string
  Credit: string
  EcritureLet: string
  DateLet: string
  ValidDate: string
  Montantdevise: string
  Idevise: string
}

export interface FECGenerationResult {
  entries: FECEntry[]
  filename: string
  total_entries: number
  total_debit: number
  total_credit: number
  warnings: string[]
}

// ========================================
// PHASE 5: Audit pour Cabinets Comptables
// ========================================

// Seuils légaux d'audit (France 2024/2026)
export interface AuditThresholds {
  // Seuils légaux (2 sur 3 déclenchent l'obligation)
  legal: {
    ca: number           // Chiffre d'affaires HT (€)
    bilan: number        // Total bilan (€)
    effectif: number     // Nombre de salariés
  }
  // Seuils de signification calculés
  signification: {
    value: number        // Seuil de signification (0.5-2% du total bilan)
    percentage: number   // Pourcentage appliqué
    method: 'bilan' | 'ca' | 'resultat' // Base de calcul utilisée
  }
  // Seuil de planification (70% du seuil de signification)
  planification: {
    value: number
    percentage: number   // 70% par défaut
  }
  // Seuil d'anomalies clairement insignifiantes (5% du seuil de planification)
  anomalies: {
    value: number
    percentage: number   // 5% par défaut
  }
}

// Données financières de l'entreprise auditée
export interface CompanyAuditData {
  // Identité
  company_name: string
  siren?: string
  secteur?: string
  exercice_debut: string  // ISO date
  exercice_fin: string    // ISO date

  // Données financières
  chiffre_affaires_ht: number
  total_bilan: number
  effectif_moyen: number
  resultat_net: number

  // Balance des comptes (optionnel, pour tri par seuils)
  balance?: AccountBalance[]
}

// Ligne de balance comptable (PCG)
export interface AccountBalance {
  numero_compte: string   // Ex: '411000', '512000'
  libelle: string         // Ex: 'Clients', 'Banque'
  classe: number          // 1-7 (PCG)
  solde_debiteur: number
  solde_crediteur: number
  solde_net: number       // debiteur - crediteur (positif = débiteur)
  mouvement_debit: number
  mouvement_credit: number
}

// Résultat de l'analyse d'audit
export interface AuditResult {
  // Obligation d'audit
  audit_obligatoire: boolean
  criteres_depasses: Array<{
    critere: 'ca' | 'bilan' | 'effectif'
    valeur: number
    seuil: number
    depasse: boolean
  }>
  nombre_criteres_depasses: number

  // Seuils calculés
  thresholds: AuditThresholds

  // Comptes à risque (solde > seuil planification)
  comptes_significatifs: AccountRisk[]
  comptes_a_verifier: AccountRisk[]
  comptes_insignifiants: AccountRisk[]
}

// Compte avec évaluation du risque
export interface AccountRisk {
  numero_compte: string
  libelle: string
  classe: number
  solde_net: number
  mouvement_total: number    // debit + credit total
  ratio_bilan: number        // solde / total bilan (%)
  risk_level: 'high' | 'medium' | 'low'
  classification: 'significatif' | 'a_verifier' | 'insignifiant'
  notes?: string
}

// API Response types
export interface AuditThresholdsResponse {
  success: boolean
  result?: AuditResult
  error?: string
}

export interface AuditAccountsResponse {
  success: boolean
  comptes_significatifs?: AccountRisk[]
  comptes_a_verifier?: AccountRisk[]
  comptes_insignifiants?: AccountRisk[]
  thresholds?: AuditThresholds
  error?: string
}

// ========================================
// PHASE 8: Notifications de Paiement
// ========================================

// Client
export interface Client {
  id: string
  user_id: string
  nom: string
  email: string | null
  telephone: string | null
  adresse: string | null
  siren: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Facture client (vente)
export type StatutPaiement = 'en_attente' | 'payee' | 'en_retard' | 'partiellement_payee'

export interface FactureClient {
  id: string
  user_id: string
  client_id: string
  numero_facture: string
  objet: string | null
  montant_ht: number
  tva: number
  montant_ttc: number
  date_emission: string
  date_echeance: string
  statut_paiement: StatutPaiement
  montant_paye: number
  date_dernier_paiement: string | null
  nombre_rappels_envoyes: number
  date_dernier_rappel: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined from clients table (optional)
  client?: Client
}

// Niveaux d'urgence de retard
export type NiveauRetard = 'leger' | 'moyen' | 'critique' | 'contentieux'

export interface FactureEnRetard extends FactureClient {
  jours_retard: number
  niveau_retard: NiveauRetard
  montant_restant: number
}

// Rappel email
export type TypeRappel = 'rappel_7j' | 'rappel_15j' | 'rappel_30j' | 'mise_en_demeure' | 'manuel'
export type StatutEnvoi = 'envoye' | 'echoue' | 'en_attente'

export interface RappelEmail {
  id: string
  user_id: string
  facture_client_id: string
  client_id: string
  type_rappel: TypeRappel
  email_destinataire: string
  sujet: string
  contenu: string
  statut_envoi: StatutEnvoi
  resend_message_id: string | null
  erreur: string | null
  date_envoi: string
  created_at: string
  // Joined
  client?: Client
  facture_client?: FactureClient
}

// Stats notifications
export interface NotificationStats {
  total_en_retard: number
  montant_total_du: number
  par_niveau: {
    leger: number
    moyen: number
    critique: number
    contentieux: number
  }
  rappels_envoyes_30j: number
}

// API Response types
export interface NotificationsOverdueResponse {
  success: boolean
  factures?: FactureEnRetard[]
  stats?: NotificationStats
  error?: string
}

export interface SendReminderResponse {
  success: boolean
  rappel?: RappelEmail
  error?: string
}

export interface ClientsResponse {
  success: boolean
  clients?: Client[]
  error?: string
}

export interface FacturesClientResponse {
  success: boolean
  factures?: FactureClient[]
  error?: string
}

// ========================================
// APIs Gouvernementales
// ========================================

// API Entreprise (SIREN)
export interface EntrepriseInfo {
  siren: string
  denomination: string
  forme_juridique: string
  adresse_complete: string
  code_postal: string
  commune: string
  tva_intracom: string | null
  statut_actif: boolean
}

export interface EntrepriseResponse {
  success: boolean
  entreprise?: EntrepriseInfo
  error?: string
}

// API VIES (TVA intracommunautaire)
export interface TVAValidationResult {
  numero_tva: string
  est_valide: boolean
  nom_entreprise: string | null
  adresse: string | null
  pays_code: string
}

export interface TVAValidationResponse {
  success: boolean
  validation?: TVAValidationResult
  error?: string
}

// API FIBEN/Pappers (Score de risque)
export interface ScoreSolvabilite {
  siren: string
  score_risque: number // 1-10 (1=tres risque, 10=tres sur)
  chiffre_affaires: number | null
  resultat_net: number | null
  effectif: number | null
  recommandation: string
}

export interface ScoreRisqueResponse {
  success: boolean
  score?: ScoreSolvabilite
  error?: string
}
