'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header, Footer } from '@/components/layout'
import { Info } from 'lucide-react'
import { PricingPlans } from '@/components/PricingPlans'
import { useAuth } from '@/hooks/useAuth'

export default function PricingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [subscriptionRequired, setSubscriptionRequired] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('message') === 'subscription_required') {
        setSubscriptionRequired(true)
      }
    }
  }, [])

  const handleSubscribe = useCallback(async (planKey: string, billing: 'monthly' | 'annual') => {
    console.log('[pricing] handleSubscribe called', { planKey, billing, user: user?.id, authLoading })
    setError(null)

    // Wait for auth to resolve — don't proceed while loading
    if (authLoading) {
      console.log('[pricing] Auth still loading, ignoring click')
      return
    }

    // If not authenticated, redirect to login then come back
    if (!user) {
      console.log('[pricing] No user, redirecting to login')
      router.push('/login?redirect=/pricing')
      return
    }

    setSubscribing(planKey)

    try {
      console.log('[pricing] Calling /api/stripe/checkout…')
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planKey, billing }),
      })

      console.log('[pricing] Response status:', res.status)
      const data = await res.json() as { url?: string; error?: string }
      console.log('[pricing] Response data:', data)

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Erreur lors de la création du checkout')
        return
      }

      // Redirect to Stripe Checkout
      console.log('[pricing] Redirecting to Stripe:', data.url)
      window.location.href = data.url
    } catch (err) {
      console.error('[pricing] Fetch error:', err)
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSubscribing(null)
    }
  }, [user, authLoading, router])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {subscriptionRequired && (
          <div className="bg-emerald-600 text-white py-3 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
              <Info className="w-4 h-4 flex-shrink-0" />
              Bienvenue sur Worthifast&nbsp;! Choisissez votre plan pour accéder à votre espace.
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 py-3 px-4">
            <div className="max-w-7xl mx-auto text-center text-sm font-medium">
              {error}
            </div>
          </div>
        )}

        <PricingPlans
          defaultProfile={3}
          onSubscribe={handleSubscribe}
          subscribing={subscribing}
        />
      </main>

      <Footer />
    </div>
  )
}
