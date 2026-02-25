'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  plan: 'starter' | 'cabinet' | 'pro'
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  current_period_end: string | null
}

interface UseSubscriptionResult {
  subscription: Subscription | null
  loading: boolean
  isActive: boolean
}

/**
 * Returns the user's current Stripe subscription from the `subscriptions` table.
 * `isActive` is true when status is 'active' or 'trialing'.
 */
export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log('[useSubscription] subscription data:', data)
      setSubscription(data as Subscription | null)
      setLoading(false)
    }

    fetch()
  }, [user])

  const isActive = subscription?.status === 'active'

  console.log('[useSubscription] isActive:', isActive, '| status:', subscription?.status)

  return { subscription, loading, isActive }
}
