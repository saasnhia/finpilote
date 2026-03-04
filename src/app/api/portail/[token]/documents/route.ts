import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email-sender'
import { escapeHtml } from '@/lib/utils/escape-html'

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
    const { supabase, portail } = await getPortailByToken(token)
    if (!portail) return NextResponse.json({ error: 'Portail introuvable' }, { status: 404 })

    const { data: documents, error } = await supabase
      .from('portail_documents')
      .select('*')
      .eq('portail_id', portail.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, documents: documents ?? [], portail })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { supabase, portail } = await getPortailByToken(token)
    if (!portail) return NextResponse.json({ error: 'Portail introuvable' }, { status: 404 })

    const { documentId, statut } = await req.json() as { documentId: string; statut: string }
    const validStatuts = ['en_attente', 'recu', 'traite', 'valide']
    if (!validStatuts.includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const { data: doc, error } = await supabase
      .from('portail_documents')
      .update({ statut })
      .eq('id', documentId)
      .eq('portail_id', portail.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, document: doc })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const { supabase, portail } = await getPortailByToken(token)
    if (!portail) return NextResponse.json({ error: 'Portail introuvable' }, { status: 404 })

    const body = await req.json()
    const { nom, url, type = 'autre', uploaded_by = 'client', commentaire } = body

    const { data: doc, error } = await supabase
      .from('portail_documents')
      .insert({
        portail_id: portail.id,
        nom: nom?.trim() ?? 'Document',
        url: url ?? null,
        type,
        uploaded_by,
        statut: 'en_attente',
        commentaire: commentaire?.trim() ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update last connection (non-critical, fire-and-forget)
    void (async () => { try { await supabase.from('portail_acces').update({ derniere_connexion: new Date().toISOString() }).eq('id', portail.id) } catch { /* non-critical */ } })()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://worthifast.vercel.app'

    // Notify cabinet if client uploaded
    if (uploaded_by === 'client') {
      const { data: cabinetUser } = await supabase.auth.admin
        .getUserById(portail.cabinet_user_id)
        .catch(() => ({ data: null }))

      if (cabinetUser?.user?.email) {
        void sendEmail({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
          to: [cabinetUser.user.email],
          subject: `Nouveau document déposé — ${escapeHtml(portail.client_nom)}`,
          html: `<p>${escapeHtml(portail.client_nom)} a déposé un nouveau document : <strong>${escapeHtml(nom ?? 'Document')}</strong>.</p>
                 <a href="${baseUrl}/portail/cabinet/${portail.client_id ?? portail.id}">Voir le portail</a>`,
        }).catch(() => {/* non-critical */})
      }
    }

    // Notify client if cabinet uploaded
    if (uploaded_by === 'cabinet' && portail.client_email && !portail.client_email.startsWith('portail+')) {
      void sendEmail({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
        to: [portail.client_email],
        subject: `Votre cabinet a partagé un document — Worthifast`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
          <h2 style="color: #22D3A5;">Nouveau document disponible</h2>
          <p>Bonjour <strong>${escapeHtml(portail.client_nom)}</strong>,</p>
          <p>Votre cabinet comptable a partagé un nouveau document : <strong>${escapeHtml(nom ?? 'Document')}</strong></p>
          <a href="${baseUrl}/portail/${portail.token}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#22D3A5;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
            Accéder à mon espace
          </a>
        </div>`,
      }).catch(() => {/* non-critical */})
    }

    return NextResponse.json({ success: true, document: doc }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
