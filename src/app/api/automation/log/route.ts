import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/automation/log
 * Dernières actions automatiques de l'utilisateur
 * Query params: limit (default 50), offset (default 0), action_type (optional filter)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const actionType = searchParams.get('action_type') // optional filter

    let query = supabase
      .from('automation_log')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    const { data: logs, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs ?? [],
      total: count ?? 0,
      limit,
      offset,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
