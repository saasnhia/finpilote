import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ACTIVE_WINDOW_MINUTES = 15

/** GET /api/auth/sessions — list own active sessions */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000).toISOString()

  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('id, session_token, last_active, created_at')
    .eq('user_id', user.id)
    .gte('last_active', cutoff)
    .order('last_active', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, sessions: sessions ?? [] })
}
