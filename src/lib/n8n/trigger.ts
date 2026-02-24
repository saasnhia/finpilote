/**
 * FinSoft → n8n : Déclencheurs sortants OPS FONDATEUR UNIQUEMENT
 *
 * Ces triggers servent exclusivement au monitoring du fondateur.
 * Les automatisations cabinet (matching, alertes, rappels) sont
 * implémentées nativement dans FinSoft — elles ne passent PAS par n8n.
 *
 * Fire-and-forget : timeout 5s, jamais bloquant pour la route appelante.
 */

const N8N_URL = process.env.N8N_URL
const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET

async function fireN8nWebhook(path: string, payload: Record<string, unknown>): Promise<void> {
  if (!N8N_URL) return // n8n non configuré → silent skip

  const url = `${N8N_URL}/webhook/${path}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (N8N_SECRET) headers['X-FinSoft-Secret'] = N8N_SECRET

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.warn(`[n8n ops] ${path} → HTTP ${res.status}`)
  } catch (err) {
    console.warn(`[n8n ops] ${path} → ${err instanceof Error ? err.message : 'erreur réseau'}`)
  }
}

// ─── OPS FONDATEUR ────────────────────────────────────────────────────────────

/**
 * Déclenché après chaque exécution du CRON de rappels email.
 * → Slack fondateur : résumé quotidien du CRON (ops-01-cron-monitoring)
 */
export async function triggerCronRappelsTermine(stats: {
  processed: number
  sent: number
  skipped: number
  failed: number
}): Promise<void> {
  await fireN8nWebhook('finsoft/cron-rappels-termine', {
    event: 'cron_rappels_termine',
    timestamp: new Date().toISOString(),
    ...stats,
  })
}

/**
 * Déclenché après la création d'un nouveau dossier cabinet.
 * → Slack fondateur : "🎉 Nouveau cabinet : {nom}" (ops-01-cron-monitoring)
 */
export async function triggerNouveauCabinet(data: {
  dossier_id: string
  nom: string
  siren?: string
  user_id: string
}): Promise<void> {
  await fireN8nWebhook('finsoft/nouveau-cabinet', {
    event: 'nouveau_cabinet',
    timestamp: new Date().toISOString(),
    ...data,
  })
}

/**
 * Déclenché depuis les catch des routes critiques en production.
 * → Slack fondateur : "🚨 Erreur critique {endpoint}" (ops-02-erreur-critique)
 */
export async function triggerErreurCritique(data: {
  endpoint: string
  message: string
  stack?: string
  user_id?: string
}): Promise<void> {
  await fireN8nWebhook('finsoft/erreur-critique', {
    event: 'erreur_critique',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    ...data,
  })
}

/**
 * Déclenché quand un lead remplit le formulaire de contact.
 * → Slack fondateur : "📥 Lead : {nom}, {email}" (ops-03-nouveau-lead)
 */
export async function triggerNouveauLead(data: {
  nom: string
  email: string
  message?: string
  source?: string
}): Promise<void> {
  await fireN8nWebhook('finsoft/nouveau-lead', {
    event: 'nouveau_lead',
    timestamp: new Date().toISOString(),
    ...data,
  })
}
