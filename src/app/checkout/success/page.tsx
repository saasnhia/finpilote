'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

const POLL_INTERVAL_MS = 2500
const MAX_WAIT_MS = 45_000 // 45 seconds max

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'timeout'>('loading')
  const elapsed = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      if (cancelled) return

      if (elapsed.current >= MAX_WAIT_MS) {
        setStatus('timeout')
        return
      }

      try {
        const res = await fetch('/api/stripe/subscription-status')
        if (!res.ok) {
          // Not authenticated — redirect to login
          if (res.status === 401) {
            router.push('/login')
            return
          }
        } else {
          const data = await res.json() as { active: boolean }
          if (data.active) {
            setStatus('success')
            setTimeout(() => router.push('/dashboard'), 1200)
            return
          }
        }
      } catch {
        // Network error — retry
      }

      elapsed.current += POLL_INTERVAL_MS
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    }

    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [router])

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#22D3A5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#22D3A5]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Abonnement activé !</h1>
          <p className="text-slate-400 text-sm">Redirection vers votre tableau de bord…</p>
        </div>
      </div>
    )
  }

  // Auto-redirect to dashboard 8s after timeout (anti-boucle)
  useEffect(() => {
    if (status !== 'timeout') return
    const timer = setTimeout(() => router.push('/dashboard'), 8000)
    return () => clearTimeout(timer)
  }, [status, router])

  if (status === 'timeout') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Paiement en cours de traitement</h1>
          <p className="text-slate-400 text-sm mb-6">
            Votre paiement a été reçu. Redirection automatique dans quelques secondes…
          </p>
          <button
            onClick={() => {
              elapsed.current = 0
              setStatus('loading')
            }}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#22D3A5] text-[#0F172A] rounded-xl font-semibold text-sm hover:bg-[#22D3A5]/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2 block mx-auto"
          >
            Accéder au dashboard quand même
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#22D3A5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-[#22D3A5] animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Activation de votre compte…</h1>
        <p className="text-slate-400 text-sm">
          Paiement confirmé. Nous finalisons votre abonnement.
        </p>
        <p className="text-slate-600 text-xs mt-2">Cela prend généralement moins de 5 secondes.</p>
      </div>
    </div>
  )
}
