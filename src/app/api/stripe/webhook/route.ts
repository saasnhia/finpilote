import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { PLANS, mapPlanKeyToProfilePlan } from '@/lib/stripe/plans'
import { generateTrialEndingEmail } from '@/emails/TrialEndingEmail'
import { sendEmail } from '@/lib/email-sender'
import type Stripe from 'stripe'

// Service-role client — bypasses RLS (safe for webhook server-side use only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  try {
    switch (event.type) {

      // ── Paiement initial réussi ──────────────────────────────────────────
      case 'checkout.session.completed': {
        const session        = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const userId         = session.metadata?.user_id
        // Backward-compatible: old sessions use metadata.plan, new use metadata.plan_id
        const rawPlanId      = session.metadata?.plan_id ?? session.metadata?.plan ?? 'STARTER'
        const profilePlan    = mapPlanKeyToProfilePlan(rawPlanId)

        if (!userId || !subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price'],
        })

        console.log('[webhook] subscription object:', JSON.stringify(subscription, null, 2))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawPeriodEnd = (subscription as any).current_period_end
          ?? subscription.items?.data?.[0]?.current_period_end
          ?? null

        const currentPeriodEnd = rawPeriodEnd
          ? new Date(Number(rawPeriodEnd) * 1000).toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              user_id:                userId,
              stripe_customer_id:     session.customer as string,
              stripe_subscription_id: subscriptionId,
              plan:                   profilePlan,
              status:                 subscription.status,
              current_period_end:     currentPeriodEnd,
            },
            { onConflict: 'user_id' }
          )

        if (error) {
          console.error('[webhook] Supabase upsert error:', JSON.stringify(error))
          throw new Error(`Supabase upsert failed: ${error.message}`)
        }

        console.log('[webhook] Subscription upserted for user:', userId)

        await supabaseAdmin
          .from('user_profiles')
          .update({ plan: profilePlan })
          .eq('id', userId)

        break
      }

      // ── Abonnement mis à jour (changement de plan, renouvellement…) ──────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const periodEndTs = sub.items.data[0]?.current_period_end ?? 0
        const periodEnd   = periodEndTs > 0 ? new Date(periodEndTs * 1000).toISOString() : null

        const rawPlanId   = (sub.metadata?.plan_id ?? sub.metadata?.plan ?? null) as string | null
        const profilePlan = rawPlanId ? mapPlanKeyToProfilePlan(rawPlanId) : null

        const updates: Record<string, string | null> = {
          status:             mapStripeStatus(sub.status),
          current_period_end: periodEnd,
        }
        if (profilePlan) updates.plan = profilePlan

        await supabaseAdmin
          .from('subscriptions')
          .update(updates)
          .eq('stripe_subscription_id', sub.id)

        if (profilePlan) {
          const { data: row } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .maybeSingle()
          if (row?.user_id) {
            await supabaseAdmin.from('user_profiles').update({ plan: profilePlan }).eq('id', row.user_id)
          }
        }

        break
      }

      // ── Abonnement annulé ───────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id)

        const { data: row } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()
        if (row?.user_id) {
          await supabaseAdmin.from('user_profiles').update({ plan: 'starter' }).eq('id', row.user_id)
        }

        break
      }

      // ── Paiement échoué ─────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        break
      }

      // ── Essai se terminant dans 7 jours ─────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription

        const { data: subRow } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()

        if (!subRow?.user_id) break

        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(subRow.user_id)
        const userEmail = userData?.user?.email
        if (!userEmail) break

        // Get user's first name
        const { data: profileData } = await supabaseAdmin
          .from('user_profiles')
          .select('prenom')
          .eq('id', subRow.user_id)
          .maybeSingle()
        const prenom = (profileData?.prenom as string) || ''

        // Get plan info from metadata
        const rawPlanId = (sub.metadata?.plan_id ?? 'STARTER') as string
        const planConfig = PLANS[rawPlanId.toUpperCase()]
        const planName = rawPlanId.replace(/_/g, ' ')
        const priceMonthly = planConfig?.price_monthly ?? 0

        // Trial end date
        const trialEnd = sub.trial_end
          ? new Date(sub.trial_end * 1000)
          : new Date(Date.now() + 7 * 86400000)
        const trialEndStr = trialEnd.toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric',
        })

        const { subject, html } = generateTrialEndingEmail({
          prenom,
          trialEndDate: trialEndStr,
          planName,
          priceMonthly,
          dashboardUrl: 'https://finpilote.vercel.app/dashboard',
          settingsUrl: 'https://finpilote.vercel.app/dashboard/settings?tab=abonnement',
        })

        await sendEmail({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@finpilote.app',
          to:   [userEmail],
          subject,
          html,
        }).catch(() => { /* fire-and-forget */ })

        break
      }

      default:
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
