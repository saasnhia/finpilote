import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email-sender'

const TYPE_LABELS: Record<string, string> = {
  devis: 'Devis',
  bon_commande: 'Bon de commande',
  bon_livraison: 'Bon de livraison',
  proforma: 'Facture proforma',
  avoir: 'Avoir',
  facture_recurrente: 'Facture',
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: document, error: docError } = await supabase
      .from('documents_commerciaux')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    if (!document.client_email) return NextResponse.json({ error: 'Pas d\'email pour ce client' }, { status: 400 })

    const typeLabel = TYPE_LABELS[document.type] ?? document.type
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://worthifast.vercel.app'

    const { message: customMessage } = await req.json().catch(() => ({ message: null }))

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a;">${typeLabel} — ${document.numero ?? 'Sans numéro'}</h2>
        ${customMessage ? `<p>${customMessage}</p>` : ''}
        <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #475569;">Montant HT</td><td style="padding: 8px; font-weight: bold;">${document.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td></tr>
          <tr><td style="padding: 8px; color: #475569;">TVA</td><td style="padding: 8px;">${document.total_tva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td></tr>
          <tr style="background:#f8fafc"><td style="padding: 8px; font-weight:bold;">Total TTC</td><td style="padding: 8px; font-weight: bold; color: #22d3a5;">${document.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td></tr>
          ${document.date_echeance ? `<tr><td style="padding: 8px; color: #475569;">Échéance</td><td style="padding: 8px;">${new Date(document.date_echeance).toLocaleDateString('fr-FR')}</td></tr>` : ''}
        </table>
        <p style="color: #64748b; font-size: 14px;">Conditions : ${document.conditions_paiement ?? '30 jours'}</p>
        <a href="${baseUrl}/commercial/${id}/print" style="display:inline-block; padding: 12px 24px; background: #22d3a5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Voir le document</a>
      </div>
    `

    const emailResult = await sendEmail({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
      to: [document.client_email],
      subject: `${typeLabel} ${document.numero ?? ''} — ${document.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
      html: emailHtml,
    })

    // Mise à jour statut + log
    await supabase.from('documents_commerciaux')
      .update({ statut: 'envoye', updated_at: new Date().toISOString() })
      .eq('id', id)

    void (async () => {
      try {
        await supabase.from('historique_documents').insert({
          document_id: id, user_id: user.id, action: 'envoi',
          details: { email: document.client_email, success: emailResult.success },
        })
      } catch { /* non-critical */ }
    })()

    return NextResponse.json({ success: true, sent: emailResult.success, provider: emailResult.provider })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
