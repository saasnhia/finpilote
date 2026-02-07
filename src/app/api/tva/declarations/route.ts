import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TVADeclarationsListResponse } from '@/types'

/**
 * GET /api/tva/declarations
 * Liste toutes les déclarations TVA de l'utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch declarations
    const { data: declarations, error: fetchError } = await supabase
      .from('declarations_tva')
      .select('*')
      .eq('user_id', user.id)
      .order('periode_debut', { ascending: false })

    if (fetchError) {
      console.error('Error fetching declarations:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des déclarations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      declarations: declarations || [],
    } as TVADeclarationsListResponse)
  } catch (error: any) {
    console.error('Error fetching declarations:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
