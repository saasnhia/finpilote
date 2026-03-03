import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS pour supprimer le compte
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * DELETE /api/account/delete
 * Supprime le compte utilisateur (données + auth).
 * Requiert que l'utilisateur soit authentifié.
 */
export async function DELETE() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Supprimer le profil (cascade pour les autres tables si FK configurée)
  await adminClient.from('user_profiles').delete().eq('id', user.id)

  // Supprimer l'utilisateur auth
  const { error } = await adminClient.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
