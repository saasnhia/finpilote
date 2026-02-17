import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmailTemplate, getAutoRappelType } from '@/lib/email-templates'
import { sendEmail } from '@/lib/email-sender'
import type { TypeRappel } from '@/types'

/**
 * POST /api/notifications/send-reminder
 * Envoyer un email de rappel de paiement
 *
 * Body: { facture_client_id: string, type_rappel?: TypeRappel }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { facture_client_id, type_rappel: typeOverride } = body

    if (!facture_client_id) {
      return NextResponse.json({ error: 'facture_client_id requis' }, { status: 400 })
    }

    // 1. Récupérer la facture avec le client
    const { data: facture } = await supabase
      .from('factures_clients')
      .select('*, client:clients(*)')
      .eq('id', facture_client_id)
      .eq('user_id', user.id)
      .single()

    if (!facture) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    const client = facture.client
    if (!client?.email) {
      return NextResponse.json({
        error: 'Le client n\'a pas d\'adresse email renseignée',
      }, { status: 400 })
    }

    // 2. Calculer jours de retard et type de rappel
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const echeance = new Date(facture.date_echeance)
    const joursRetard = Math.max(0, Math.floor((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24)))

    const typeRappel: TypeRappel = typeOverride || getAutoRappelType(joursRetard)

    // 3. Récupérer le profil utilisateur pour le nom de l'entreprise
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', user.id)
      .single()

    const nomEntreprise = profile?.company_name || profile?.full_name || 'Votre fournisseur'

    // 4. Générer le template email
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

    // 5. Envoyer l'email (Resend cloud ou SMTP on-premise)
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'rappels@finsoft.local'
    const emailResult = await sendEmail({
      from: `${nomEntreprise} <${fromEmail}>`,
      to: [client.email],
      subject: template.sujet,
      html: template.html,
      text: template.contenu,
    })

    const resendMessageId = emailResult.messageId
    const statutEnvoi: 'envoye' | 'echoue' = emailResult.success ? 'envoye' : 'echoue'
    const erreur = emailResult.error

    // 6. Enregistrer le rappel dans la base
    const { data: rappel, error: insertError } = await supabase
      .from('rappels_email')
      .insert({
        user_id: user.id,
        facture_client_id: facture.id,
        client_id: client.id,
        type_rappel: typeRappel,
        email_destinataire: client.email,
        sujet: template.sujet,
        contenu: template.contenu,
        statut_envoi: statutEnvoi,
        resend_message_id: resendMessageId,
        erreur,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur enregistrement rappel:', insertError)
    }

    // 7. Mettre à jour la facture (compteur de rappels)
    await supabase
      .from('factures_clients')
      .update({
        nombre_rappels_envoyes: facture.nombre_rappels_envoyes + 1,
        date_dernier_rappel: new Date().toISOString(),
      })
      .eq('id', facture.id)
      .eq('user_id', user.id)

    if (statutEnvoi === 'echoue') {
      return NextResponse.json({
        success: false,
        error: `Échec envoi email: ${erreur}`,
        rappel,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, rappel })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 })
  }
}
