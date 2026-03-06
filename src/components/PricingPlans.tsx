'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, X, Loader2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (Number.isInteger(price)) return `${price}`
  return price.toFixed(2).replace('.', ',')
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface FeatureItem { text: string; ok: boolean }

interface PlanCardData {
  id: string
  name: string
  subtitle: string
  priceMo: number | null
  priceAnnualTotal?: number
  maxUsers?: string
  trialDays: number
  features: FeatureItem[]
  featured: boolean
  cta: string
  planKey?: string
  isContact?: boolean
  ctaNote?: string
}

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────

const PROFILES = [
  { label: 'Indépendant',   sub: '1 utilisateur',      trialBadge: "30 jours gratuits \u2014 Sans carte bancaire" },
  { label: 'TPE 1-5',       sub: '1–5 salariés',       trialBadge: "30 jours gratuits \u2014 Sans carte bancaire" },
  { label: 'PME 6-15',      sub: '6–15 salariés',      trialBadge: "30 jours gratuits \u2014 Sans carte bancaire" },
  { label: 'Cabinet',       sub: 'Experts-comptables', trialBadge: "30 jours gratuits \u2014 Sans carte bancaire \u00b7 4 utilisateurs a l'essai" },
]

const PROFILES_PLANS: PlanCardData[][] = [
  // ── Profil 0 — Indépendant (4 plans)
  [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'Pour découvrir sans engagement',
      priceMo: 0,
      maxUsers: '1 utilisateur',
      trialDays: 0,
      features: [
        { text: 'Tableau de bord KPIs', ok: true },
        { text: 'Import & OCR basique (30 docs/mois)', ok: true },
        { text: 'Facturation simple', ok: true },
        { text: '~500 reponses IA / mois', ok: true },
        { text: 'Support email', ok: true },
        { text: 'Rapprochement automatique', ok: false },
      ],
      featured: false,
      cta: 'Démarrer gratuitement',
      ctaNote: 'Gratuit pour toujours',
    },
    {
      id: 'basique-indep',
      name: 'Basique',
      subtitle: 'Pour facturer et gérer votre comptabilité',
      priceMo: 12,
      priceAnnualTotal: 115,
      maxUsers: '1 utilisateur',
      trialDays: 30,
      features: [
        { text: 'Tout Starter inclus', ok: true },
        { text: 'OCR illimité + enrichissement SIREN', ok: true },
        { text: 'Facturation complète (devis, BC, BL)', ok: true },
        { text: 'TVA CA3 automatique + export FEC', ok: true },
        { text: '~500 reponses IA / mois', ok: true },
        { text: 'Rapprochement bancaire IA', ok: false },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'BASIQUE_INDEP',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'essentiel-indep',
      name: 'Essentiel',
      subtitle: 'Pour piloter votre activité efficacement',
      priceMo: 22,
      priceAnnualTotal: 211,
      maxUsers: '1 utilisateur',
      trialDays: 30,
      features: [
        { text: 'Tout Basique inclus', ok: true },
        { text: 'Rapprochement bancaire IA', ok: true },
        { text: 'Relances automatiques impayés', ok: true },
        { text: 'Catégorisation automatique', ok: true },
        { text: '~2 000 reponses IA / mois', ok: true },
        { text: 'Agents IA sur mesure', ok: false },
      ],
      featured: true,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'ESSENTIEL_INDEP',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'premium-indep',
      name: 'Premium',
      subtitle: 'Tout Essentiel + IA avancée et liasses',
      priceMo: 74,
      priceAnnualTotal: 710,
      maxUsers: '1 utilisateur',
      trialDays: 30,
      features: [
        { text: 'Tout Essentiel inclus', ok: true },
        { text: 'Agents IA sur mesure', ok: true },
        { text: 'Assistant PCG & BOFIP', ok: true },
        { text: 'Liasses fiscales (2035)', ok: true },
        { text: 'E-invoicing 2026 natif', ok: true },
        { text: 'Reponses IA illimitees', ok: true },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'PREMIUM_INDEP',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
  ],

  // ── Profil 1 — TPE 1-5 (3 plans)
  [
    {
      id: 'basique-tpe',
      name: 'Basique',
      subtitle: 'Pour gérer et facturer en équipe',
      priceMo: 27,
      priceAnnualTotal: 259,
      maxUsers: "Jusqu'à 5 utilisateurs",
      trialDays: 30,
      features: [
        { text: 'OCR illimité + enrichissement SIREN', ok: true },
        { text: 'Facturation + gestion commerciale', ok: true },
        { text: 'TVA CA3 automatique + export FEC', ok: true },
        { text: 'Multi-comptes bancaires', ok: true },
        { text: '~500 reponses IA / mois', ok: true },
        { text: 'Rapprochement bancaire IA', ok: false },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'BASIQUE_TPE',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'essentiel-tpe',
      name: 'Essentiel',
      subtitle: 'Pour piloter votre TPE avec l\'IA',
      priceMo: 45,
      priceAnnualTotal: 432,
      maxUsers: "Jusqu'à 5 utilisateurs",
      trialDays: 30,
      features: [
        { text: 'Tout Basique inclus', ok: true },
        { text: 'Rapprochement bancaire IA', ok: true },
        { text: 'Relances automatiques', ok: true },
        { text: 'Catégorisation automatique', ok: true },
        { text: '~2 000 reponses IA / mois', ok: true },
        { text: 'Agents IA sur mesure', ok: false },
      ],
      featured: true,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'ESSENTIEL_TPE',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'premium-tpe',
      name: 'Premium',
      subtitle: 'Tout Essentiel + IA, portail et liasses',
      priceMo: 139,
      priceAnnualTotal: 1334,
      maxUsers: "Jusqu'à 5 utilisateurs",
      trialDays: 30,
      features: [
        { text: 'Tout Essentiel inclus', ok: true },
        { text: 'Agents IA sur mesure + PCG & BOFIP', ok: true },
        { text: 'Portail client collaboratif', ok: true },
        { text: 'Liasses fiscales (2065, 2031)', ok: true },
        { text: 'E-invoicing 2026 natif', ok: true },
        { text: 'Reponses IA illimitees', ok: true },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'PREMIUM_TPE',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
  ],

  // ── Profil 2 — PME 6-15 (3 plans + sur mesure)
  [
    {
      id: 'basique-pme',
      name: 'Basique',
      subtitle: 'Pour une PME en croissance',
      priceMo: 45,
      priceAnnualTotal: 432,
      maxUsers: "Jusqu'à 15 utilisateurs",
      trialDays: 30,
      features: [
        { text: 'OCR illimité + enrichissement SIREN', ok: true },
        { text: 'Facturation + gestion commerciale', ok: true },
        { text: 'TVA CA3 + multi-comptes bancaires', ok: true },
        { text: 'Gestion multi-entités', ok: true },
        { text: '~500 reponses IA / mois', ok: true },
        { text: 'Rapprochement bancaire IA', ok: false },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'BASIQUE_PME',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'essentiel-pme',
      name: 'Essentiel',
      subtitle: 'Pour piloter votre PME de bout en bout',
      priceMo: 89,
      priceAnnualTotal: 854,
      maxUsers: "Jusqu'à 15 utilisateurs",
      trialDays: 30,
      features: [
        { text: 'Tout Basique inclus', ok: true },
        { text: 'Rapprochement bancaire IA', ok: true },
        { text: 'Relances + catégorisation auto', ok: true },
        { text: 'Analytique & rapports avancés', ok: true },
        { text: '~2 000 reponses IA / mois', ok: true },
        { text: 'Agents IA sur mesure', ok: false },
      ],
      featured: true,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'ESSENTIEL_PME',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'premium-pme',
      name: 'Premium',
      subtitle: 'Tout Essentiel + IA avancée et liasses',
      priceMo: 269,
      priceAnnualTotal: 2582,
      maxUsers: "Jusqu'à 15 utilisateurs",
      trialDays: 30,
      features: [
        { text: 'Tout Essentiel inclus', ok: true },
        { text: 'Agents IA sur mesure + PCG & BOFIP', ok: true },
        { text: 'Portail client multi-dossiers', ok: true },
        { text: 'Liasses fiscales complètes', ok: true },
        { text: 'E-invoicing 2026 + Cegid & Sage', ok: true },
        { text: 'Reponses IA illimitees', ok: true },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'PREMIUM_PME',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'pme-surmesure',
      name: 'Plus de 15 salariés ?',
      subtitle: 'Contactez-nous pour un devis personnalisé.',
      priceMo: null,
      maxUsers: 'Illimité',
      trialDays: 0,
      features: [
        { text: 'Tout Premium inclus', ok: true },
        { text: 'Utilisateurs illimités', ok: true },
        { text: 'Reponses IA illimitees', ok: true },
        { text: 'Support prioritaire par email', ok: true },
      ],
      featured: false,
      cta: 'Demander un devis →',
      isContact: true,
    },
  ],

  // ── Profil 3 — Cabinet (2 plans + sur mesure)
  [
    {
      id: 'cabinet-essentiel',
      name: 'Cabinet Essentiel',
      subtitle: "Tout ce qu'il faut pour gérer vos dossiers",
      priceMo: 99,
      priceAnnualTotal: 950,
      maxUsers: "Jusqu'à 10 utilisateurs",
      trialDays: 30,
      features: [
        { text: 'Multi-dossiers + portail client', ok: true },
        { text: 'OCR illimité + rapprochement IA', ok: true },
        { text: 'TVA CA3 + relances automatiques', ok: true },
        { text: 'Gestion commerciale complète', ok: true },
        { text: '~2 000 reponses IA / mois', ok: true },
        { text: 'Agents IA sur mesure', ok: false },
      ],
      featured: false,
      cta: 'Essai cabinet 30 jours →',
      planKey: 'CABINET_ESSENTIEL',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'cabinet-premium',
      name: 'Cabinet Premium',
      subtitle: 'Tout ce dont un cabinet moderne a besoin',
      priceMo: 179,
      priceAnnualTotal: 1718,
      maxUsers: "Jusqu'à 10 utilisateurs",
      trialDays: 30,
      features: [
        { text: 'Tout Cabinet Essentiel inclus', ok: true },
        { text: 'Agents IA sur mesure + PCG & BOFIP', ok: true },
        { text: 'Liasses fiscales (2065, 2031, 2035)', ok: true },
        { text: 'E-invoicing 2026 + Cegid & Sage', ok: true },
        { text: 'Onboarding dédié + support prioritaire', ok: true },
        { text: 'Reponses IA illimitees', ok: true },
      ],
      featured: true,
      cta: 'Essai cabinet Premium 30 jours →',
      planKey: 'CABINET_PREMIUM',
      ctaNote: '30 jours gratuits \u2014 Sans carte bancaire',
    },
    {
      id: 'cabinet-surmenure',
      name: 'Plus de 10 utilisateurs ?',
      subtitle: 'Grand cabinet ou tarification à la mission ? Contactez-nous.',
      priceMo: null,
      maxUsers: 'Collaborateurs illimités',
      trialDays: 0,
      features: [
        { text: 'Tout Cabinet Premium inclus', ok: true },
        { text: 'Collaborateurs illimités', ok: true },
        { text: 'Reponses IA illimitees', ok: true },
        { text: 'Support prioritaire par email', ok: true },
      ],
      featured: false,
      cta: 'Nous contacter →',
      isContact: true,
    },
  ],
]

// ─────────────────────────────────────────────────────────────
// PLAN CARD COMPONENT
// ─────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: PlanCardData
  annual: boolean
  onSubscribe?: (planKey: string, billing: 'monthly' | 'annual') => void
  subscribing?: string | null
}

function PlanCard({ plan, annual, onSubscribe, subscribing }: PlanCardProps) {
  const billing: 'monthly' | 'annual' = annual ? 'annual' : 'monthly'
  const isLoading = subscribing === plan.planKey

  // When onSubscribe is provided AND plan has a planKey, use button for checkout
  const useButton = !!onSubscribe && !!plan.planKey && !plan.isContact

  const href = plan.isContact
    ? 'mailto:contact@worthifast.app'
    : plan.planKey
      ? `/signup?plan=${plan.planKey}&billing=${billing}`
      : '/signup'

  const ctaClasses = `block text-center py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${
    plan.featured
      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
      : plan.isContact
        ? 'bg-slate-900 text-white hover:bg-slate-800'
        : 'border border-gray-200 text-slate-700 hover:bg-gray-50'
  } ${isLoading ? 'opacity-70 cursor-wait' : ''}`

  return (
    <div className={`rounded-2xl border p-6 flex flex-col relative overflow-hidden ${
      plan.featured
        ? 'bg-[#0A1628] text-white border-2 border-emerald-500 shadow-xl'
        : 'bg-white text-slate-900 border-gray-200'
    }`}>
      {plan.featured && (
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
          <div className="absolute top-4 -right-5 bg-emerald-500 text-white text-[9px] font-bold px-10 py-1 rotate-45 whitespace-nowrap">
            Le plus populaire
          </div>
        </div>
      )}

      <div className="mb-5">
        <h3 className={`text-lg font-bold mb-1 ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
          {plan.name}
        </h3>
        <p className={`text-xs mb-4 ${plan.featured ? 'text-slate-400' : 'text-slate-500'}`}>
          {plan.subtitle}
        </p>

        {plan.priceMo === null ? (
          <span className={`text-3xl font-extrabold ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
            Sur mesure
          </span>
        ) : plan.priceMo === 0 ? (
          <div>
            <span className={`text-4xl font-extrabold ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
              Gratuit
            </span>
            <p className={`text-xs mt-1 ${plan.featured ? 'text-slate-400' : 'text-slate-400'}`}>Pour toujours</p>
          </div>
        ) : annual && plan.priceAnnualTotal ? (
          <div>
            <div className="flex items-end gap-1">
              <span className={`text-5xl font-extrabold ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
                {formatPrice(plan.priceMo * 0.8)}€
              </span>
              <span className={`text-sm mb-1.5 ${plan.featured ? 'text-slate-400' : 'text-slate-400'}`}>/mois</span>
            </div>
            <p className={`text-xs mt-0.5 ${plan.featured ? 'text-slate-400' : 'text-slate-400'}`}>
              <span className="line-through">{plan.priceMo}€/mois</span>
              {' '}→ facturé {plan.priceAnnualTotal}€/an
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1">
              <span className={`text-5xl font-extrabold ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
                {plan.priceMo}€
              </span>
              <span className={`text-sm mb-1.5 ${plan.featured ? 'text-slate-400' : 'text-slate-400'}`}>/mois</span>
            </div>
            {plan.priceAnnualTotal && (
              <p className="text-xs text-emerald-500 mt-0.5">
                Ou {formatPrice(plan.priceMo * 0.8)}€/mois en annuel (−20%)
              </p>
            )}
          </div>
        )}

        <p className={`text-xs mt-2 ${plan.featured ? 'text-slate-400' : 'text-slate-400'}`}>
          HT · {plan.maxUsers ?? '1 utilisateur'}
        </p>
      </div>

      <ul className="space-y-2 mb-6 flex-1 text-sm">
        {plan.features.map(f => (
          <li key={f.text} className={`flex items-start gap-2.5 ${
            f.ok
              ? (plan.featured ? 'text-slate-200' : 'text-slate-700')
              : (plan.featured ? 'text-slate-600' : 'text-slate-400')
          }`}>
            {f.ok
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              : <X className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.featured ? 'text-slate-600' : 'text-gray-300'}`} />}
            {f.text}
          </li>
        ))}
      </ul>

      {useButton ? (
        <button
          onClick={() => onSubscribe(plan.planKey!, billing)}
          disabled={!!subscribing}
          className={`w-full ${ctaClasses}`}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirection sécurisée…
            </span>
          ) : plan.cta}
        </button>
      ) : (
        <Link href={href} className={ctaClasses}>
          {plan.cta}
        </Link>
      )}
      {plan.ctaNote && (
        <p className={`text-center text-xs mt-2 ${plan.featured ? 'text-slate-500' : 'text-slate-400'}`}>
          {plan.ctaNote}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRICING PLANS COMPONENT
// ─────────────────────────────────────────────────────────────

interface PricingPlansProps {
  /** Default profile tab index (0=Indépendant, 1=TPE, 2=PME, 3=Cabinet) */
  defaultProfile?: number
  /** Section id for anchor links */
  sectionId?: string
  /** Called when user clicks a plan CTA — triggers Stripe checkout instead of Link navigation */
  onSubscribe?: (planKey: string, billing: 'monthly' | 'annual') => void
  /** Plan id currently being processed (shows loading spinner) */
  subscribing?: string | null
}

export function PricingPlans({ defaultProfile = 3, sectionId, onSubscribe, subscribing }: PricingPlansProps) {
  const [annual, setAnnual] = useState(false)
  const [profilIdx, setProfilIdx] = useState(defaultProfile)

  const planCount = PROFILES_PLANS[profilIdx].length

  return (
    <section id={sectionId} className="py-24 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Tarifs adaptés à votre profil</h2>
          <p className="text-slate-500 mb-8">Choisissez votre situation pour voir les plans qui vous correspondent.</p>

          {/* Toggle mensuel / annuel */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              Mensuel
            </button>
            <button onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              Annuel
              <span className="ml-1.5 text-xs font-bold text-emerald-600">Économisez 2 mois</span>
            </button>
          </div>
        </div>

        {/* Sélecteur de profil */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {PROFILES.map((p, i) => (
            <button key={p.label} onClick={() => setProfilIdx(i)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                profilIdx === i
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-white text-slate-600 border-gray-200 hover:border-emerald-300 hover:text-slate-900'
              }`}>
              {p.label}
              <span className={`ml-2 text-xs font-normal ${profilIdx === i ? 'text-emerald-100' : 'text-slate-400'}`}>
                {p.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Badge essai */}
        {PROFILES[profilIdx].trialBadge && (
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl">
              {PROFILES[profilIdx].trialBadge}
            </span>
          </div>
        )}

        {/* Grille de plans */}
        <div className={`grid gap-5 items-start ${
          planCount === 4
            ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
            : planCount === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'
        }`}>
          {PROFILES_PLANS[profilIdx].map(plan => (
            <PlanCard key={plan.id} plan={plan} annual={annual} onSubscribe={onSubscribe} subscribing={subscribing} />
          ))}
        </div>

        {/* Bande de confiance */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: '🇪🇺', text: 'Hébergé en Europe' },
            { icon: '🔒', text: 'RGPD conforme' },
            { icon: '🚫', text: 'Sans engagement' },
            { icon: '📞', text: 'Support inclus' },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-slate-600 font-medium">
              <span>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">Tous les prix sont HT — TVA 20% applicable</p>
      </div>
    </section>
  )
}
