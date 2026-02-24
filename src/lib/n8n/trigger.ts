/**
 * FinSoft → n8n : Déclencheurs sortants
 *
 * Chaque fonction envoie un événement au webhook n8n correspondant.
 * Si N8N_URL n'est pas défini ou si n8n est injoignable, l'erreur est loggée
 * sans faire crasher la route appelante (fire-and-forget).
 */

const N8N_URL = process.env.N8N_URL
const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET

async function fireN8nWebhook(path: string, payload: Record<string, unknown>): Promise<void> {
  if (!N8N_URL) return // n8n non configuré → silent skip

  const url = `${N8N_URL}/webhook/${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (N8N_SECRET) {
    headers['X-FinSoft-Secret'] = N8N_SECRET
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000), // 5s max
    })
    if (!res.ok) {
      console.warn(`[n8n trigger] ${path} → HTTP ${res.status}`)
    }
  } catch (err) {
    // Timeout ou n8n injoignable : ne pas bloquer la route principale
    console.warn(`[n8n trigger] ${path} → ${err instanceof Error ? err.message : 'erreur réseau'}`)
  }
}

// ─── Triggers ────────────────────────────────────────────────────────────────

/**
 * Déclenché après l'exécution du job CRON de rappels email.
 * n8n peut créer un ticket Notion, envoyer un rapport Slack, etc.
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
 * Déclenché après un rapport d'audit IA.
 * n8n peut archiver le rapport dans GDrive, notifier le cabinet, etc.
 */
export async function triggerAuditRapportGenere(data: {
  user_id: string
  anomalies_count: number
  rapport_resume?: string
}): Promise<void> {
  await fireN8nWebhook('finsoft/audit-rapport-genere', {
    event: 'audit_rapport_genere',
    timestamp: new Date().toISOString(),
    ...data,
  })
}

/**
 * Déclenché après la génération d'alertes (POST /api/alerts).
 * n8n peut envoyer un email récapitulatif, créer des tâches, etc.
 */
export async function triggerAlertesGenerees(data: {
  user_id: string
  generated: number
  critical_count?: number
}): Promise<void> {
  await fireN8nWebhook('finsoft/alertes-generees', {
    event: 'alertes_generees',
    timestamp: new Date().toISOString(),
    ...data,
  })
}

/**
 * Déclenché après la création d'un nouveau dossier cabinet.
 * n8n peut initialiser un dossier GDrive, envoyer un email de bienvenue, etc.
 */
export async function triggerNouveauDossier(data: {
  dossier_id: string
  nom: string
  siren?: string
  user_id: string
}): Promise<void> {
  await fireN8nWebhook('finsoft/nouveau-dossier', {
    event: 'nouveau_dossier',
    timestamp: new Date().toISOString(),
    ...data,
  })
}

/**
 * Déclenché après l'import d'un relevé bancaire CSV.
 * n8n peut déclencher un rapprochement automatique, notifier le comptable, etc.
 */
export async function triggerImportBancaireTermine(data: {
  user_id: string
  compte_id?: string
  transactions_imported: number
}): Promise<void> {
  await fireN8nWebhook('finsoft/import-bancaire-termine', {
    event: 'import_bancaire_termine',
    timestamp: new Date().toISOString(),
    ...data,
  })
}
