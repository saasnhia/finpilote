import { NextRequest, NextResponse } from 'next/server'
import { triggerErreurCritique } from '@/lib/n8n/trigger'

/**
 * POST /api/ops/error
 * Endpoint interne OPS FONDATEUR — signale une erreur critique en production.
 * Déclenche une alerte Slack via n8n (ops-02-erreur-critique).
 *
 * Authentification : Authorization: Bearer CRON_SECRET (secret interne)
 *
 * Body : { endpoint: string, message: string, stack?: string, user_id?: string }
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await req.json() as {
      endpoint?: string
      message?: string
      stack?: string
      user_id?: string
    }

    const { endpoint, message, stack, user_id } = body

    if (!endpoint || !message) {
      return NextResponse.json(
        { error: 'Champs requis : endpoint, message' },
        { status: 400 }
      )
    }

    await triggerErreurCritique({ endpoint, message, stack, user_id })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
