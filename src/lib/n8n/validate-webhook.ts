import { NextRequest, NextResponse } from 'next/server'

/**
 * Valide le secret partagé X-N8N-Secret dans les webhooks entrants.
 * Retourne null si valide, sinon une réponse 401.
 */
export function validateN8nWebhook(req: NextRequest): NextResponse | null {
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (!secret) return null // secret non configuré → pas de vérification (dev local)

  const header = req.headers.get('x-n8n-secret')
  if (header !== secret) {
    return NextResponse.json({ error: 'Secret webhook invalide' }, { status: 401 })
  }
  return null
}
