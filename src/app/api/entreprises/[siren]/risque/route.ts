import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSolvabilite } from '@/lib/api/api-fiben'

/**
 * GET /api/entreprises/[siren]/risque
 * Retourne le score de solvabilite d'un fournisseur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siren: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifie' }, { status: 401 })
    }

    const { siren } = await params

    const score = await checkSolvabilite(siren)

    return NextResponse.json({ success: true, score })
  } catch (error: any) {
    const status = error.message?.includes('invalide') ? 400 : 500
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    )
  }
}
