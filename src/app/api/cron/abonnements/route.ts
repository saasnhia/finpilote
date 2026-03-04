import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateNumeroDoc } from '@/lib/documents/numerotation'
import { calculTotaux } from '@/lib/factures/calculs'
import { sendEmail } from '@/lib/email-sender'
import type { LigneFacture } from '@/types'

export async function GET(req: NextRequest) {
  // Sécurité : CRON_SECRET Bearer auth
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  try {
    // Récupérer tous les abonnements actifs dont prochaine_facturation <= aujourd'hui
    const { data: abonnements, error: fetchError } = await supabase
      .from('abonnements_recurrents')
      .select('*')
      .eq('actif', true)
      .lte('prochaine_facturation', today)

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!abonnements?.length) return NextResponse.json({ success: true, processed: 0 })

    let processed = 0
    let errors = 0

    for (const abonnement of abonnements) {
      try {
        const userId = abonnement.user_id
        const numero = await generateNumeroDoc('facture_recurrente', supabase, userId)
        const totaux = calculTotaux(abonnement.lignes as LigneFacture[], 0, 0)

        const echeance = new Date()
        echeance.setDate(echeance.getDate() + 30)

        await supabase.from('documents_commerciaux').insert({
          user_id: userId,
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
          notes: `Facture récurrente — ${abonnement.nom}`,
        })

        // Mise à jour prochaine facturation
        const prochaine = new Date(abonnement.prochaine_facturation)
        switch (abonnement.frequence) {
          case 'hebdo': prochaine.setDate(prochaine.getDate() + 7); break
          case 'mensuel': prochaine.setMonth(prochaine.getMonth() + 1); break
          case 'trimestriel': prochaine.setMonth(prochaine.getMonth() + 3); break
          case 'annuel': prochaine.setFullYear(prochaine.getFullYear() + 1); break
        }

        await supabase.from('abonnements_recurrents')
          .update({ prochaine_facturation: prochaine.toISOString().split('T')[0] })
          .eq('id', abonnement.id)

        // Email client
        if (abonnement.client_email) {
          await sendEmail({
            from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
            to: [abonnement.client_email],
            subject: `Facture ${numero} — ${totaux.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
            html: `<p>Votre facture <strong>${numero}</strong> d'un montant de <strong>${totaux.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong> a été générée.</p>`,
          }).catch(() => { /* non-critical */ })
        }

        processed++
      } catch {
        errors++
      }
    }

    return NextResponse.json({ success: true, processed, errors, total: abonnements.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur cron' }, { status: 500 })
  }
}
