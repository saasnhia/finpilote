import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateNumeroDoc } from '@/lib/documents/numerotation'
import { calculTotaux } from '@/lib/factures/calculs'
import type { LigneFacture } from '@/types'
import { sendEmail } from '@/lib/email-sender'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: abonnement, error: abonError } = await supabase
      .from('abonnements_recurrents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (abonError || !abonnement) return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 })

    const numero = await generateNumeroDoc('facture_recurrente', supabase, user.id)
    const totaux = calculTotaux(abonnement.lignes as LigneFacture[], 0, 0)

    const today = new Date().toISOString().split('T')[0]
    const echeance = new Date()
    echeance.setDate(echeance.getDate() + 30)

    const { data: document, error: docError } = await supabase
      .from('documents_commerciaux')
      .insert({
        user_id: user.id,
        type: 'facture_recurrente',
        numero,
        statut: 'brouillon',
        client_id: abonnement.client_id,
        client_nom: abonnement.client_nom,
        client_email: abonnement.client_email,
        lignes: abonnement.lignes,
        sous_total_ht: totaux.totalHT,
        remise_percent: 0,
        total_ht: totaux.totalHTApresRemise,
        total_tva: totaux.totalTVA,
        total_ttc: totaux.totalTTC,
        acompte: 0,
        date_emission: today,
        date_echeance: echeance.toISOString().split('T')[0],
        conditions_paiement: '30 jours',
        notes: `Facture générée automatiquement — Abonnement : ${abonnement.nom}`,
      })
      .select()
      .single()

    if (docError || !document) return NextResponse.json({ error: docError?.message ?? 'Erreur' }, { status: 500 })

    // Calcul prochaine facturation
    const prochaine = new Date(abonnement.prochaine_facturation)
    switch (abonnement.frequence) {
      case 'hebdo': prochaine.setDate(prochaine.getDate() + 7); break
      case 'mensuel': prochaine.setMonth(prochaine.getMonth() + 1); break
      case 'trimestriel': prochaine.setMonth(prochaine.getMonth() + 3); break
      case 'annuel': prochaine.setFullYear(prochaine.getFullYear() + 1); break
    }

    await supabase.from('abonnements_recurrents')
      .update({ prochaine_facturation: prochaine.toISOString().split('T')[0] })
      .eq('id', id)

    // Envoi email si email client renseigné
    if (abonnement.client_email) {
      void sendEmail({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
        to: [abonnement.client_email],
        subject: `Facture ${numero} — ${totaux.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
        html: `<p>Votre facture <strong>${numero}</strong> d'un montant de <strong>${totaux.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong> a été générée.</p>`,
      }).catch(() => { /* non-critical */ })
    }

    return NextResponse.json({ success: true, document, prochaine_facturation: prochaine.toISOString().split('T')[0] }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
