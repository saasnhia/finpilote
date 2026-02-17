import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmailTemplate, getAutoRappelType } from '@/lib/email-templates'
import { sendEmail } from '@/lib/email-sender'

/**
 * GET /api/notifications/cron
 * Job CRON quotidien : détecte les factures en retard et envoie les rappels automatiques.
 *
 * Sécurité : vérifie le header Authorization avec CRON_SECRET.
 * Configuré via vercel.json pour exécution quotidienne.
 */
export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification CRON
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabase = await createClient()

    // 1. Récupérer toutes les factures non payées en retard (tous utilisateurs)
    // Note: on utilise un service role ici en production ; en dev on fait une query directe
    const { data: factures, error: fetchError } = await supabase
      .from('factures_clients')
      .select('*, client:clients(*)')
      .in('statut_paiement', ['en_attente', 'en_retard', 'partiellement_payee'])
      .lt('date_echeance', new Date().toISOString().split('T')[0])

    if (fetchError) {
      return NextResponse.json({ error: 'Erreur lecture factures: ' + fetchError.message }, { status: 500 })
    }

    if (!factures || factures.length === 0) {
      return NextResponse.json({ success: true, processed: 0, sent: 0, message: 'Aucune facture en retard' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let sent = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    for (const facture of factures) {
      const client = facture.client
      if (!client?.email) {
        skipped++
        continue
      }

      const echeance = new Date(facture.date_echeance)
      const joursRetard = Math.floor((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24))

      if (joursRetard <= 0) {
        skipped++
        continue
      }

      // Ne pas renvoyer un rappel si on en a envoyé un dans les 5 derniers jours
      if (facture.date_dernier_rappel) {
        const dernierRappel = new Date(facture.date_dernier_rappel)
        const joursSinceDernierRappel = Math.floor(
          (today.getTime() - dernierRappel.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (joursSinceDernierRappel < 5) {
          skipped++
          continue
        }
      }

      // Déterminer le type de rappel auto
      const typeRappel = getAutoRappelType(joursRetard)

      // Récupérer le profil de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', facture.user_id)
        .single()

      const nomEntreprise = profile?.company_name || profile?.full_name || 'Votre fournisseur'
      const montantRestant = facture.montant_ttc - facture.montant_paye
      const formatEuro = (n: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

      const template = generateEmailTemplate(typeRappel, {
        nom_client: client.nom,
        nom_entreprise: nomEntreprise,
        numero_facture: facture.numero_facture,
        montant_ttc: formatEuro(facture.montant_ttc),
        montant_restant: formatEuro(montantRestant),
        date_echeance: facture.date_echeance,
        jours_retard: joursRetard,
        objet: facture.objet || undefined,
      })

      // Envoyer l'email (Resend ou SMTP selon config)
      const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'rappels@finsoft.local'
      const emailResult = await sendEmail({
        from: `${nomEntreprise} <${fromEmail}>`,
        to: [client.email],
        subject: template.sujet,
        html: template.html,
        text: template.contenu,
      })

      if (!emailResult.success) {
        failed++
        errors.push(`${facture.numero_facture}: ${emailResult.error}`)

        await supabase.from('rappels_email').insert({
          user_id: facture.user_id,
          facture_client_id: facture.id,
          client_id: client.id,
          type_rappel: typeRappel,
          email_destinataire: client.email,
          sujet: template.sujet,
          contenu: template.contenu,
          statut_envoi: 'echoue',
          erreur: emailResult.error,
        })
        continue
      }

      // Succès
      sent++

      await supabase.from('rappels_email').insert({
        user_id: facture.user_id,
        facture_client_id: facture.id,
        client_id: client.id,
        type_rappel: typeRappel,
        email_destinataire: client.email,
        sujet: template.sujet,
        contenu: template.contenu,
        statut_envoi: 'envoye',
        resend_message_id: emailResult.messageId,
      })

      await supabase
        .from('factures_clients')
        .update({
          statut_paiement: 'en_retard',
          nombre_rappels_envoyes: facture.nombre_rappels_envoyes + 1,
          date_dernier_rappel: new Date().toISOString(),
        })
        .eq('id', facture.id)
    }

    return NextResponse.json({
      success: true,
      processed: factures.length,
      sent,
      skipped,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}
