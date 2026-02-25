'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  Users,
  Building2,
  Zap,
  Clock,
  Lock,
  Factory,
  Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FeatureRow =
  | { type: 'included'; label: string }
  | { type: 'locked'; label: string; requiredPlan: string }
  | { type: 'soon'; label: string; note: string }

type ProfileMode = 'cabinet' | 'entreprise'

interface Plan {
  id: 'starter' | 'cabinet' | 'pro'
  name: string
  tagline: string
  priceAnnual: number
  priceMonthly: number
  popular: boolean
  accentBorder: string
  headerBg: string
  priceColor: string
  ctaClass: string
  ctaLabel: string
  features: Record<ProfileMode, FeatureRow[]>
}

// ─── Plans data ───────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Indépendant · TPE · Micro-entrepreneur',
    priceAnnual: 290,
    priceMonthly: 24,
    popular: false,
    accentBorder: 'border-slate-200',
    headerBg: 'bg-slate-50',
    priceColor: 'text-slate-900',
    ctaClass: 'border border-slate-300 hover:border-slate-500 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50',
    ctaLabel: 'Choisir Starter',
    features: {
      cabinet: [
        { type: 'included', label: '1 utilisateur' },
        { type: 'included', label: '300 factures / an' },
        { type: 'included', label: 'OCR Factures (Mistral IA)' },
        { type: 'included', label: 'Enrichissement SIREN' },
        { type: 'included', label: 'Validation TVA intracommunautaire (VIES)' },
        { type: 'included', label: 'Import universel (PDF / FEC / CSV / Excel)' },
        { type: 'included', label: 'Balance âgée' },
        { type: 'included', label: 'Support email' },
        { type: 'locked', label: 'Règles auto catégorisation', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Rapprochement bancaire automatique', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Dashboard automatisation & rollback', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Score risque fournisseur (Pappers)', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Alertes KPI automatiques', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Audit IA', requiredPlan: 'Cabinet' },
      ],
      entreprise: [
        { type: 'included', label: '1 utilisateur' },
        { type: 'included', label: '300 factures / an' },
        { type: 'included', label: 'OCR Factures fournisseurs (Mistral IA)' },
        { type: 'included', label: 'Enrichissement SIREN' },
        { type: 'included', label: 'Validation TVA intracommunautaire (VIES)' },
        { type: 'included', label: 'Import relevés CSV / OFX' },
        { type: 'included', label: 'Dashboard KPI trésorerie' },
        { type: 'included', label: 'Balance âgée' },
        { type: 'included', label: 'Support email' },
        { type: 'locked', label: 'Règles auto catégorisation dépenses', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Rapprochement bancaire automatique', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Graphiques dépenses par catégorie PCG', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Prévision trésorerie 30/60/90j', requiredPlan: 'Cabinet' },
        { type: 'locked', label: 'Alertes KPI automatiques', requiredPlan: 'Cabinet' },
      ],
    },
  },
  {
    id: 'cabinet',
    name: 'Cabinet',
    tagline: 'Cabinet comptable · jusqu\'à 10 utilisateurs',
    priceAnnual: 890,
    priceMonthly: 74,
    popular: true,
    accentBorder: 'border-emerald-400',
    headerBg: 'bg-emerald-50',
    priceColor: 'text-emerald-700',
    ctaClass: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
    ctaLabel: 'Choisir Cabinet',
    features: {
      cabinet: [
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
      entreprise: [
        { type: 'included', label: '10 utilisateurs' },
        { type: 'included', label: 'Factures illimitées' },
        { type: 'included', label: 'OCR + SIREN + VIES + Import universel' },
        { type: 'included', label: 'Règles automatiques de catégorisation dépenses' },
        { type: 'included', label: 'Rapprochement bancaire automatique' },
        { type: 'included', label: 'Dashboard automatisation & rollback' },
        { type: 'included', label: 'Graphiques dépenses par catégorie PCG' },
        { type: 'included', label: 'Prévision trésorerie 30/60/90 jours' },
        { type: 'included', label: 'Relances clients automatiques' },
        { type: 'included', label: 'Alertes KPI automatiques' },
        { type: 'included', label: 'Support prioritaire' },
        { type: 'locked', label: 'API dédiée FinSoft', requiredPlan: 'Pro' },
        { type: 'locked', label: 'Intégration ERP sur-mesure', requiredPlan: 'Pro' },
        { type: 'locked', label: 'Support dédié 6h/jour + SLA', requiredPlan: 'Pro' },
      ],
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Grande entreprise · ETI · Multi-sites',
    priceAnnual: 1900,
    priceMonthly: 158,
    popular: false,
    accentBorder: 'border-violet-300',
    headerBg: 'bg-violet-50',
    priceColor: 'text-violet-700',
    ctaClass: 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20',
    ctaLabel: 'Contacter l\'équipe',
    features: {
      cabinet: [
        { type: 'included', label: 'Utilisateurs illimités' },
        { type: 'included', label: 'Tout illimité + custom' },
        { type: 'included', label: 'Tout le plan Cabinet inclus' },
        { type: 'included', label: 'API dédiée FinSoft' },
        { type: 'included', label: 'Intégration ERP sur-mesure' },
        { type: 'included', label: 'Support dédié 6h/jour' },
        { type: 'included', label: 'SLA garanti' },
        { type: 'soon', label: 'Cegid Loop inclus', note: 'T2 2026' },
      ],
      entreprise: [
        { type: 'included', label: 'Utilisateurs illimités' },
        { type: 'included', label: 'Tout illimité + custom' },
        { type: 'included', label: 'Tout le plan Cabinet inclus' },
        { type: 'included', label: 'API dédiée FinSoft' },
        { type: 'included', label: 'Intégration ERP sur-mesure' },
        { type: 'included', label: 'Connexions ERP multiples (Sage, Cegid…)' },
        { type: 'included', label: 'Support dédié 6h/jour' },
        { type: 'included', label: 'SLA garanti' },
      ],
    },
  },
]

// ─── Feature item ──────────────────────────────────────────────────────────────

function FeatureItem({ f }: { f: FeatureRow }) {
  if (f.type === 'included') {
    return (
      <li className="flex items-start gap-2 text-sm text-slate-700">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        {f.label}
      </li>
    )
  }
  if (f.type === 'locked') {
    return (
      <li className="flex items-start gap-2 text-sm text-slate-400">
        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300" />
        <span>
          {f.label}
          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-medium border border-slate-200">
            {f.requiredPlan}+
          </span>
        </span>
      </li>
    )
  }
  return (
    <li className="flex items-start gap-2 text-sm text-slate-600">
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold whitespace-nowrap flex-shrink-0 mt-0.5 border border-amber-200">
        {f.note}
      </span>
      {f.label}
    </li>
  )
}

// ─── PricingGrid ──────────────────────────────────────────────────────────────

interface PricingGridProps {
  /** When provided, CTAs call this instead of linking to /pricing */
  onSubscribe?: (planId: 'starter' | 'cabinet' | 'pro') => void
  /** Plan ID currently being subscribed to (shows spinner) */
  subscribing?: string | null
}

export function PricingGrid({ onSubscribe, subscribing }: PricingGridProps) {
  const [mode, setMode] = useState<ProfileMode>('cabinet')

  return (
    <>
      {/* Toggle */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-1 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <button
            onClick={() => setMode('cabinet')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              mode === 'cabinet'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Cabinet comptable
          </button>
          <button
            onClick={() => setMode('entreprise')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              mode === 'entreprise'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Factory className="w-4 h-4" />
            Mon entreprise
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-slate-400 -mt-8 mb-12">
        {mode === 'cabinet'
          ? 'Fonctionnalités pour les cabinets comptables et leurs dossiers clients'
          : "Fonctionnalités pour la gestion comptable interne d'une entreprise"}
      </p>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border-2 bg-white shadow-sm flex flex-col ${
              plan.popular
                ? 'border-emerald-400 shadow-xl shadow-emerald-100'
                : plan.accentBorder
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide shadow">
                  POPULAIRE
                </span>
              </div>
            )}

            {/* Header */}
            <div className={`px-8 pt-8 pb-6 rounded-t-2xl ${plan.headerBg}`}>
              <div className="flex items-center gap-2 mb-3">
                {plan.id === 'starter' && <Users className="w-5 h-5 text-slate-500" />}
                {plan.id === 'cabinet' && <Building2 className="w-5 h-5 text-emerald-600" />}
                {plan.id === 'pro' && <Zap className="w-5 h-5 text-violet-600" />}
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{plan.tagline}</p>
              <div className="mt-4">
                <span className={`text-4xl font-bold ${plan.priceColor}`}>
                  {plan.priceAnnual.toLocaleString('fr-FR')}€
                </span>
                <span className="text-slate-400 ml-1">/an</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                soit <span className="font-semibold text-slate-600">{plan.priceMonthly}€/mois</span>
              </p>
            </div>

            {/* CTA */}
            <div className="px-8 py-5 border-b border-slate-100">
              {onSubscribe ? (
                <button
                  onClick={() => onSubscribe(plan.id)}
                  disabled={subscribing === plan.id}
                  className={`w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-3 text-sm rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-wait ${plan.ctaClass}`}
                >
                  {subscribing === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>S&apos;abonner <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              ) : (
                <a
                  href="/pricing"
                  className={`w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-3 text-sm rounded-xl transition-all duration-200 ${plan.ctaClass}`}
                >
                  Choisir ce plan <ChevronRight className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Features */}
            <div className="px-8 py-6">
              <ul className="space-y-2.5">
                {plan.features[mode].map((f, i) => (
                  <FeatureItem key={i} f={f} />
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Guarantees */}
      <div className="mt-14 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
        {[
          'Abonnement annuel renouvelable',
          'Hébergé en Europe (RGPD)',
          'Paiement sécurisé — Facture CE',
          'Données jamais revendues',
        ].map((g) => (
          <span key={g} className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {g}
          </span>
        ))}
      </div>

      {/* Cegid roadmap note */}
      <div className="mt-10 max-w-2xl mx-auto p-4 bg-white border border-amber-200 rounded-xl flex items-start gap-3 shadow-sm">
        <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-slate-800 mb-0.5">Cegid Loop — disponible T2 2026</p>
          <p className="text-slate-500">
            La synchronisation Cegid XRP Flex via OAuth2 est en cours de développement.
            Les clients Cabinet et Pro y auront accès automatiquement dès sa disponibilité.
          </p>
        </div>
      </div>
    </>
  )
}
