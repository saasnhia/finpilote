'use client'

import { useEffect, useState } from 'react'
import { Header, Footer } from '@/components/layout'
import {
  CheckCircle2,
  ChevronRight,
  Users,
  Building2,
  Zap,
  Clock,
  Lock,
  Info,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FeatureRow =
  | { type: 'included'; label: string }
  | { type: 'locked'; label: string; requiredPlan: string }
  | { type: 'soon'; label: string; note: string }

interface Plan {
  id: 'starter' | 'cabinet' | 'pro'
  name: string
  tagline: string
  priceAnnual: number
  priceMonthly: number
  popular: boolean
  icon: React.ReactNode
  accentBorder: string
  iconBg: string
  priceColor: string
  ctaClass: string
  ctaLabel: string
  features: FeatureRow[]
  mailSubject: string
}

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Indépendant · TPE · Micro-entrepreneur',
    priceAnnual: 290,
    priceMonthly: 24,
    popular: false,
    icon: <Users className="w-6 h-6 text-slate-300" />,
    accentBorder: 'border-slate-600',
    iconBg: 'bg-slate-700/60',
    priceColor: 'text-white',
    ctaClass: 'border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white',
    ctaLabel: 'Choisir Starter',
    mailSubject: 'Souscription plan Starter FinSoft — 290€/an',
    features: [
      { type: 'included', label: '1 utilisateur' },
      { type: 'included', label: '300 factures / an' },
      { type: 'included', label: 'OCR Factures (Mistral IA)' },
      { type: 'included', label: 'Enrichissement SIREN' },
      { type: 'included', label: 'Validation TVA intracommunautaire (VIES)' },
      { type: 'included', label: 'Import universel (PDF / FEC / CSV / Excel)' },
      { type: 'included', label: 'Balance âgée' },
      { type: 'included', label: 'Support email' },
      { type: 'locked', label: 'Règles automatiques de catégorisation', requiredPlan: 'Cabinet' },
      { type: 'locked', label: 'Rapprochement bancaire automatique', requiredPlan: 'Cabinet' },
      { type: 'locked', label: 'Dashboard automatisation & rollback', requiredPlan: 'Cabinet' },
      { type: 'locked', label: 'Synchronisation Sage (Chift)', requiredPlan: 'Cabinet' },
      { type: 'locked', label: 'Score risque fournisseur (Pappers)', requiredPlan: 'Cabinet' },
      { type: 'locked', label: 'Alertes KPI automatiques', requiredPlan: 'Cabinet' },
      { type: 'locked', label: 'Audit IA', requiredPlan: 'Cabinet' },
    ],
  },
  {
    id: 'cabinet',
    name: 'Cabinet',
    tagline: 'Cabinet comptable · jusqu\'à 10 utilisateurs',
    priceAnnual: 890,
    priceMonthly: 74,
    popular: true,
    icon: <Building2 className="w-6 h-6 text-emerald-400" />,
    accentBorder: 'border-emerald-500',
    iconBg: 'bg-emerald-500/10',
    priceColor: 'text-emerald-400',
    ctaClass: 'bg-emerald-500 hover:bg-emerald-400 text-white',
    ctaLabel: 'Choisir Cabinet',
    mailSubject: 'Souscription plan Cabinet FinSoft — 890€/an',
    features: [
      { type: 'included', label: '10 utilisateurs' },
      { type: 'included', label: 'Factures illimitées' },
      { type: 'included', label: 'OCR + SIREN + VIES + Import universel' },
      { type: 'included', label: 'Règles automatiques de catégorisation (PCG)' },
      { type: 'included', label: 'Rapprochement bancaire automatique (5 critères)' },
      { type: 'included', label: 'Dashboard automatisation & rollback' },
      { type: 'included', label: 'Synchronisation Sage via Chift' },
      { type: 'included', label: 'Score risque fournisseur (Pappers)' },
      { type: 'included', label: 'Alertes KPI automatiques' },
      { type: 'included', label: 'Audit IA' },
      { type: 'soon', label: 'Cegid Loop (OAuth2 XRP Flex)', note: 'T2 2026' },
      { type: 'included', label: 'Support prioritaire' },
      { type: 'locked', label: 'API dédiée FinSoft', requiredPlan: 'Pro' },
      { type: 'locked', label: 'Intégration ERP sur-mesure', requiredPlan: 'Pro' },
      { type: 'locked', label: 'Support dédié 6h/jour + SLA', requiredPlan: 'Pro' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Grande entreprise · ETI · Multi-sites',
    priceAnnual: 1900,
    priceMonthly: 158,
    popular: false,
    icon: <Zap className="w-6 h-6 text-violet-400" />,
    accentBorder: 'border-violet-600',
    iconBg: 'bg-violet-500/10',
    priceColor: 'text-violet-400',
    ctaClass: 'bg-violet-600 hover:bg-violet-500 text-white',
    ctaLabel: 'Contacter l\'équipe',
    mailSubject: 'Souscription plan Pro FinSoft — 1900€/an',
    features: [
      { type: 'included', label: 'Utilisateurs illimités' },
      { type: 'included', label: 'Tout illimité + custom' },
      { type: 'included', label: 'Tout le plan Cabinet inclus' },
      { type: 'included', label: 'API dédiée FinSoft' },
      { type: 'included', label: 'Intégration ERP sur-mesure' },
      { type: 'included', label: 'Support dédié 6h/jour' },
      { type: 'included', label: 'SLA garanti' },
      { type: 'soon', label: 'Cegid Loop inclus', note: 'T2 2026' },
    ],
  },
]

// ─── Feature row ──────────────────────────────────────────────────────────────

function FeatureItem({ f }: { f: FeatureRow }) {
  if (f.type === 'included') {
    return (
      <li className="flex items-start gap-2 text-sm text-slate-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        {f.label}
      </li>
    )
  }
  if (f.type === 'locked') {
    return (
      <li className="flex items-start gap-2 text-sm text-slate-600">
        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-600" />
        <span>
          {f.label}
          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-500 font-medium">
            {f.requiredPlan}+
          </span>
        </span>
      </li>
    )
  }
  // soon
  return (
    <li className="flex items-start gap-2 text-sm text-slate-400">
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 font-bold whitespace-nowrap flex-shrink-0 mt-0.5">
        {f.note}
      </span>
      {f.label}
    </li>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [subscriptionRequired, setSubscriptionRequired] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('message') === 'subscription_required') {
        setSubscriptionRequired(true)
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A]">
      <Header />

      <main className="flex-1">
        {/* Banner */}
        {subscriptionRequired && (
          <div className="bg-emerald-600 text-white py-3 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
              <Info className="w-4 h-4 flex-shrink-0" />
              Bienvenue sur FinSoft&nbsp;! Choisissez votre plan pour accéder à votre espace.
            </div>
          </div>
        )}

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Heading */}
            <div className="text-center mb-16">
              <h1 className="text-3xl md:text-5xl font-bold text-white">
                Tarifs FinSoft
              </h1>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                Hébergé en Europe · Données chiffrées · RGPD compliant
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700">
                <Info className="w-3.5 h-3.5" />
                Prix HT · TVA 20% applicable
              </div>
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border bg-slate-900 p-8 flex flex-col ${
                    plan.popular
                      ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10'
                      : plan.accentBorder
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                        POPULAIRE
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <div className={`inline-flex p-3 rounded-xl mb-4 ${plan.iconBg}`}>
                      {plan.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className={`text-5xl font-bold ${plan.priceColor}`}>
                      {plan.priceAnnual.toLocaleString('fr-FR')}€
                    </span>
                    <span className="text-slate-400 text-lg ml-1">/an</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-7">
                    soit <span className="font-semibold text-slate-300">{plan.priceMonthly}€/mois</span>
                  </p>

                  {/* CTA */}
                  <a
                    href={`mailto:contact@finsoft.fr?subject=${encodeURIComponent(plan.mailSubject)}`}
                    className={`w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-3 text-sm rounded-xl transition-all duration-200 mb-8 ${plan.ctaClass}`}
                  >
                    {plan.ctaLabel}
                    <ChevronRight className="w-4 h-4" />
                  </a>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((f, i) => (
                      <FeatureItem key={i} f={f} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Guarantees */}
            <div className="mt-14 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              {[
                'Abonnement annuel renouvelable',
                'Hébergé en Europe (RGPD)',
                'Paiement sécurisé — Facture CE',
                'Données jamais revendues',
              ].map(g => (
                <span key={g} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {g}
                </span>
              ))}
            </div>

            {/* Cegid roadmap note */}
            <div className="mt-10 max-w-2xl mx-auto p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-white mb-0.5">Cegid Loop — disponible T2 2026</p>
                <p className="text-slate-400">
                  La synchronisation Cegid XRP Flex via OAuth2 est en cours de développement.
                  Les clients Cabinet et Pro y auront accès automatiquement dès sa disponibilité.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
