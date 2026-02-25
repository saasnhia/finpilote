import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import type Stripe from 'stripe'

// Service-role client — bypasses RLS (safe for webhook server-side use only)
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe events to keep the subscriptions table in sync.
 * Body must be read as raw text to verify the signature.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Signature invalide'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const supabase = getAdminClient()

  try {
    switch (event.type) {

      // ── Paiement initial réussi ──────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        const subscriptionId = session.subscription as string
        const userId         = session.metadata?.user_id
        const plan           = session.metadata?.plan ?? 'starter'

        if (!userId) break

        // Retrieve full subscription object to access current_period_end
        // In Stripe API 2026-01-28, current_period_end is on the SubscriptionItem
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const periodEndTs  = subscription.items.data[0]?.current_period_end ?? 0
        const periodEnd    = periodEndTs > 0 ? new Date(periodEndTs * 1000).toISOString() : null

        await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id:                userId,
              stripe_customer_id:     session.customer as string,
              stripe_subscription_id: subscriptionId,
              plan,
              status:                 subscription.status,
              current_period_end:     periodEnd,
            },
            { onConflict: 'user_id' }
          )

        // Sync plan into user_profiles
        await supabase
          .from('user_profiles')
          .update({ plan })
          .eq('id', userId)

        break
      }

      // ── Abonnement mis à jour (changement de plan, renouvellement…) ──────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const periodEndTs = sub.items.data[0]?.current_period_end ?? 0
        const periodEnd   = periodEndTs > 0 ? new Date(periodEndTs * 1000).toISOString() : null

        const plan = (sub.metadata?.plan ?? null) as string | null

        const updates: Record<string, string | null> = {
          status:             mapStripeStatus(sub.status),
          current_period_end: periodEnd,
        }
        if (plan) updates.plan = plan

        await supabase
          .from('subscriptions')
          .update(updates)
          .eq('stripe_subscription_id', sub.id)

        // Sync plan into user_profiles if plan changed
        if (plan) {
          const { data: row } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .maybeSingle()
          if (row?.user_id) {
            await supabase.from('user_profiles').update({ plan }).eq('id', row.user_id)
          }
        }

        break
      }

      // ── Abonnement annulé ───────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id)

        // Downgrade user_profiles to starter
        const { data: row } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()
        if (row?.user_id) {
          await supabase.from('user_profiles').update({ plan: 'starter' }).eq('id', row.user_id)
        }

        break
      }

      // ── Paiement échoué ─────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        break
      }

      default:
        // Unhandled event — return 200 so Stripe doesn't retry
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur webhook'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':    return 'active'
    case 'trialing':  return 'trialing'
    case 'past_due':  return 'past_due'
    case 'canceled':  return 'canceled'
    case 'incomplete':return 'incomplete'
    default:          return 'past_due'
  }
}
