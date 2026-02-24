import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * PATCH /api/factures/[id]
 * Met à jour les champs comptables d'une facture :
 * compte_comptable, code_tva, categorie
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json() as {
      compte_comptable?: string
      code_tva?: string
      categorie?: string
    }

    const updates: Record<string, unknown> = {}
    if (body.compte_comptable !== undefined) updates.compte_comptable = body.compte_comptable
    if (body.code_tva !== undefined) updates.code_tva = body.code_tva
    if (body.categorie !== undefined) updates.categorie = body.categorie

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const { data: facture, error } = await supabase
      .from('factures')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ success: true, facture })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
