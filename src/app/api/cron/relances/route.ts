import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFacturesEnRetard, calculNiveauRelance, genererEmailRelance } from '@/lib/relances/engine'
import { sendEmail } from '@/lib/email-sender'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch all users with active relances config
  const { data: configs } = await supabase
    .from('relances_config')
    .select('*')
    .eq('actif', true)

  if (!configs?.length) return NextResponse.json({ success: true, processed: 0 })

  let totalSent = 0
  const errors: string[] = []

  for (const config of configs) {
    try {
      const factures = await getFacturesEnRetard(config.user_id)

      for (const facture of factures) {
        if (!facture.client_email) continue

        const niveau = calculNiveauRelance(facture.jours_retard, config)

        // Check if we've already sent at this level recently (last 7 days)
        const since = new Date(Date.now() - 7 * 86400000).toISOString()
        const { count } = await supabase
          .from('relances_historique')
          .select('*', { count: 'exact', head: true })
          .eq('facture_id', facture.id)
          .eq('niveau', niveau)
          .gte('created_at', since)

        if ((count ?? 0) > 0) continue // Already sent this level recently

        const contenu = await genererEmailRelance(facture, niveau, config.ton, config.signature)

        const emailResult = await sendEmail({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@worthifast.app',
          to: [facture.client_email],
          subject: `Relance facture ${facture.numero_facture} — Niveau ${niveau}`,
          html: `<pre style="font-family:Arial;white-space:pre-wrap;">${contenu}</pre>`,
          text: contenu,
        })

        // Log
        await supabase.from('relances_historique').insert({
          facture_id: facture.id,
          user_id: config.user_id,
          niveau,
          email_destinataire: facture.client_email,
          contenu,
          statut: emailResult.success ? 'envoye' : 'erreur',
        })

        if (emailResult.success) totalSent++
      }
    } catch (e) {
      errors.push(`User ${config.user_id}: ${e instanceof Error ? e.message : 'Erreur'}`)
    }
  }

  return NextResponse.json({ success: true, processed: totalSent, errors })
}
