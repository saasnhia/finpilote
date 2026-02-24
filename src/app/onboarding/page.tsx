'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

type ProfileType = 'cabinet' | 'entreprise'

interface ProfileOption {
  type: ProfileType
  emoji: string
  title: string
  tagline: string
  features: string[]
}

const OPTIONS: ProfileOption[] = [
  {
    type: 'cabinet',
    emoji: '🏢',
    title: 'Cabinet comptable',
    tagline: 'Je gère la comptabilité de mes clients',
    features: [
      'Multi-dossiers clients',
      'Balance âgée fournisseurs',
      'TVA par dossier',
      'Export FEC',
    ],
  },
  {
    type: 'entreprise',
    emoji: '📊',
    title: 'Entreprise / TPE / PME',
    tagline: 'Je gère la comptabilité de mon entreprise',
    features: [
      'Encours clients',
      'Factures fournisseurs',
      'Trésorerie temps réel',
      'Rapprochement bancaire',
    ],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<ProfileType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = async (type: ProfileType) => {
    setSelected(type)
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_type: type }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erreur lors de la sauvegarde')
        setLoading(false)
        setSelected(null)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Erreur réseau, veuillez réessayer')
      setLoading(false)
      setSelected(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-4">
      {/* Logo / brand */}
      <div className="mb-10 text-center">
        <span className="text-2xl font-display font-bold text-white tracking-tight">
          Fin<span className="text-[#22D3A5]">Soft</span>
        </span>
        <p className="mt-1 text-sm text-slate-400">Bienvenue ! Configurons votre espace.</p>
      </div>

      {/* Question */}
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-display font-bold text-white text-center mb-2">
          Vous êtes…
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          Votre tableau de bord s'adaptera à votre usage. Vous pourrez changer ce choix à tout moment.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300 text-center">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {OPTIONS.map(opt => {
            const isSelected = selected === opt.type
            const isLoading = loading && isSelected

            return (
              <button
                key={opt.type}
                disabled={loading}
                onClick={() => handleSelect(opt.type)}
                className={`
                  relative group text-left p-6 rounded-2xl border-2 transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3A5]
                  ${isSelected
                    ? 'border-[#22D3A5] bg-[#22D3A5]/10 shadow-lg shadow-[#22D3A5]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                  }
                  ${loading && !isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Emoji */}
                <div className="text-4xl mb-4">{opt.emoji}</div>

                {/* Title */}
                <h2 className={`text-lg font-display font-semibold mb-1 ${isSelected ? 'text-[#22D3A5]' : 'text-white'}`}>
                  {opt.title}
                </h2>

                {/* Tagline */}
                <p className="text-sm text-slate-300 mb-4">{opt.tagline}</p>

                {/* Features */}
                <ul className="space-y-1.5">
                  {opt.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22D3A5] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Loading spinner */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#0F172A]/60">
                    <Loader2 className="w-6 h-6 text-[#22D3A5] animate-spin" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Vous pourrez modifier ce choix dans{' '}
          <span className="text-slate-400">Paramètres → Mon profil FinSoft</span>
        </p>
      </div>
    </div>
  )
}
