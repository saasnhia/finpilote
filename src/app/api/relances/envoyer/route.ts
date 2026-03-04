import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFacturesEnRetard, genererEmailRelance } from '@/lib/relances/engine'
import { sendEmail } from '@/lib/email-sender'
import { escapeHtml } from '@/lib/utils/escape-html'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { facture_id, niveau } = await req.json() as { facture_id: string; niveau: 1 | 2 | 3 }
    if (!facture_id || !niveau) return NextResponse.json({ error: 'facture_id et niveau requis' }, { status: 400 })

    const { data: configRow } = await supabase
      .from('relances_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const config = configRow ?? { actif: false, delai_j1: 7, delai_j2: 15, delai_j3: 30, ton: 'cordial', signature: null }

    const factures = await getFacturesEnRetard(user.id)
    const facture = factures.find(f => f.id === facture_id)
    if (!facture) return NextResponse.json({ error: 'Facture introuvable ou non en retard' }, { status: 404 })
    if (!facture.client_email) return NextResponse.json({ error: 'Pas d\'email pour ce client' }, { status: 400 })

    const contenu = await genererEmailRelance(facture, niveau, config.ton, config.signature)

    const emailResult = await sendEmail({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
      to: [facture.client_email],
      subject: `Relance facture ${facture.numero_facture} — Niveau ${niveau}`,
      html: `<pre style="font-family:Arial;white-space:pre-wrap;">${escapeHtml(contenu)}</pre>`,
      text: contenu,
    })

    await supabase.from('relances_historique').insert({
      facture_id: facture.id,
      user_id: user.id,
      niveau,
      email_destinataire: facture.client_email,
      contenu,
      statut: emailResult.success ? 'envoye' : 'erreur',
    })

    return NextResponse.json({ success: true, sent: emailResult.success, provider: emailResult.provider })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
