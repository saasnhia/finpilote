import { createClient } from '@/lib/supabase/server'
import type { ScoreSolvabilite } from '@/types'

/**
 * Calcule un score de solvabilite pour un fournisseur via API Pappers.
 * Cache 7 jours (donnees financieres evoluent lentement).
 */
export async function checkSolvabilite(siren: string): Promise<ScoreSolvabilite> {
  if (!/^\d{9}$/.test(siren)) {
    throw new Error('Format SIREN invalide (9 chiffres requis)')
  }

  const supabase = await createClient()

  // 1. Verifier le cache (TTL 7 jours)
  const { data: cached } = await supabase
    .from('fournisseurs_risque_cache')
    .select('*')
    .eq('siren', siren)
    .single()

  if (cached && new Date(cached.expires_at) > new Date()) {
    console.log('[API FIBEN] Cache hit pour SIREN', siren)
    return {
      siren: cached.siren,
      score_risque: cached.score_risque,
      chiffre_affaires: cached.chiffre_affaires,
      resultat_net: cached.resultat_net,
      effectif: cached.effectif,
      recommandation: getRecommandation(cached.score_risque),
    }
  }

  console.log('[API FIBEN] Cache miss pour SIREN', siren, '- Appel API Pappers')

  // 2. Appeler l'API Pappers
  try {
    const apiToken = process.env.PAPPERS_API_TOKEN
    if (!apiToken) {
      throw new Error('PAPPERS_API_TOKEN non configure')
    }

    const response = await fetch(
      `https://api.pappers.fr/v2/entreprise?api_token=${apiToken}&siren=${siren}&format=json`
    )

    if (!response.ok) {
      throw new Error(`API Pappers erreur: ${response.status}`)
    }

    const data = await response.json()

    // 3. Calculer le score de risque (1-10)
    const scoreRisque = calculerScoreRisque(data)

    const result: ScoreSolvabilite = {
      siren,
      score_risque: scoreRisque,
      chiffre_affaires: data.finances?.chiffre_affaires ?? data.situation_financiere?.chiffre_affaires ?? null,
      resultat_net: data.finances?.resultat ?? data.situation_financiere?.resultat_net ?? null,
      effectif: data.effectif ?? data.situation_financiere?.effectif ?? null,
      recommandation: getRecommandation(scoreRisque),
    }

    // 4. Stocker dans le cache (7 jours)
    await supabase.from('fournisseurs_risque_cache').upsert({
      siren,
      score_risque: scoreRisque,
      chiffre_affaires: result.chiffre_affaires,
      resultat_net: result.resultat_net,
      effectif: result.effectif,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    console.log('[API FIBEN] Score calcule pour SIREN', siren, ':', scoreRisque)
    return result
  } catch (error) {
    console.error('[API FIBEN] Erreur lors de l\'appel API:', error)

    // Fallback : cache expire si disponible
    if (cached) {
      return {
        siren: cached.siren,
        score_risque: cached.score_risque,
        chiffre_affaires: cached.chiffre_affaires,
        resultat_net: cached.resultat_net,
        effectif: cached.effectif,
        recommandation: getRecommandation(cached.score_risque),
      }
    }

    // Par securite : score neutre si aucune donnee
    return {
      siren,
      score_risque: 5,
      chiffre_affaires: null,
      resultat_net: null,
      effectif: null,
      recommandation: 'Donnees insuffisantes - Verification manuelle recommandee',
    }
  }
}

/**
 * Calcule un score de risque base sur les donnees financieres.
 * Score 1-10 (1=tres risque, 10=tres sur)
 */
function calculerScoreRisque(data: any): number {
  let score = 5

  // Critere 1 : Resultat net
  const resultat = data.finances?.resultat ?? data.situation_financiere?.resultat_net
  if (resultat != null) {
    if (resultat > 0) score += 2
    else if (resultat < -100000) score -= 3
    else score -= 1
  }

  // Critere 2 : Chiffre d'affaires
  const ca = data.finances?.chiffre_affaires ?? data.situation_financiere?.chiffre_affaires
  if (ca != null) {
    if (ca > 1000000) score += 2
    else if (ca < 100000) score -= 1
  }

  // Critere 3 : Effectif
  const effectif = data.effectif ?? data.situation_financiere?.effectif
  if (effectif != null && effectif >= 10) score += 1

  // Critere 4 : Procedures collectives
  if (data.procedures_collectives && data.procedures_collectives.length > 0) {
    score -= 5
  }

  return Math.max(1, Math.min(10, score))
}

function getRecommandation(score: number): string {
  if (score >= 8) return 'Fournisseur fiable - Paiement a terme accepte'
  if (score >= 6) return 'Risque modere - Conditions de paiement standards'
  if (score >= 4) return 'Risque eleve - Privilegier paiement a 30 jours max'
  return 'Risque tres eleve - Paiement comptant fortement recommande'
}
