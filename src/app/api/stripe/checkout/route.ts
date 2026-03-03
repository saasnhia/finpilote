import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { PLANS } from '@/lib/stripe/plans'

/**
 * POST /api/stripe/checkout
 * Body: { plan_id: string, billing: 'monthly' | 'annual' }
 * Returns: { url: string } — Stripe Checkout Session URL
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json() as { plan_id?: string; billing?: string }
    const planKey = body.plan_id?.toUpperCase()
    const billing: 'monthly' | 'annual' = body.billing === 'annual' ? 'annual' : 'monthly'

    if (!planKey || !(planKey in PLANS)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const plan = PLANS[planKey]
    const priceId = billing === 'annual' ? plan.annual : plan.monthly

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID introuvable pour ce plan' }, { status: 400 })
    }

    // Check if user already has a Stripe customer ID
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    const origin = req.headers.get('origin') ?? 'https://finpilote.vercel.app'

    const customerField: Pick<Stripe.Checkout.SessionCreateParams, 'customer' | 'customer_email'> =
      existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email ?? undefined }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?welcome=true`,
      cancel_url:  `${origin}/#pricing`,
      metadata: { user_id: user.id, plan_id: planKey, billing },
      subscription_data: {
        trial_period_days: 30,
        metadata: { user_id: user.id, plan_id: planKey, billing },
      },
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      locale: 'fr',
      ...customerField,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
