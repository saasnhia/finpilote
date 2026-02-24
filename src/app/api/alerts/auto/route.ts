import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/alerts/auto
 * CRON hebdomadaire (lundi 9h) — génère automatiquement les alertes KPI
 * pour tous les utilisateurs actifs.
 *
 * Authentification : Authorization: Bearer CRON_SECRET
 * Configuré dans vercel.json : { "path": "/api/alerts/auto", "schedule": "0 9 * * 1" }
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createClient()

  // Récupérer tous les users qui ont des données financières récentes (actifs)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: activeUsers, error: usersError } = await supabase
    .from('financial_data')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  // Dédupliquer les user_ids
  const uniqueUserIds = [...new Set((activeUsers || []).map(r => r.user_id as string))]

  if (uniqueUserIds.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: 'Aucun utilisateur actif' })
  }

  let processed = 0
  let totalGenerated = 0
  const errors: string[] = []

  for (const userId of uniqueUserIds) {
    try {
      // Appel interne : POST /api/alerts avec service role simulé
      // On utilise fetch vers l'API locale pour réutiliser la logique existante
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '').replace('https://', 'https://') || 'http://localhost:3000'
      const res = await fetch(`${req.nextUrl.origin}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Passer user_id via header interne (validé côté route)
          'X-Cron-User-Id': userId,
          'X-Cron-Secret': cronSecret || '',
        },
      })

      if (res.ok) {
        const data = await res.json() as { generated?: number }
        totalGenerated += data.generated ?? 0
        processed++
      }
    } catch (err) {
      errors.push(`${userId}: ${err instanceof Error ? err.message : 'erreur'}`)
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    total_generated: totalGenerated,
    errors: errors.length > 0 ? errors : undefined,
  })
}
