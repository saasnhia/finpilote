export type Plan = 'starter' | 'cabinet' | 'pro'

export type Feature =
  // ── Baseline (all plans) ──────────────────────────────
  | 'ocr'
  | 'siren'
  | 'vies'
  | 'fec_export'
  | 'import_universel'
  | 'balance_agee'
  // ── Cabinet+ ─────────────────────────────────────────
  | 'categorization_rules'
  | 'rapprochement_auto'
  | 'smart_matching'          // alias → rapprochement_auto
  | 'dashboard_automatisation'
  | 'sage_sync'
  | 'score_risque_fournisseur'
  | 'pappers'                 // alias → score_risque_fournisseur
  | 'alertes_kpi'
  | 'alerts'                  // alias → alertes_kpi
  | 'audit_ia'
  | 'cegid_loop'
  // ── Pro only ─────────────────────────────────────────
  | 'api_dedicee'
  | 'custom_api'              // alias → api_dedicee
  | 'erp_custom'
  | 'support_dedie'
  | 'sla'
  | 'unlimited_users'

const STARTER_FEATURES: Feature[] = [
  'ocr', 'siren', 'vies', 'fec_export', 'import_universel', 'balance_agee',
]

const CABINET_FEATURES: Feature[] = [
  ...STARTER_FEATURES,
  'categorization_rules',
  'rapprochement_auto', 'smart_matching',
  'dashboard_automatisation',
  'sage_sync',
  'score_risque_fournisseur', 'pappers',
  'alertes_kpi', 'alerts',
  'audit_ia',
  'cegid_loop',
]

const PRO_FEATURES: Feature[] = [
  ...CABINET_FEATURES,
  'api_dedicee', 'custom_api',
  'erp_custom',
  'support_dedie',
  'sla',
  'unlimited_users',
]

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  starter: STARTER_FEATURES,
  cabinet: CABINET_FEATURES,
  pro:     PRO_FEATURES,
}

const PLAN_LIMITS: Record<Plan, { factures: number; users: number }> = {
  starter: { factures: 300,      users: 1 },
  cabinet: { factures: Infinity, users: 10 },
  pro:     { factures: Infinity, users: Infinity },
}

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false
}

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter
}

export function getUpgradePlan(currentPlan: Plan): Plan | null {
  switch (currentPlan) {
    case 'starter': return 'cabinet'
    case 'cabinet': return 'pro'
    case 'pro':     return null
  }
}

export function getFeatureLabel(feature: Feature): string {
  const labels: Record<Feature, string> = {
    ocr:                    'OCR Factures',
    siren:                  'Enrichissement SIREN',
    vies:                   'Validation TVA UE (VIES)',
    fec_export:             'Export FEC',
    import_universel:       'Import universel',
    balance_agee:           'Balance âgée',
    categorization_rules:   'Règles automatiques de catégorisation',
    rapprochement_auto:     'Rapprochement bancaire automatique',
    smart_matching:         'Rapprochement bancaire automatique',
    dashboard_automatisation:'Dashboard automatisation & rollback',
    sage_sync:              'Synchronisation Sage (Chift)',
    score_risque_fournisseur:'Score risque fournisseur (Pappers)',
    pappers:                'Score risque fournisseur (Pappers)',
    alertes_kpi:            'Alertes KPI automatiques',
    alerts:                 'Alertes & notifications',
    audit_ia:               'Audit IA',
    cegid_loop:             'Cegid Loop',
    api_dedicee:            'API dédiée FinSoft',
    custom_api:             'API personnalisée',
    erp_custom:             'Intégration ERP sur-mesure',
    support_dedie:          'Support dédié 6h/jour',
    sla:                    'SLA garanti',
    unlimited_users:        'Utilisateurs illimités',
  }
  return labels[feature] ?? feature
}

export function getPlanLabel(plan: Plan): string {
  const labels: Record<Plan, string> = {
    starter: 'Starter',
    cabinet: 'Cabinet',
    pro:     'Pro',
  }
  return labels[plan]
}

export function getRequiredPlan(feature: Feature): Plan {
  if (STARTER_FEATURES.includes(feature)) return 'starter'
  if (CABINET_FEATURES.includes(feature)) return 'cabinet'
  return 'pro'
}
