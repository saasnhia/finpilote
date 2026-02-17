import { createClient } from '@/lib/supabase/server'
import type { EntrepriseInfo } from '@/types'

/**
 * Calcule le numero de TVA intracommunautaire francais a partir du SIREN.
 * Format : FR + cle (2 chiffres) + SIREN (9 chiffres)
 * Algorithme officiel : cle = (12 + 3 * (SIREN % 97)) % 97
 */
function calculerTVAFrancaise(siren: string): string {
  const sirenNumber = parseInt(siren, 10)
  const cle = (12 + 3 * (sirenNumber % 97)) % 97
  const cleStr = cle.toString().padStart(2, '0')
  return `FR${cleStr}${siren}`
}

/**
 * Enrichit les donnees d'une entreprise via son SIREN.
 * Utilise l'API Recherche Entreprises (recherche-entreprises.api.gouv.fr, gratuite, sans cle).
 * Cache Supabase (TTL 30 jours) avec fallback sur cache expire.
 */
export async function enrichirFournisseur(siren: string): Promise<EntrepriseInfo> {
  if (!/^\d{9}$/.test(siren)) {
    throw new Error('Format SIREN invalide (9 chiffres requis)')
  }

  const supabase = await createClient()

  // 1. Verifier le cache
  const { data: cached } = await supabase
    .from('entreprises_cache')
    .select('*')
    .eq('siren', siren)
    .single()

  if (cached && new Date(cached.expires_at) > new Date()) {
    console.log('[API SIRENE] Cache hit pour SIREN', siren)
    return mapCachedToEntreprise(cached)
  }

  console.log('[API SIRENE] Cache miss pour SIREN', siren, '- Appel API externe')

  // 2. Appeler l'API Recherche Entreprises (gratuite, sans cle)
  try {
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&page=1&per_page=1`
    console.log('[API SIRENE] URL:', url)

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    console.log('[API SIRENE] Status HTTP:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API SIRENE] Erreur body:', errorText)
      throw new Error(`API Recherche Entreprises erreur: ${response.status}`)
    }

    const data = await response.json()
    const result = data.results?.[0]
    if (!result || result.siren !== siren) {
      throw new Error(`SIREN ${siren} non trouve dans l'API Recherche Entreprises`)
    }

    const siege = result.siege || {}

    const entreprise: EntrepriseInfo = {
      siren,
      denomination: result.nom_complet || result.nom_raison_sociale || 'Nom inconnu',
      forme_juridique: result.nature_juridique || 'N/A',
      adresse_complete: [
        siege.numero_voie,
        siege.type_voie,
        siege.libelle_voie,
      ]
        .filter(Boolean)
        .join(' '),
      code_postal: siege.code_postal || '',
      commune: siege.libelle_commune || '',
      tva_intracom: calculerTVAFrancaise(siren),
      statut_actif: result.etat_administratif === 'A',
    }

    // 3. Stocker dans le cache
    await supabase.from('entreprises_cache').upsert({
      siren,
      denomination: entreprise.denomination,
      forme_juridique: entreprise.forme_juridique,
      adresse_complete: entreprise.adresse_complete,
      code_postal: entreprise.code_postal,
      commune: entreprise.commune,
      tva_intracom: entreprise.tva_intracom,
      statut_actif: entreprise.statut_actif,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    console.log('[API SIRENE] Donnees cachees pour SIREN', siren)
    return entreprise
  } catch (error) {
    console.error('[API SIRENE] Erreur:', error)

    // Fallback : retourner cache expire si disponible
    if (cached) {
      console.log('[API SIRENE] Retour du cache expire en fallback')
      return mapCachedToEntreprise(cached)
    }

    throw error
  }
}

function mapCachedToEntreprise(cached: Record<string, unknown>): EntrepriseInfo {
  return {
    siren: cached.siren as string,
    denomination: cached.denomination as string,
    forme_juridique: cached.forme_juridique as string,
    adresse_complete: cached.adresse_complete as string,
    code_postal: cached.code_postal as string,
    commune: cached.commune as string,
    tva_intracom: cached.tva_intracom as string | null,
    statut_actif: cached.statut_actif as boolean,
  }
}
