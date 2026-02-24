import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateN8nWebhook } from '@/lib/n8n/validate-webhook'

/**
 * POST /api/webhooks/n8n/nouveau-client
 * n8n notifie FinSoft qu'un nouveau client a été créé (CRM, formulaire web, etc.)
 *
 * Body attendu :
 * {
 *   user_id: string
 *   nom: string
 *   email?: string
 *   telephone?: string
 *   siret?: string
 *   adresse?: string
 *   ville?: string
 *   code_postal?: string
 *   pays?: string
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  const authError = validateN8nWebhook(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { user_id, nom, email, telephone, siret, adresse, ville, code_postal, pays, notes } = body

    if (!user_id || !nom?.trim()) {
      return NextResponse.json(
        { error: 'Champs requis : user_id, nom' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id,
        nom: nom.trim(),
        email: email || null,
        telephone: telephone || null,
        siret: siret || null,
        adresse: adresse || null,
        ville: ville || null,
        code_postal: code_postal || null,
        pays: pays || 'France',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      // Doublon email → 409
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Client déjà existant (doublon email/SIRET)' }, { status: 409 })
      }
      console.error('[webhook/nouveau-client] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, client: data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
