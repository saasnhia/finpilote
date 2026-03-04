import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-sender'
import { escapeHtml } from '@/lib/utils/escape-html'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nom, cabinet, email, message } = body as Record<string, string>

    if (!nom?.trim() || !email?.trim() || !cabinet?.trim()) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    await sendEmail({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
      to: ['harounchikh71@gmail.com'],
      subject: `Demande cabinet — ${escapeHtml(cabinet)} (${escapeHtml(nom)})`,
      html: `
        <h2>Nouvelle demande cabinet Worthifast</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
          <tr><td style="padding:8px 16px 8px 0;font-weight:600;color:#64748B">Nom</td><td style="padding:8px 0">${escapeHtml(nom)}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;font-weight:600;color:#64748B">Cabinet</td><td style="padding:8px 0">${escapeHtml(cabinet)}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;font-weight:600;color:#64748B">Email</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${message?.trim() ? `<tr><td style="padding:8px 16px 8px 0;font-weight:600;color:#64748B;vertical-align:top">Message</td><td style="padding:8px 0;white-space:pre-line">${escapeHtml(message)}</td></tr>` : ''}
        </table>
        <p style="margin-top:24px;color:#94A3B8;font-size:12px">Envoyé depuis worthifast.vercel.app — formulaire contact cabinet</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('Contact cabinet error:', e)
    return NextResponse.json({ error: 'Erreur envoi' }, { status: 500 })
  }
}
