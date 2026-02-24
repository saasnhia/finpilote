import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateN8nWebhook } from '@/lib/n8n/validate-webhook'

/**
 * POST /api/webhooks/n8n/facture-recue
 * n8n notifie FinSoft qu'une facture fournisseur a été reçue (via email, Dropbox, etc.)
 *
 * Body attendu :
 * {
 *   fournisseur: string
 *   numero_facture: string
 *   montant_ttc: number
 *   date_facture: string       // ISO date "YYYY-MM-DD"
 *   fichier_url?: string
 *   notes?: string
 *   user_id: string            // Identifiant FinSoft de l'utilisateur cible
 * }
 */
export async function POST(req: NextRequest) {
  const authError = validateN8nWebhook(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { fournisseur, numero_facture, montant_ttc, date_facture, fichier_url, notes, user_id } = body

    if (!fournisseur || !montant_ttc || !date_facture || !user_id) {
      return NextResponse.json(
        { error: 'Champs requis : fournisseur, montant_ttc, date_facture, user_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('factures')
      .insert({
        user_id,
        fournisseur,
        numero_facture: numero_facture || null,
        montant_ttc: Number(montant_ttc),
        date_facture,
        fichier_url: fichier_url || `https://n8n.import/${Date.now()}`,
        statut: 'en_attente',
        notes: notes || null,
        source: 'n8n',
      })
      .select()
      .single()

    if (error) {
      console.error('[webhook/facture-recue] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, facture: data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
