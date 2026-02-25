import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isChiftConfigured, validateChiftCompany } from '@/lib/integrations/chift'
import { requirePlanFeature, isAuthed } from '@/lib/auth/require-plan'

interface ConnectBody {
  chift_company_id: string
}

/**
 * POST /api/integrations/sage/connect
 * Enregistre le Chift company_id pour le cabinet.
 *
 * Prérequis : le cabinet a déjà connecté son Sage 50 sur app.chift.eu
 * et obtenu son company_id. FinSoft le stocke pour les syncs automatiques.
 */
export async function POST(request: Request) {
  const auth = await requirePlanFeature('sage_sync')
  if (!isAuthed(auth)) return auth

  const supabase = await createClient()

  if (!isChiftConfigured()) {
    return NextResponse.json({
      error: 'Chift non configuré — ajoutez CHIFT_API_KEY et CHIFT_CONSUMER_ID',
      configured: false,
    }, { status: 503 })
  }

  let body: ConnectBody
  try {
    body = await request.json() as ConnectBody
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { chift_company_id } = body
  if (!chift_company_id?.trim()) {
    return NextResponse.json({ error: 'chift_company_id manquant' }, { status: 400 })
  }

  // Valide l'ID auprès de l'API Chift avant de sauvegarder
  try {
    const company = await validateChiftCompany(chift_company_id.trim())
    if (!company) {
      return NextResponse.json(
        { error: 'ID Chift invalide — vérifiez votre Company ID sur app.chift.eu' },
        { status: 400 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur validation Chift'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const { error } = await supabase
    .from('integrations_erp')
    .upsert(
      {
        cabinet_id: auth.userId,
        provider: 'sage',
        config: { chift_company_id: chift_company_id.trim() },
        sync_status: 'idle',
        sync_error: null,
      },
      { onConflict: 'cabinet_id,provider' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, connected: true })
}
