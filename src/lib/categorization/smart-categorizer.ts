import Anthropic from '@anthropic-ai/sdk'
import type { CategorySuggestion, CustomCategoryPattern } from '@/types'

// Regex patterns for common French business transactions
const REGEX_PATTERNS: Array<{
  pattern: RegExp
  category: string
  confidence: number
}> = [
  // Rent & Lease
  { pattern: /loyer|bail|location bureau|location local/i, category: 'rent', confidence: 0.95 },

  // Salaries & Social charges
  { pattern: /urssaf|cotisation sociale|salaire|paie|rémunération/i, category: 'salaries', confidence: 0.95 },
  { pattern: /pôle emploi|assurance chômage/i, category: 'salaries', confidence: 0.90 },

  // Insurance
  { pattern: /assurance|mutuelle|prévoyance|rc pro|responsabilité civile/i, category: 'insurance', confidence: 0.90 },

  // Utilities
  { pattern: /edf|électricité|gaz|enedis|engie/i, category: 'utilities', confidence: 0.90 },
  { pattern: /eau|veolia|suez/i, category: 'utilities', confidence: 0.85 },
  { pattern: /téléphone|internet|fibre|orange|sfr|free|bouygues/i, category: 'utilities', confidence: 0.85 },

  // Subscriptions
  { pattern: /abonnement|subscription|saas|logiciel|software/i, category: 'subscriptions', confidence: 0.85 },
  { pattern: /aws|azure|google cloud|heroku|netlify|vercel/i, category: 'subscriptions', confidence: 0.90 },
  { pattern: /microsoft|adobe|slack|notion|figma/i, category: 'subscriptions', confidence: 0.85 },

  // Loan payments
  { pattern: /emprunt|crédit|prêt|remboursement|échéance/i, category: 'loan_payments', confidence: 0.90 },

  // Supplies
  { pattern: /fourniture|papeterie|bureau vallée|amazon|cdiscount/i, category: 'supplies', confidence: 0.80 },

  // Marketing
  { pattern: /publicité|marketing|google ads|facebook ads|meta ads/i, category: 'marketing', confidence: 0.90 },
  { pattern: /linkedin|mailchimp|sendinblue/i, category: 'marketing', confidence: 0.85 },

  // Sales & Services (income)
  { pattern: /virement|vente|facture|paiement client|règlement/i, category: 'sales', confidence: 0.75 },
  { pattern: /stripe|paypal|mollie|sumup/i, category: 'sales', confidence: 0.80 },
]

/**
 * Try to categorize using regex patterns
 */
function tryRegexMatch(description: string): CategorySuggestion | null {
  const normalized = description.toLowerCase().trim()

  for (const { pattern, category, confidence } of REGEX_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        category,
        confidence,
        reasoning: 'Correspondance avec pattern automatique',
        source: 'regex',
      }
    }
  }

  return null
}

/**
 * Try to categorize using custom user patterns
 */
function tryCustomPatterns(
  description: string,
  customPatterns: CustomCategoryPattern[]
): CategorySuggestion | null {
  const normalized = description.toLowerCase().trim()

  // Sort by usage_count (most used first) and confidence
  const sortedPatterns = [...customPatterns].sort((a, b) => {
    if (b.usage_count !== a.usage_count) {
      return b.usage_count - a.usage_count
    }
    return b.confidence_score - a.confidence_score
  })

  for (const pattern of sortedPatterns) {
    let matches = false

    switch (pattern.pattern_type) {
      case 'exact':
        matches = normalized === pattern.description_pattern.toLowerCase()
        break
      case 'substring':
        matches = normalized.includes(pattern.description_pattern.toLowerCase())
        break
      case 'regex':
        try {
          const regex = new RegExp(pattern.description_pattern, 'i')
          matches = regex.test(normalized)
        } catch {
          // Invalid regex, skip
          continue
        }
        break
    }

    if (matches) {
      return {
        category: pattern.category,
        confidence: pattern.confidence_score,
        reasoning: `Pattern personnalisé appris (utilisé ${pattern.usage_count} fois)`,
        source: 'custom_pattern',
      }
    }
  }

  return null
}

/**
 * Use Claude API to categorize transaction (fallback)
 */
async function tryClaudeAPI(
  description: string,
  amount: number,
  type: 'income' | 'expense'
): Promise<CategorySuggestion | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured')
    return null
  }

  try {
    const anthropic = new Anthropic({ apiKey })

    const prompt = `Tu es un assistant comptable expert en France. Analyse cette transaction et catégorise-la selon le Plan Comptable Général (PCG) français.

Transaction:
- Description: "${description}"
- Montant: ${amount}€
- Type: ${type === 'income' ? 'Revenu' : 'Dépense'}

Catégories disponibles:
- rent (Loyer/Bail)
- salaries (Salaires/Charges sociales)
- insurance (Assurances)
- subscriptions (Abonnements)
- loan_payments (Remboursements emprunts)
- utilities (Électricité/Eau/Téléphone)
- supplies (Fournitures)
- marketing (Marketing/Publicité)
- sales (Ventes)
- services (Services)
- other (Autre)

Réponds uniquement avec un JSON pur (pas de markdown):
{
  "category": "nom_categorie",
  "confidence": 0.85,
  "reasoning": "Brève explication"
}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') return null

    const result = JSON.parse(content.text)

    return {
      category: result.category,
      confidence: Math.min(result.confidence, 0.95), // Cap confidence to avoid overconfidence
      reasoning: result.reasoning,
      source: 'claude_api',
    }
  } catch (error: any) {
    console.error('Claude API error:', error.message)
    return null
  }
}

/**
 * Main smart categorization function (3-tier strategy)
 */
export async function smartCategorize(
  description: string,
  amount: number,
  type: 'income' | 'expense',
  customPatterns: CustomCategoryPattern[] = []
): Promise<CategorySuggestion[]> {
  const suggestions: CategorySuggestion[] = []

  // Tier 1: Custom Patterns (highest priority)
  const customMatch = tryCustomPatterns(description, customPatterns)
  if (customMatch) {
    suggestions.push(customMatch)
    // If custom pattern has high confidence, skip other tiers
    if (customMatch.confidence >= 0.95) {
      return suggestions
    }
  }

  // Tier 2: Regex Heuristics
  const regexMatch = tryRegexMatch(description)
  if (regexMatch) {
    suggestions.push(regexMatch)
    // If regex match has high confidence, skip Claude API
    if (regexMatch.confidence >= 0.90) {
      return suggestions
    }
  }

  // Tier 3: Claude API Fallback (only if no high-confidence match)
  if (suggestions.length === 0 || suggestions[0].confidence < 0.80) {
    const claudeMatch = await tryClaudeAPI(description, amount, type)
    if (claudeMatch) {
      suggestions.push(claudeMatch)
    }
  }

  // If no suggestions, return a default with low confidence
  if (suggestions.length === 0) {
    suggestions.push({
      category: 'other',
      confidence: 0.30,
      reasoning: 'Aucun pattern reconnu - catégorisation manuelle recommandée',
      source: 'regex',
    })
  }

  return suggestions
}

/**
 * Auto-apply category if confidence is high enough
 */
export function shouldAutoApply(suggestion: CategorySuggestion): boolean {
  return suggestion.confidence >= 0.80
}

/**
 * Learn from user confirmation (update or create custom pattern)
 */
export function learnFromUserChoice(
  description: string,
  chosenCategory: string,
  suggestions: CategorySuggestion[]
): {
  shouldCreatePattern: boolean
  patternData?: Partial<CustomCategoryPattern>
} {
  // If user chose a different category than suggested, create a custom pattern
  const topSuggestion = suggestions[0]

  if (!topSuggestion || topSuggestion.category !== chosenCategory) {
    // Extract key words from description (simple heuristic)
    const words = description.toLowerCase().split(/\s+/)
    const meaningfulWords = words.filter(w => w.length > 3)
    const pattern = meaningfulWords.slice(0, 2).join(' ')

    return {
      shouldCreatePattern: true,
      patternData: {
        description_pattern: pattern,
        category: chosenCategory,
        pattern_type: 'substring',
        confidence_score: 0.85,
        usage_count: 1,
        is_fixed: false,
      },
    }
  }

  // If user confirmed the suggestion, just increment usage_count (handled in API)
  return { shouldCreatePattern: false }
}
