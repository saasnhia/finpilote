import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/webhooks/n8n/status
 * Endpoint de santé pour vérifier que FinSoft est joignable depuis n8n.
 * Pas d'authentification requise (ping public).
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'FinSoft',
    timestamp: new Date().toISOString(),
    webhooks: [
      'POST /api/webhooks/n8n/facture-recue',
      'POST /api/webhooks/n8n/sync-cegid',
      'POST /api/webhooks/n8n/sync-sage',
      'POST /api/webhooks/n8n/nouveau-client',
    ],
    n8n_secret_configured: !!process.env.N8N_WEBHOOK_SECRET,
  })
}
