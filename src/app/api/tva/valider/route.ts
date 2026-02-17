import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validerTVAIntracom } from '@/lib/api/api-vies'

/**
 * POST /api/tva/valider
 * Valide un numero de TVA intracommunautaire via VIES
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifie' }, { status: 401 })
    }

    const body = await request.json()
    const { numero_tva } = body

    if (!numero_tva) {
      return NextResponse.json(
        { success: false, error: 'Numero TVA manquant' },
        { status: 400 }
      )
    }

    const validation = await validerTVAIntracom(numero_tva)

    return NextResponse.json({ success: true, validation })
  } catch (error: any) {
    const status = error.message?.includes('invalide') ? 400 : 500
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    )
  }
}
