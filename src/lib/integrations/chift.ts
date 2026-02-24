/**
 * Chift API — Connecteur Sage 50 (et autres logiciels comptables)
 * Documentation: https://app.chift.eu/docs
 *
 * Env vars required:
 *   CHIFT_API_KEY=<your-chift-api-key>
 *   CHIFT_CONSUMER_ID=<your-chift-consumer-id>
 */

const CHIFT_BASE = 'https://api.chift.eu'

export function isChiftConfigured(): boolean {
  return Boolean(process.env.CHIFT_API_KEY && process.env.CHIFT_CONSUMER_ID)
}

async function chiftFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${CHIFT_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.CHIFT_API_KEY}`,
      'X-Consumer-ID': process.env.CHIFT_CONSUMER_ID ?? '',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chift API ${path} — ${res.status}: ${text}`)
  }

  return res.json()
}

export interface ChiftCompany {
  id: string
  name: string
  siret?: string
  software: string  // 'sage50'|'cegid'|'quickbooks'
}

export interface ChiftInvoice {
  id: string
  number: string
  date: string
  dueDate: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'overdue'
  partnerId: string
  partnerName: string
}

export interface ChiftJournalEntry {
  id: string
  date: string
  reference: string
  lines: Array<{
    accountCode: string
    accountName: string
    debit: number
    credit: number
    label: string
  }>
}

/**
 * Valide un company ID Chift sans lever d'exception.
 * Retourne la company si trouvée, null si 404 (ID invalide).
 * Propage l'erreur pour tout autre statut HTTP.
 */
export async function validateChiftCompany(companyId: string): Promise<ChiftCompany | null> {
  const res = await fetch(`${CHIFT_BASE}/v1/companies/${encodeURIComponent(companyId)}`, {
    headers: {
      Authorization: `Bearer ${process.env.CHIFT_API_KEY}`,
      'X-Consumer-ID': process.env.CHIFT_CONSUMER_ID ?? '',
      Accept: 'application/json',
    },
  })

  if (res.status === 404) return null

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chift API /companies/${companyId} — ${res.status}: ${text}`)
  }

  return res.json() as Promise<ChiftCompany>
}

/** List all companies connected via Chift */
export async function listChiftCompanies(): Promise<ChiftCompany[]> {
  const data = await chiftFetch<{ data: ChiftCompany[] }>('/v1/companies')
  return data.data ?? []
}

/** Get invoices from a Sage 50 company */
export async function getChiftInvoices(
  companyId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<ChiftInvoice[]> {
  const params = new URLSearchParams({ companyId })
  if (dateFrom) params.append('dateFrom', dateFrom)
  if (dateTo) params.append('dateTo', dateTo)
  const data = await chiftFetch<{ data: ChiftInvoice[] }>(`/v1/invoices?${params}`)
  return data.data ?? []
}

/** Get journal entries (écritures) from Sage 50 */
export async function getChiftJournalEntries(
  companyId: string,
  dateFrom: string,
  dateTo: string
): Promise<ChiftJournalEntry[]> {
  const params = new URLSearchParams({ companyId, dateFrom, dateTo })
  const data = await chiftFetch<{ data: ChiftJournalEntry[] }>(`/v1/journal-entries?${params}`)
  return data.data ?? []
}

/** Get OAuth URL for connecting Sage 50 via Chift */
export function buildChiftConnectUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.CHIFT_API_KEY ?? '',
    redirect_uri: redirectUri,
    state,
    software: 'sage50',
  })
  return `${CHIFT_BASE}/oauth/authorize?${params}`
}
