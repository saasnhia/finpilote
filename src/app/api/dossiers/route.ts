import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { triggerNouveauDossier } from '@/lib/n8n/trigger'

/** GET /api/dossiers — liste les dossiers de l'utilisateur */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabase
    .from('dossiers')
    .select('id, nom, siren, secteur, email, actif, created_at')
    .eq('user_id', user.id)
    .eq('actif', true)
    .order('nom')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, dossiers: data ?? [] })
}

/** POST /api/dossiers — créer un nouveau dossier */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { nom, siren, secteur, regime_tva, email, telephone, notes } = body

  if (!nom?.trim()) {
    return NextResponse.json({ error: 'Le nom du dossier est requis' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('dossiers')
    .insert({ user_id: user.id, nom: nom.trim(), siren, secteur, regime_tva, email, telephone, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifier n8n (fire-and-forget)
  void triggerNouveauDossier({ dossier_id: data.id, nom: data.nom, siren: data.siren, user_id: user.id })

  return NextResponse.json({ success: true, dossier: data }, { status: 201 })
}
