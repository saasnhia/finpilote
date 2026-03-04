import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { PLANS } from '@/lib/stripe/plans'
import { rateLimit } from '@/lib/utils/rate-limit'

/**
 * POST /api/stripe/checkout
 * Body: { plan_id: string, billing: 'monthly' | 'annual' }
 * Returns: { url: string } — Stripe Checkout Session URL
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    if (!rateLimit(`checkout:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json() as { plan_id?: string; billing?: string }
    const billing: 'monthly' | 'annual' = body.billing === 'annual' ? 'annual' : 'monthly'

    // Map legacy 3-plan IDs to real plan keys
    const PLAN_ALIASES: Record<string, string> = {
      CABINET: 'CABINET_ESSENTIEL',
      PRO: 'CABINET_PREMIUM',
    }
    const rawKey = body.plan_id?.toUpperCase()
    const planKey = rawKey ? (PLAN_ALIASES[rawKey] ?? rawKey) : undefined

    if (!planKey || !(planKey in PLANS)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const plan = PLANS[planKey]
    const priceId = billing === 'annual' ? plan.annual : plan.monthly

    if (!priceId) {
      console.error(`[checkout] Price ID missing for plan=${planKey} billing=${billing}. Check env var STRIPE_${planKey}_${billing.toUpperCase()}`)
      return NextResponse.json({ error: `Price ID introuvable pour le plan ${planKey} (${billing}). Vérifiez les variables d'environnement Stripe.` }, { status: 400 })
    }

    // Check if user already has a Stripe customer ID
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    const VALID_ORIGINS = [
      'https://worthifast.vercel.app',
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
    ].filter(Boolean)
    const clientOrigin = req.headers.get('origin')
    const origin = clientOrigin && VALID_ORIGINS.includes(clientOrigin)
      ? clientOrigin
      : 'https://worthifast.vercel.app'

    const customerField: Pick<Stripe.Checkout.SessionCreateParams, 'customer' | 'customer_email'> =
      existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email ?? undefined }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?welcome=true`,
      cancel_url:  `${origin}/pricing`,
      metadata: { user_id: user.id, plan_id: planKey, billing },
      subscription_data: {
        trial_period_days: plan.trial_days ?? 30,
        metadata: { user_id: user.id, plan_id: planKey, billing },
      },
      payment_method_collection: 'if_required',
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
