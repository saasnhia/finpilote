import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeFournisseur, PCG_COMPTES } from '@/lib/categorization/matcher'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * PUT /api/categorization/rules/[id]
 * Met à jour une règle (champs modifiables ou toggle is_active)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json() as {
      fournisseur_display?: string
      compte_comptable?: string
      code_tva?: string
      categorie?: string
      is_active?: boolean
    }

    const updates: Record<string, unknown> = {}

    if (body.fournisseur_display !== undefined) {
      updates.fournisseur_display = body.fournisseur_display
      updates.fournisseur_pattern = normalizeFournisseur(body.fournisseur_display)
    }
    if (body.compte_comptable !== undefined) {
      updates.compte_comptable = body.compte_comptable
      updates.compte_label = PCG_COMPTES[body.compte_comptable] ?? null
    }
    if (body.code_tva !== undefined) updates.code_tva = body.code_tva
    if (body.categorie !== undefined) updates.categorie = body.categorie
    if (body.is_active !== undefined) updates.is_active = body.is_active

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const { data: rule, error } = await supabase
      .from('categorization_rules')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Règle introuvable' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * DELETE /api/categorization/rules/[id]
 * Supprime une règle
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { error } = await supabase
      .from('categorization_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
