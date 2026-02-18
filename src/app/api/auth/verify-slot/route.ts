import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserLimit, getUserLimitLabel } from '@/lib/auth/user-limit'
import type { Plan } from '@/lib/auth/check-plan'

const ACTIVE_WINDOW_MINUTES = 15
const activeWindow = () =>
  new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000).toISOString()

/** POST /api/auth/verify-slot
 * Body: { session_token: string }
 * Registers or refreshes a device session. Returns 429 if plan limit reached.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { session_token } = body
  if (!session_token || typeof session_token !== 'string') {
    return NextResponse.json({ error: 'session_token requis' }, { status: 400 })
  }

  // Get plan + limit
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, max_users')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'solo') as Plan
  const limit = getUserLimit(plan)

  // Check if our session already exists (returning ping)
  const { data: existingSession } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('session_token', session_token)
    .maybeSingle()

  if (existingSession) {
    // Just refresh last_active — no slot count check needed
    await supabase
      .from('user_sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('session_token', session_token)
  } else {
    // Count active sessions (excluding our new one)
    const { count } = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('last_active', activeWindow())

    const activeCount = count ?? 0

    if (limit !== null && activeCount >= limit) {
      return NextResponse.json({
        success: false,
        allowed: false,
        active: activeCount,
        limit,
        limitLabel: getUserLimitLabel(plan),
        plan,
        error: `Plan ${plan} plein — ${activeCount}/${limit} sessions actives`,
      }, { status: 429 })
    }

    // Insert new session
    await supabase.from('user_sessions').insert({
      user_id: user.id,
      session_token,
      last_active: new Date().toISOString(),
    })
  }

  // Count current active sessions for response
  const { count: currentCount } = await supabase
    .from('user_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('last_active', activeWindow())

  return NextResponse.json({
    success: true,
    allowed: true,
    active: currentCount ?? 1,
    limit: limit ?? Infinity,
    limitLabel: getUserLimitLabel(plan),
    plan,
  })
}

/** GET /api/auth/verify-slot
 * Returns current active session count and plan limit (no side effects).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, max_users')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'solo') as Plan
  const limit = getUserLimit(plan)

  const { count } = await supabase
    .from('user_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('last_active', activeWindow())

  return NextResponse.json({
    success: true,
    active: count ?? 0,
    limit: limit ?? Infinity,
    limitLabel: getUserLimitLabel(plan),
    plan,
  })
}

/** DELETE /api/auth/verify-slot
 * Body: { session_token: string }
 * Removes the session on logout.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { session_token } = body
  if (!session_token) {
    return NextResponse.json({ error: 'session_token requis' }, { status: 400 })
  }

  await supabase
    .from('user_sessions')
    .delete()
    .eq('session_token', session_token)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
