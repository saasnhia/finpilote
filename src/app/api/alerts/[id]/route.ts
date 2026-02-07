import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/alerts/[id]
 * Récupérer détails d'une alerte
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: alert, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Alerte non trouvée' }, { status: 404 })
    }

    // Mark as viewed if new
    if (alert.statut === 'nouvelle') {
      await supabase
        .from('alerts')
        .update({ statut: 'vue' })
        .eq('id', id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true, alert })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}

/**
 * PUT /api/alerts/[id]
 * Marquer alerte comme résolue/ignorée + ajouter notes
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { statut, notes } = body as { statut?: string; notes?: string }

    const updateData: Record<string, unknown> = {}
    if (statut) {
      if (!['vue', 'resolue', 'ignoree'].includes(statut)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
      }
      updateData.statut = statut
      if (statut === 'resolue' || statut === 'ignoree') {
        updateData.resolved_at = new Date().toISOString()
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}
