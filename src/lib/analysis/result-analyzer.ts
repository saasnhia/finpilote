import type { FinancialData, KPIs } from '@/types'

export interface ResultAnalysisFactor {
  label: string
  impact: number
  previous: number
  current: number
  type: 'positive' | 'negative' | 'neutral'
}

export interface ResultAnalysis {
  variation: number
  variation_percent: number
  factors: ResultAnalysisFactor[]
  summary: string
}

/**
 * Décompose la variation du résultat mensuel en facteurs explicatifs
 */
export function analyzeResult(
  current: FinancialData,
  previous: FinancialData | null,
  currentKpis: KPIs,
  previousKpis: KPIs | null
): ResultAnalysis | null {
  if (!previous || !previousKpis) return null

  const prevResult = previousKpis.currentResult
  const curResult = currentKpis.currentResult
  const variation = curResult - prevResult
  const variation_percent =
    prevResult !== 0 ? (variation / Math.abs(prevResult)) * 100 : 0

  // Décomposition en 3 facteurs
  const prevFixedCosts = previousKpis.totalFixedCosts
  const curFixedCosts = currentKpis.totalFixedCosts
  const prevVarCosts = previous.revenue * (previous.variable_cost_rate / 100)
  const curVarCosts = current.revenue * (current.variable_cost_rate / 100)

  const revenueImpact = current.revenue - previous.revenue
  const fixedCostsImpact = -(curFixedCosts - prevFixedCosts)
  const varCostsImpact = -(curVarCosts - prevVarCosts)

  const factors: ResultAnalysisFactor[] = []

  if (Math.abs(revenueImpact) > 1) {
    factors.push({
      label: 'Variation du CA',
      impact: revenueImpact,
      previous: previous.revenue,
      current: current.revenue,
      type: revenueImpact >= 0 ? 'positive' : 'negative',
    })
  }

  if (Math.abs(fixedCostsImpact) > 1) {
    factors.push({
      label: 'Charges fixes',
      impact: fixedCostsImpact,
      previous: prevFixedCosts,
      current: curFixedCosts,
      type: fixedCostsImpact >= 0 ? 'positive' : 'negative',
    })
  }

  if (Math.abs(varCostsImpact) > 1) {
    factors.push({
      label: 'Charges variables',
      impact: varCostsImpact,
      previous: prevVarCosts,
      current: curVarCosts,
      type: varCostsImpact >= 0 ? 'positive' : 'negative',
    })
  }

  // Tri par impact absolu décroissant
  factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  // Génération du résumé
  const mainFactor = factors[0]
  let summary: string
  if (mainFactor) {
    const direction = variation >= 0 ? 'augmenté' : 'diminué'
    const cause =
      mainFactor.type === 'negative'
        ? `principalement dû à : ${mainFactor.label.toLowerCase()} (${formatImpact(mainFactor.impact)})`
        : `grâce à : ${mainFactor.label.toLowerCase()} (${formatImpact(mainFactor.impact)})`
    summary = `Résultat ${direction} de ${formatEuro(Math.abs(variation))}, ${cause}.`
  } else {
    summary = 'Résultat stable par rapport au mois précédent.'
  }

  return { variation, variation_percent, factors, summary }
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatImpact(amount: number): string {
  const sign = amount >= 0 ? '+' : ''
  return `${sign}${formatEuro(amount)}`
}
