import type { FinancialData, KPIs, Insight, InsightAction } from '@/types'

/**
 * Génère des recommandations actionnables basées sur les données financières
 * Phase 4D : Actions concrètes avec estimations d'impact
 */
export function generateInsights(
  currentData: FinancialData,
  kpis: KPIs,
  history: FinancialData[],
  appliedKeys: Set<string>
): Insight[] {
  const insights: Insight[] = []
  const monthKey = currentData.month

  // 1. Point Mort élevé (>180 jours)
  if (kpis.breakEvenDays > 180) {
    const key = `point_mort_eleve_${monthKey}`
    const excessDays = kpis.breakEvenDays - 180
    const fixedCostReduction = Math.round(
      (kpis.totalFixedCosts * excessDays) / kpis.breakEvenDays
    )
    const priceImpactDays = Math.round(excessDays * 0.3)
    const caImpactDays = Math.max(0, Math.round(kpis.breakEvenDays * 0.8))

    insights.push({
      key,
      titre: 'Votre Point Mort est trop élevé',
      analyse: `${kpis.breakEvenDays} jours vs objectif 180 jours. Il faut ${excessDays} jours de trop pour atteindre la rentabilité.`,
      actions: [
        `Renégocier vos charges fixes (loyer, assurances) : potentiel d'économie de ${formatEuro(fixedCostReduction)}/mois`,
        `Augmenter vos prix de 5% : réduction estimée de ${priceImpactDays} jours du Point Mort`,
        `Lancer une campagne commerciale : objectif +20% CA pour réduire le Point Mort à ${caImpactDays} jours`,
      ],
      action_plan: [
        {
          label: 'Renégocier charges fixes',
          impact_estimate: `Économie potentielle : ${formatEuro(fixedCostReduction)}/mois → Point Mort réduit de ~${Math.round(excessDays * 0.4)} jours`,
          type: 'simulate',
        },
        {
          label: 'Simuler hausse prix +5%',
          impact_estimate: `Point Mort réduit de ~${priceImpactDays} jours → ${Math.max(0, kpis.breakEvenDays - priceImpactDays)} jours`,
          type: 'simulate',
        },
        {
          label: 'Plan commercial +20% CA',
          impact_estimate: `Point Mort estimé : ${caImpactDays} jours (objectif 180j)`,
          type: 'plan',
        },
      ],
      severite: kpis.breakEvenDays > 300 ? 'critical' : 'warning',
      applied: appliedKeys.has(key),
      metric_value: kpis.breakEvenDays,
      metric_label: 'jours',
      benchmark_value: 180,
      benchmark_label: 'objectif',
    })
  }

  // 2. Marge faible (<20%)
  if (kpis.marginRate < 0.2) {
    const key = `marge_faible_${monthKey}`
    const marginPct = Math.round(kpis.marginRate * 100)
    const afterPriceIncrease = Math.min(100, marginPct + 5)
    const afterCostReduction = Math.min(100, marginPct + 3)
    const revenueImpact = Math.round(currentData.revenue * 0.05)

    insights.push({
      key,
      titre: 'Votre marge est insuffisante',
      analyse: `Marge sur coûts variables de ${marginPct}% vs minimum recommandé de 20%. Risque de non-rentabilité.`,
      actions: [
        `Augmenter vos tarifs de 5% : marge estimée à ${afterPriceIncrease}% (+${formatEuro(revenueImpact)}/mois de CA)`,
        `Réduire les coûts d'achat de 10% : marge estimée à ${afterCostReduction}%`,
        'Négocier les prix fournisseurs (remises volume, fidélité)',
        'Automatiser les tâches à faible valeur ajoutée',
      ],
      action_plan: [
        {
          label: 'Simuler hausse tarifs +5%',
          impact_estimate: `Marge estimée : ${afterPriceIncrease}% (+${formatEuro(revenueImpact)} CA/mois)`,
          type: 'simulate',
        },
        {
          label: 'Optimiser achats -10%',
          impact_estimate: `Marge estimée : ${afterCostReduction}%`,
          type: 'simulate',
        },
        {
          label: 'Négociation fournisseurs',
          impact_estimate: 'Économie moyenne constatée : 5-15% sur les achats récurrents',
          type: 'action',
        },
      ],
      severite: marginPct < 10 ? 'critical' : 'warning',
      applied: appliedKeys.has(key),
      metric_value: marginPct,
      metric_label: '%',
      benchmark_value: 20,
      benchmark_label: 'minimum',
    })
  }

  // 3. CA en baisse 3 mois consécutifs
  if (history.length >= 3) {
    const lastThree = history.slice(-3)
    const isDecreasing =
      lastThree.length === 3 &&
      lastThree[2].revenue < lastThree[1].revenue &&
      lastThree[1].revenue < lastThree[0].revenue

    if (isDecreasing) {
      const key = `ca_baisse_${monthKey}`
      const dropPct = Math.round(
        ((lastThree[0].revenue - lastThree[2].revenue) / lastThree[0].revenue) * 100
      )
      const targetCA = Math.round(lastThree[0].revenue * 1.1)

      insights.push({
        key,
        titre: 'Chiffre d\'affaires en baisse depuis 3 mois',
        analyse: `Le CA a diminué de ${dropPct}% sur les 3 derniers mois. Tendance préoccupante nécessitant une action rapide.`,
        actions: [
          'Lancer une campagne marketing ciblée sur vos meilleurs segments',
          'Recontacter les anciens clients : taux de conversion moyen 15-25%',
          'Proposer des offres promotionnelles limitées dans le temps',
          'Explorer de nouveaux canaux de distribution',
        ],
        action_plan: [
          {
            label: 'Campagne marketing ciblée',
            impact_estimate: `Objectif : récupérer ${dropPct}% de CA → ${formatEuro(targetCA)}/mois`,
            type: 'plan',
          },
          {
            label: 'Relance clients inactifs',
            impact_estimate: 'Taux de reconversion moyen : 15-25% des clients recontactés',
            type: 'action',
          },
          {
            label: 'Offres promotionnelles',
            impact_estimate: 'Impact estimé sous 30 jours sur le volume de ventes',
            type: 'action',
          },
        ],
        severite: dropPct > 20 ? 'critical' : 'warning',
        applied: appliedKeys.has(key),
        metric_value: dropPct,
        metric_label: '% de baisse',
      })
    }
  }

  // 4. Résultat négatif — Plan de redressement en 3 étapes
  if (kpis.currentResult < 0) {
    const key = `resultat_negatif_${monthKey}`
    const gelPotentiel = Math.round(kpis.totalFixedCosts * 0.15)
    const renegoPotentiel = Math.round(kpis.totalFixedCosts * 0.1)

    insights.push({
      key,
      titre: 'Résultat mensuel en déficit – Plan de redressement',
      analyse: `Perte de ${formatEuro(Math.abs(kpis.currentResult))} ce mois. Les charges dépassent le chiffre d'affaires. Un plan d'action en 3 étapes est recommandé.`,
      actions: [
        `Étape 1 : Geler les dépenses non essentielles → économie immédiate estimée de ${formatEuro(gelPotentiel)}/mois`,
        `Étape 2 : Renégocier les charges fixes (loyer, assurances, abonnements) → objectif -${formatEuro(renegoPotentiel)}/mois`,
        'Étape 3 : Accélérer le recouvrement des créances et relancer tous les impayés sous 48h',
      ],
      action_plan: [
        {
          label: 'Gel dépenses non essentielles',
          impact_estimate: `Économie immédiate : ${formatEuro(gelPotentiel)}/mois`,
          type: 'action',
        },
        {
          label: 'Plan de renégociation charges',
          impact_estimate: `Objectif : -${formatEuro(renegoPotentiel)}/mois sous 60 jours`,
          type: 'plan',
        },
        {
          label: 'Recouvrement créances',
          impact_estimate: 'Impact trésorerie sous 30 jours',
          type: 'action',
        },
      ],
      severite: Math.abs(kpis.currentResult) > kpis.totalFixedCosts * 0.5 ? 'critical' : 'warning',
      applied: appliedKeys.has(key),
      metric_value: kpis.currentResult,
      metric_label: '€/mois',
    })
  }

  // 5. Charges variables élevées (>50%)
  if (currentData.variable_cost_rate > 50) {
    const key = `charges_var_elevees_${monthKey}`
    const reductionTarget = Math.round(currentData.variable_cost_rate - 45)
    const savings = Math.round(currentData.revenue * (reductionTarget / 100))

    insights.push({
      key,
      titre: 'Charges variables trop élevées',
      analyse: `Les charges variables représentent ${currentData.variable_cost_rate.toFixed(0)}% du CA. Objectif recommandé : <50%.`,
      actions: [
        `Renégocier les contrats fournisseurs : objectif -${reductionTarget}% → économie de ${formatEuro(savings)}/mois`,
        'Optimiser la chaîne d\'approvisionnement (grouper les commandes)',
        'Automatiser les processus manuels à faible valeur ajoutée',
      ],
      action_plan: [
        {
          label: 'Renégociation fournisseurs',
          impact_estimate: `Objectif : -${reductionTarget} pts → économie de ${formatEuro(savings)}/mois`,
          type: 'simulate',
        },
        {
          label: 'Optimisation achats',
          impact_estimate: 'Réduction moyenne constatée : 5-8% par groupement de commandes',
          type: 'plan',
        },
      ],
      severite: 'warning',
      applied: appliedKeys.has(key),
      metric_value: currentData.variable_cost_rate,
      metric_label: '% du CA',
      benchmark_value: 50,
      benchmark_label: 'maximum',
    })
  }

  // 6. Santé financière excellente (positive insight)
  if (kpis.healthStatus === 'excellent' && kpis.currentResult > 0) {
    const key = `sante_excellente_${monthKey}`
    const reserveTarget = Math.round(kpis.totalFixedCosts * 4)

    insights.push({
      key,
      titre: 'Excellente santé financière',
      analyse: `Marge de sécurité de ${kpis.safetyMarginPercent.toFixed(0)}% et résultat positif de ${formatEuro(kpis.currentResult)}.`,
      actions: [
        `Constituer une réserve de trésorerie : objectif ${formatEuro(reserveTarget)} (4 mois de charges)`,
        'Envisager des investissements de croissance (marketing, recrutement)',
        'Optimiser la fiscalité avec un expert-comptable',
      ],
      action_plan: [
        {
          label: 'Constituer réserve trésorerie',
          impact_estimate: `Objectif : ${formatEuro(reserveTarget)} (4 mois de charges fixes)`,
          type: 'plan',
        },
        {
          label: 'Investissements de croissance',
          impact_estimate: 'ROI moyen constaté : 2-5x sur 12 mois pour les TPE rentables',
          type: 'plan',
        },
      ],
      severite: 'info',
      applied: appliedKeys.has(key),
      metric_value: kpis.safetyMarginPercent,
      metric_label: '% de marge',
    })
  }

  // Sort: critical first, then warning, then info. Unapplied first.
  return insights.sort((a, b) => {
    if (a.applied !== b.applied) return a.applied ? 1 : -1
    const sevOrder = { critical: 0, warning: 1, info: 2 }
    return sevOrder[a.severite] - sevOrder[b.severite]
  })
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
