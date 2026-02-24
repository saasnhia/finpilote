// ============================================================
// PCG Categorization Matcher
// Maps fournisseur names → compte comptable via user rules
// ============================================================

export interface CategorizationRule {
  id: string
  user_id: string
  fournisseur_pattern: string    // normalized (lowercase, no accents)
  fournisseur_display: string | null
  compte_comptable: string
  compte_label: string | null
  code_tva: string
  categorie: string | null
  is_active: boolean
  match_count: number
  confidence: number
  source: 'manual' | 'learned' | 'suggested'
  created_at: string
  updated_at: string
}

export interface CategorizationMatch {
  rule: CategorizationRule
  score: number        // 0-100 similarity score
  exact: boolean       // true if exact pattern match
}

export interface CategorizationSuggestion {
  compte_comptable: string
  compte_label: string | null
  code_tva: string
  categorie: string | null
  confidence: number   // 0-100
  rule_id: string
  source: 'exact' | 'fuzzy' | 'none'
}

// ------------------------------------------------------------
// PCG Comptes communs — catalogue de référence
// ------------------------------------------------------------
export const PCG_COMPTES: Record<string, string> = {
  // Classe 6 — Charges
  '600': 'Achats de matières premières',
  '601': 'Achats de matières premières et approvisionnements',
  '602': 'Achats de sous-traitance',
  '604': 'Achats d\'études et prestations de services',
  '605': 'Achats de matériels, équipements et travaux',
  '606': 'Achats non stockés de matières et fournitures',
  '6061': 'Fournitures non stockables (eau, énergie)',
  '6062': 'Fournitures consommables',
  '6063': 'Fournitures d\'entretien et de petit équipement',
  '6064': 'Fournitures administratives',
  '607': 'Achats de marchandises',
  '611': 'Sous-traitance générale',
  '612': 'Redevances de crédit-bail mobilier',
  '613': 'Locations mobilières',
  '614': 'Charges locatives et de copropriété',
  '615': 'Entretien et réparations',
  '616': 'Primes d\'assurance',
  '617': 'Études et recherches',
  '618': 'Divers (documentation, frais de colloques)',
  '621': 'Personnel extérieur à l\'entreprise',
  '622': 'Rémunérations d\'intermédiaires et honoraires',
  '623': 'Publicité, publications, relations publiques',
  '6231': 'Annonces et insertions',
  '6232': 'Foires et expositions',
  '6233': 'Fêtes et réceptions',
  '6236': 'Catalogues et imprimés',
  '6237': 'Publications',
  '624': 'Transports de biens et transports collectifs du personnel',
  '625': 'Déplacements, missions et réceptions',
  '626': 'Frais postaux et de télécommunications',
  '627': 'Services bancaires et assimilés',
  '628': 'Divers (cotisations, frais de formation)',
  '631': 'Impôts, taxes et versements assimilés',
  '641': 'Rémunérations du personnel',
  '645': 'Charges de sécurité sociale et de prévoyance',
  '651': 'Redevances pour concessions, brevets, licences',
  '661': 'Charges d\'intérêts',
  '671': 'Charges exceptionnelles',
  '681': 'Dotations aux amortissements',
  // Classe 7 — Produits
  '701': 'Ventes de produits finis',
  '706': 'Prestations de services',
  '707': 'Ventes de marchandises',
  '708': 'Produits des activités annexes',
  '741': 'Subventions d\'exploitation',
  '771': 'Produits exceptionnels',
}

// Codes TVA communs
export const TVA_CODES: Record<string, string> = {
  'TVA20': 'TVA 20%',
  'TVA10': 'TVA 10%',
  'TVA55': 'TVA 5,5%',
  'TVA21': 'TVA 2,1%',
  'EXONERE': 'Exonéré de TVA',
  'AUTOLIQ': 'Auto-liquidation',
  'HORSCHAMP': 'Hors champ TVA',
}

// ------------------------------------------------------------
// Normalization
// ------------------------------------------------------------

/**
 * Normalise un nom de fournisseur pour la comparaison :
 * lowercase, suppression accents, ponctuation, stopwords courants
 */
export function normalizeFournisseur(name: string): string {
  if (!name) return ''

  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')   // remove punctuation
    .replace(/\b(sarl|sas|sa|sasu|eurl|auto|entrepreneur|et|de|du|la|le|les|l|d)\b/g, '') // stopwords
    .replace(/\s+/g, ' ')
    .trim()
}

// ------------------------------------------------------------
// Similarity scoring (Jaccard token overlap)
// ------------------------------------------------------------

function tokenize(s: string): Set<string> {
  return new Set(s.split(' ').filter(t => t.length > 1))
}

function jaccardSimilarity(a: string, b: string): number {
  const ta = tokenize(a)
  const tb = tokenize(b)
  if (ta.size === 0 && tb.size === 0) return 1
  if (ta.size === 0 || tb.size === 0) return 0

  let intersection = 0
  for (const t of ta) {
    if (tb.has(t)) intersection++
  }
  const union = ta.size + tb.size - intersection
  return intersection / union
}

// ------------------------------------------------------------
// Core matching logic
// ------------------------------------------------------------

/**
 * Cherche la meilleure règle de catégorisation pour un fournisseur donné.
 * Retourne null si aucune règle active ne correspond (score < 60).
 */
export function matchFournisseur(
  fournisseur: string,
  rules: CategorizationRule[]
): CategorizationMatch | null {
  const normalized = normalizeFournisseur(fournisseur)
  const activeRules = rules.filter(r => r.is_active)

  let bestMatch: CategorizationMatch | null = null
  let bestScore = 0

  for (const rule of activeRules) {
    // Exact match (normalized)
    if (rule.fournisseur_pattern === normalized) {
      return {
        rule,
        score: 100,
        exact: true,
      }
    }

    // Contains check (one normalized name contains the other)
    const containsScore = (
      normalized.includes(rule.fournisseur_pattern) ||
      rule.fournisseur_pattern.includes(normalized)
    ) ? 85 : 0

    // Jaccard similarity
    const jacc = jaccardSimilarity(normalized, rule.fournisseur_pattern)
    const jaccScore = Math.round(jacc * 100)

    const score = Math.max(containsScore, jaccScore)

    if (score > bestScore) {
      bestScore = score
      bestMatch = { rule, score, exact: false }
    }
  }

  // Only return if score is meaningful (>=60)
  if (bestMatch && bestScore >= 60) {
    return bestMatch
  }

  return null
}

/**
 * Suggère une catégorisation pour un fournisseur donné.
 * Combine le matching de règles avec la confidence de la règle.
 */
export function suggestCategorization(
  fournisseur: string,
  rules: CategorizationRule[]
): CategorizationSuggestion | null {
  const match = matchFournisseur(fournisseur, rules)
  if (!match) return null

  // Final confidence = min(match score, rule confidence) * blend
  const blendedConfidence = match.exact
    ? Math.min(match.rule.confidence, 100)
    : Math.round((match.score * 0.6 + match.rule.confidence * 0.4))

  return {
    compte_comptable: match.rule.compte_comptable,
    compte_label: match.rule.compte_label,
    code_tva: match.rule.code_tva,
    categorie: match.rule.categorie,
    confidence: blendedConfidence,
    rule_id: match.rule.id,
    source: match.exact ? 'exact' : 'fuzzy',
  }
}
