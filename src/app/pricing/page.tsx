// pricing v5 — PricingGrid shared component
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header, Footer } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { Info } from 'lucide-react'
import { PricingGrid } from '@/components/PricingGrid'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [subscriptionRequired, setSubscriptionRequired] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('message') === 'subscription_required') {
        setSubscriptionRequired(true)
      }
    }
  }, [])

  const handleSubscribe = async (planId: 'starter' | 'cabinet' | 'pro') => {
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }
    setSubscribing(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? 'Erreur lors de la création du paiement')
        setSubscribing(null)
      }
    } catch {
      toast.error('Erreur réseau')
      setSubscribing(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {subscriptionRequired && (
          <div className="bg-emerald-600 text-white py-3 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
              <Info className="w-4 h-4 flex-shrink-0" />
              Bienvenue sur FinSoft&nbsp;! Choisissez votre plan pour accéder à votre espace.
            </div>
          </div>
        )}

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900">
                Tarifs FinSoft
              </h1>
              <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                Hébergé en Europe · Données chiffrées · RGPD compliant
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <Info className="w-3.5 h-3.5" />
                Prix HT · TVA 20% applicable
              </div>
            </div>

            <PricingGrid onSubscribe={handleSubscribe} subscribing={subscribing} />

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
