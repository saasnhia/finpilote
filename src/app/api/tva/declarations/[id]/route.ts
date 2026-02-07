import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DeclarationTVA } from '@/types'

/**
 * GET /api/tva/declarations/[id]
 * Récupère une déclaration TVA avec ses lignes CA3
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch declaration
    const { data: declaration, error: fetchError } = await supabase
      .from('declarations_tva')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !declaration) {
      return NextResponse.json({ error: 'Déclaration non trouvée' }, { status: 404 })
    }

    // Fetch CA3 lines
    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_ca3')
      .select('*')
      .eq('declaration_id', id)
      .order('ligne_numero', { ascending: true })

    if (lignesError) {
      console.error('Error fetching CA3 lines:', lignesError)
    }

    return NextResponse.json({
      success: true,
      declaration,
      lignes: lignes || [],
    })
  } catch (error: any) {
    console.error('Error fetching declaration:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tva/declarations/[id]
 * Met à jour une déclaration TVA
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { statut, notes, date_validation, date_envoi, date_paiement } = body

    // Build update object
    const updates: Partial<DeclarationTVA> = {}
    if (statut !== undefined) updates.statut = statut
    if (notes !== undefined) updates.notes = notes
    if (date_validation !== undefined) updates.date_validation = date_validation
    if (date_envoi !== undefined) updates.date_envoi = date_envoi
    if (date_paiement !== undefined) updates.date_paiement = date_paiement

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    // Update declaration
    const { data: declaration, error: updateError } = await supabase
      .from('declarations_tva')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating declaration:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la déclaration' },
        { status: 500 }
      )
    }

    if (!declaration) {
      return NextResponse.json({ error: 'Déclaration non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ success: true, declaration })
  } catch (error: any) {
    console.error('Error updating declaration:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tva/declarations/[id]
 * Supprime une déclaration TVA (uniquement si statut = brouillon)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Check if declaration exists and is in 'brouillon' status
    const { data: declaration, error: fetchError } = await supabase
      .from('declarations_tva')
      .select('statut')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !declaration) {
      return NextResponse.json({ error: 'Déclaration non trouvée' }, { status: 404 })
    }

    if (declaration.statut !== 'brouillon') {
      return NextResponse.json(
        { error: 'Seules les déclarations en brouillon peuvent être supprimées' },
        { status: 403 }
      )
    }

    // Delete declaration (cascade will delete lignes_ca3)
    const { error: deleteError } = await supabase
      .from('declarations_tva')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting declaration:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la déclaration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting declaration:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
