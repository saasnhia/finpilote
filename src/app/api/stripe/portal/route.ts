import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

/**
 * POST /api/stripe/portal
 * Crée une session Stripe Customer Portal et retourne l'URL de redirection.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Récupérer stripe_customer_id depuis la table subscriptions
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Aucun abonnement Stripe trouvé. Souscrivez d\'abord à un plan.' },
      { status: 404 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://worthifast.vercel.app'

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/dashboard/settings?tab=abonnement`,
  })

  return NextResponse.json({ url: session.url })
}
