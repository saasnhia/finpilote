import { createClient } from '@/lib/supabase/server'
import type { TVAValidationResult } from '@/types'

/**
 * Valide un numero de TVA intracommunautaire via l'API VIES.
 * Cache permanent (une fois valide = toujours valide).
 */
export async function validerTVAIntracom(numeroTVA: string): Promise<TVAValidationResult> {
  // Normaliser le format
  const numeroNormalise = numeroTVA.replace(/\s+/g, '').toUpperCase()

  // Extraire code pays et numero
  const match = numeroNormalise.match(/^([A-Z]{2})(.+)$/)
  if (!match) {
    throw new Error('Format TVA invalide (ex: FR12345678901)')
  }

  const paysCode = match[1]
  const numeroSeul = match[2]

  const supabase = await createClient()

  // 1. Verifier le cache (permanent pour les numeros valides)
  const { data: cached } = await supabase
    .from('tva_validations_cache')
    .select('*')
    .eq('numero_tva', numeroNormalise)
    .single()

  if (cached) {
    console.log('[API VIES] Cache hit pour TVA', numeroNormalise)
    return {
      numero_tva: cached.numero_tva,
      est_valide: cached.est_valide,
      nom_entreprise: cached.nom_entreprise,
      adresse: cached.adresse,
      pays_code: cached.pays_code,
    }
  }

  console.log('[API VIES] Cache miss pour TVA', numeroNormalise, '- Appel API externe')

  // 2. Appeler l'API VIES
  try {
    const response = await fetch(
      'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: paysCode,
          vatNumber: numeroSeul,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`API VIES erreur: ${response.status}`)
    }

    const data = await response.json()

    const result: TVAValidationResult = {
      numero_tva: numeroNormalise,
      est_valide: data.valid === true || data.isValid === true,
      nom_entreprise: data.name || null,
      adresse: data.address || null,
      pays_code: paysCode,
    }

    // 3. Stocker dans le cache (permanent)
    await supabase.from('tva_validations_cache').insert({
      numero_tva: numeroNormalise,
      pays_code: paysCode,
      est_valide: result.est_valide,
      nom_entreprise: result.nom_entreprise,
      adresse: result.adresse,
      validated_at: new Date().toISOString(),
    })

    console.log('[API VIES] TVA', numeroNormalise, result.est_valide ? 'VALIDE' : 'INVALIDE')
    return result
  } catch (error) {
    console.error('[API VIES] Erreur lors de l\'appel API:', error)

    // En cas d'erreur, retourner invalide par securite
    return {
      numero_tva: numeroNormalise,
      est_valide: false,
      nom_entreprise: null,
      adresse: null,
      pays_code: paysCode,
    }
  }
}
