import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body: unknown = await request.json()
  if (
    typeof body !== 'object' ||
    body === null ||
    !('profile_type' in body) ||
    (body.profile_type !== 'cabinet' && body.profile_type !== 'entreprise')
  ) {
    return NextResponse.json(
      { error: 'profile_type doit être "cabinet" ou "entreprise"' },
      { status: 400 }
    )
  }

  const { profile_type } = body as { profile_type: 'cabinet' | 'entreprise' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ profile_type, onboarding_completed: true })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile_type })
}
