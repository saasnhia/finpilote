import { NextRequest, NextResponse } from 'next/server'
import { triggerNouveauLead } from '@/lib/n8n/trigger'

/**
 * POST /api/contact
 * Formulaire de contact public — notifie le fondateur via n8n Slack (ops-03-nouveau-lead).
 * Pas d'authentification requise (formulaire public).
 *
 * Body : { nom: string, email: string, message?: string, source?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      nom?: string
      email?: string
      message?: string
      source?: string
    }

    const { nom, email, message, source } = body

    if (!nom?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Champs requis : nom, email' },
        { status: 400 }
      )
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    // Notifier le fondateur via n8n (fire-and-forget)
    void triggerNouveauLead({
      nom: nom.trim(),
      email: email.trim(),
      message: message?.trim(),
      source: source || 'site',
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
