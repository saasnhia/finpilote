/**
 * Cegid Loop Integration
 * OAuth2 client + API methods for écritures, plan de comptes, tiers, balance
 * Developer portal: https://developers.cegid.com
 *
 * Env vars required:
 *   CEGID_CLIENT_ID=<your-cegid-app-client-id>
 *   CEGID_CLIENT_SECRET=<your-cegid-app-client-secret>
 *   CEGID_REDIRECT_URI=https://worthifast.vercel.app/api/integrations/cegid/callback
 */

export const CEGID_CONFIG = {
  authorizationUrl: 'https://id.cegid.com/connect/authorize',
  tokenUrl: 'https://id.cegid.com/connect/token',
  apiBase: 'https://api.cegid.com/loop/v1',
  scopes: ['loop.accounting.read', 'loop.accounting.write', 'loop.masterdata.read'],
  clientId: process.env.CEGID_CLIENT_ID ?? '',
  clientSecret: process.env.CEGID_CLIENT_SECRET ?? '',
  redirectUri: process.env.CEGID_REDIRECT_URI ?? '',
}

export interface CegidTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface EcritureComptable {
  numeroEcriture: string
  dateEcriture: string
  compteDebit: string
  compteCredit: string
  montant: number
  libelle: string
  journalCode: string
  pieceRef?: string
}

export interface PlanComptesEntry {
  numero: string
  libelle: string
  type: 'actif' | 'passif' | 'charge' | 'produit' | 'capitaux'
}

export interface Tiers {
  code: string
  nom: string
  siren?: string
  tvaNumerо?: string
  email?: string
  adresse?: string
}

export interface BalanceLine {
  compte: string
  libelle: string
  debitCumul: number
  creditCumul: number
  solde: number
}

/** Build the OAuth2 authorization URL */
export function buildCegidAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CEGID_CONFIG.clientId,
    redirect_uri: CEGID_CONFIG.redirectUri,
    scope: CEGID_CONFIG.scopes.join(' '),
    state,
  })
  return `${CEGID_CONFIG.authorizationUrl}?${params.toString()}`
}

/** Exchange authorization code for tokens */
export async function exchangeCodeForTokens(code: string): Promise<CegidTokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: CEGID_CONFIG.redirectUri,
    client_id: CEGID_CONFIG.clientId,
    client_secret: CEGID_CONFIG.clientSecret,
  })

  const res = await fetch(CEGID_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cegid token exchange failed: ${err}`)
  }

  return res.json()
}

/** Refresh an expired access token */
export async function refreshCegidToken(refreshToken: string): Promise<CegidTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CEGID_CONFIG.clientId,
    client_secret: CEGID_CONFIG.clientSecret,
  })

  const res = await fetch(CEGID_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) throw new Error('Cegid token refresh failed')
  return res.json()
}

/** Wrapper for authenticated Cegid API calls with retry on rate-limit */
async function cegidFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const res = await fetch(`${CEGID_CONFIG.apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 429 && retries > 0) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '2') * 1000
    await new Promise(r => setTimeout(r, retryAfter))
    return cegidFetch<T>(path, accessToken, options, retries - 1)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cegid API ${path} — ${res.status}: ${text}`)
  }

  return res.json()
}

/** Export écritures comptables d'une période */
export async function exportEcritures(
  accessToken: string,
  dateDebut: string,
  dateFin: string
): Promise<EcritureComptable[]> {
  const params = new URLSearchParams({ dateDebut, dateFin, pageSize: '500' })
  const data = await cegidFetch<{ items: EcritureComptable[] }>(
    `/ecritures?${params}`,
    accessToken
  )
  return data.items ?? []
}

/** Importer le plan de comptes PCG */
export async function importPlanComptes(accessToken: string): Promise<PlanComptesEntry[]> {
  const data = await cegidFetch<{ items: PlanComptesEntry[] }>(
    '/plan-comptes',
    accessToken
  )
  return data.items ?? []
}

/** Synchroniser les tiers (clients & fournisseurs) */
export async function syncTiers(accessToken: string): Promise<Tiers[]> {
  const data = await cegidFetch<{ items: Tiers[] }>('/tiers', accessToken)
  return data.items ?? []
}

/** Récupérer la balance comptable */
export async function getBalance(
  accessToken: string,
  dateArrete: string
): Promise<BalanceLine[]> {
  const params = new URLSearchParams({ dateArrete })
  const data = await cegidFetch<{ lignes: BalanceLine[] }>(
    `/balance?${params}`,
    accessToken
  )
  return data.lignes ?? []
}

/** Check if credentials are configured */
export function isCegidConfigured(): boolean {
  return Boolean(CEGID_CONFIG.clientId && CEGID_CONFIG.clientSecret)
}
