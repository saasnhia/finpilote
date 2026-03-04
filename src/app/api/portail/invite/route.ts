import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email-sender'
import { escapeHtml } from '@/lib/utils/escape-html'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { client_id, client_email, client_nom, skip_email } = await req.json()
    if (!client_email || !client_nom) {
      return NextResponse.json({ error: 'Email et nom du client requis' }, { status: 400 })
    }

    // Upsert portail access
    const { data: portail, error } = await supabase
      .from('portail_acces')
      .upsert({
        cabinet_user_id: user.id,
        client_id: client_id ?? null,
        client_email: client_email.trim().toLowerCase(),
        client_nom: client_nom.trim(),
        actif: true,
      }, { onConflict: 'token' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://worthifast.vercel.app'
    const portalUrl = `${baseUrl}/portail/${portail.token}`

    // Send invitation email (skip if link-only mode)
    if (!skip_email) {
      await sendEmail({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
        to: [client_email.trim()],
        subject: `Votre espace collaboratif Worthifast — ${escapeHtml(client_nom)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
            <h2 style="color: #22D3A5;">Bienvenue sur votre espace client Worthifast</h2>
            <p>Bonjour <strong>${escapeHtml(client_nom)}</strong>,</p>
            <p>Votre cabinet comptable vous a invité à utiliser votre espace client sécurisé pour :</p>
            <ul>
              <li>📄 Déposer vos documents comptables</li>
              <li>📥 Recevoir vos factures et relevés</li>
              <li>💬 Communiquer directement avec votre cabinet</li>
            </ul>
            <a href="${portalUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#22D3A5;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
              Accéder à mon espace
            </a>
            <p style="margin-top:24px;font-size:12px;color:#666;">
              Lien sécurisé valable indéfiniment — ne partagez pas ce lien.<br/>
              <a href="${portalUrl}">${portalUrl}</a>
            </p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true, portail, portal_url: portalUrl })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
