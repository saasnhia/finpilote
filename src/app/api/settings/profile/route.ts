import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET — récupère le profil utilisateur */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_profiles')
    .select('profile_type, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    profile_type: data?.profile_type ?? 'cabinet',
    onboarding_completed: data?.onboarding_completed ?? true,
  })
}

/** POST — remet onboarding_completed = false pour changer de profil */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await supabase
    .from('user_profiles')
    .update({ onboarding_completed: false })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
