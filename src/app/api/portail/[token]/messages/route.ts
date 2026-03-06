import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email-sender'
import { escapeHtml } from '@/lib/utils/escape-html'
import { rateLimit } from '@/lib/utils/rate-limit'

async function getPortailByToken(token: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('portail_acces')
    .select('*')
    .eq('token', token)
    .eq('actif', true)
    .single()
  return { supabase, portail: data }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    if (!rateLimit(`portail:${token}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }
    const { supabase, portail } = await getPortailByToken(token)
    if (!portail) return NextResponse.json({ error: 'Portail introuvable' }, { status: 404 })

    const { data: messages, error } = await supabase
      .from('portail_messages')
      .select('*')
      .eq('portail_id', portail.id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, messages: messages ?? [] })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    if (!rateLimit(`portail:${token}`, 15, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }
    const { supabase, portail } = await getPortailByToken(token)
    if (!portail) return NextResponse.json({ error: 'Portail introuvable' }, { status: 404 })

    const { expediteur, message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message requis' }, { status: 400 })

    const { data: msg, error } = await supabase
      .from('portail_messages')
      .insert({
        portail_id: portail.id,
        expediteur: expediteur?.trim() ?? 'Client',
        message: message.trim(),
        lu: false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update last connection (non-critical, fire-and-forget)
    void (async () => { try { await supabase.from('portail_acces').update({ derniere_connexion: new Date().toISOString() }).eq('id', portail.id) } catch { /* non-critical */ } })()

    // Notify the other party
    const isClient = expediteur !== 'Cabinet'
    if (isClient) {
      // Notify cabinet
      const { data: cabinetUser } = await supabase.auth.admin
        .getUserById(portail.cabinet_user_id)
        .catch(() => ({ data: null }))
      if (cabinetUser?.user?.email) {
        void sendEmail({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
          to: [cabinetUser.user.email],
          subject: `Nouveau message de ${escapeHtml(portail.client_nom)}`,
          html: `<p><strong>${escapeHtml(portail.client_nom)}</strong> vous a envoyé un message :</p><blockquote>${escapeHtml(message)}</blockquote>`,
        }).catch(() => {/* non-critical */})
      }
    } else {
      // Notify client
      void sendEmail({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
        to: [portail.client_email],
        subject: 'Nouveau message de votre cabinet',
        html: `<p>Votre cabinet vous a envoyé un message :</p><blockquote>${escapeHtml(message)}</blockquote>
               <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://worthifast.vercel.app'}/portail/${token}">Répondre</a>`,
      }).catch(() => {/* non-critical */})
    }

    return NextResponse.json({ success: true, message: msg }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
