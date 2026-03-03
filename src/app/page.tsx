'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, X, ChevronDown, ArrowRight, ScanLine, ArrowRightLeft,
  BookOpen, Users2, Bell, Menu, Shield, Zap, Globe, AlertTriangle,
  Clock, Scale, Sparkles,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (Number.isInteger(price)) return `${price}`
  return price.toFixed(2).replace('.', ',')
}

function CellIcon({ val }: { val: string }) {
  if (val === '✅') return <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
  if (val === '❌') return <X className="w-4 h-4 text-gray-300 mx-auto" />
  if (val === '⚠️') return (
    <span className="inline-flex items-center justify-center gap-1 text-xs text-amber-600 font-semibold">
      <AlertTriangle className="w-3.5 h-3.5" />Partiel
    </span>
  )
  if (val === '🔜') return <span className="text-xs text-amber-600 font-semibold">À venir</span>
  return <span className="text-xs text-slate-400">{val}</span>
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type ComparisonRow = {
  feature: string
  finsoft: string
  pennylane: string
  dext: string
  sage: string
}

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

const COMPARISON: ComparisonRow[] = [
  { feature: 'OCR natif + IA',                        finsoft: '✅', pennylane: '✅', dext: '✅', sage: '⚠️' },
  { feature: 'Rapprochement bancaire IA',              finsoft: '✅', pennylane: '✅', dext: '❌', sage: '⚠️' },
  { feature: 'Gestion commerciale complète',           finsoft: '✅', pennylane: '✅', dext: '❌', sage: '✅' },
  { feature: 'Portail client intégré',                 finsoft: '✅', pennylane: '✅', dext: '❌', sage: '❌' },
  { feature: 'TVA + déclarations fiscales',            finsoft: '✅', pennylane: '✅', dext: '❌', sage: '✅' },
  { feature: 'Relances automatiques',                  finsoft: '✅', pennylane: '✅', dext: '❌', sage: '⚠️' },
  { feature: 'Notes de frais',                         finsoft: '✅', pennylane: '✅', dext: '✅', sage: '✅' },
  { feature: 'Liasses fiscales',                       finsoft: '✅', pennylane: '✅', dext: '❌', sage: '✅' },
  { feature: 'Facturation électronique 2026',          finsoft: '✅', pennylane: '✅', dext: '❌', sage: '⚠️' },
  { feature: 'Hébergé en Europe (EU)',                 finsoft: '✅', pennylane: '✅', dext: '❌', sage: '⚠️' },
  { feature: 'Assistant comptable IA',                 finsoft: '✅', pennylane: '⚠️', dext: '❌', sage: '❌' },
  { feature: 'Agents IA personnalisables',             finsoft: '✅', pennylane: '❌', dext: '❌', sage: '❌' },
  { feature: 'Tokens IA inclus dans le plan',          finsoft: '✅', pennylane: '❌', dext: '❌', sage: '❌' },
  { feature: 'Mise en relation cabinet/entreprise',    finsoft: '🔜', pennylane: '❌', dext: '❌', sage: '❌' },
]

const FAQ_ITEMS = [
  { q: 'FinSoft est-il conforme RGPD ?', r: "Oui. Notre infrastructure utilise des serveurs européens certifiés. Aucune donnée n'est transmise à des tiers sans votre consentement. FinSoft est conforme au RGPD et utilise des modèles IA hébergés en Europe." },
  { q: 'Puis-je importer mes données depuis Sage ou Cegid ?', r: "Oui. FinSoft dispose d'une intégration native avec Cegid Loop et Sage via Chift. L'import FEC est également supporté pour la reprise de l'historique comptable." },
  { q: "Comment fonctionne l'offre de lancement ?", r: "Vous créez votre compte avec une carte bancaire. Aucun débit pendant 30 jours. Sans résiliation, votre abonnement est automatiquement activé à J+30. Vous pouvez résilier à tout moment en 1 clic depuis vos paramètres." },
  { q: "Qu'est-ce que l'e-invoicing 2026 ?", r: "À partir de 2026, la facturation électronique sera obligatoire entre entreprises françaises. FinSoft vous prépare dès maintenant avec le format Factur-X et le statut d'Opérateur de Dématérialisation." },
  { q: "Puis-je annuler mon abonnement à tout moment ?", r: "Absolument. Pas d'engagement, pas de frais de résiliation. Résiliez en 1 clic depuis vos paramètres. Vous pouvez exporter toutes vos données à tout moment au format standard (FEC, CSV, PDF)." },
]

// ─────────────────────────────────────────────────────────────
// PLAN PROFILES
// ─────────────────────────────────────────────────────────────

const PROFILES = [
  { label: 'Indépendant',   sub: '1 utilisateur',      trialBadge: "🎁 30 jours offerts · Carte requise, aucun débit pendant 30j" },
  { label: 'TPE 1-5',       sub: '1–5 salariés',       trialBadge: "🎁 30 jours offerts · Carte requise, aucun débit pendant 30j" },
  { label: 'PME 6-15',      sub: '6–15 salariés',      trialBadge: "🎁 30 jours offerts · Carte requise, aucun débit pendant 30j" },
  { label: 'Cabinet',       sub: 'Experts-comptables', trialBadge: "🎁 30 jours offerts · Carte requise, aucun débit · 4 utilisateurs à l'essai" },
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
        { text: '50 000 tokens IA / mois — Haiku', ok: true },
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
        { text: '50 000 tokens IA / mois — Haiku', ok: true },
        { text: 'Rapprochement bancaire IA', ok: false },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'BASIQUE_INDEP',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: '200 000 tokens IA / mois — Sonnet', ok: true },
        { text: 'Agents IA sur mesure', ok: false },
      ],
      featured: true,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'ESSENTIEL_INDEP',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: 'Tokens IA illimités — Sonnet', ok: true },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'PREMIUM_INDEP',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: '50 000 tokens IA / mois — Haiku', ok: true },
        { text: 'Rapprochement bancaire IA', ok: false },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'BASIQUE_TPE',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: '200 000 tokens IA / mois — Sonnet', ok: true },
        { text: 'Agents IA sur mesure', ok: false },
      ],
      featured: true,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'ESSENTIEL_TPE',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: 'Tokens IA illimités — Sonnet', ok: true },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'PREMIUM_TPE',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: '50 000 tokens IA / mois — Haiku', ok: true },
        { text: 'Rapprochement bancaire IA', ok: false },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'BASIQUE_PME',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: '200 000 tokens IA / mois — Sonnet', ok: true },
        { text: 'Agents IA sur mesure', ok: false },
      ],
      featured: true,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'ESSENTIEL_PME',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: 'Tokens IA illimités — Sonnet', ok: true },
      ],
      featured: false,
      cta: 'Essai gratuit 30 jours →',
      planKey: 'PREMIUM_PME',
      ctaNote: 'Carte requise · Aucun débit avant 30 jours',
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
        { text: 'Tokens IA illimités — Sonnet', ok: true },
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
        { text: '200 000 tokens IA / mois — Sonnet', ok: true },
        { text: 'Agents IA sur mesure', ok: false },
      ],
      featured: false,
      cta: 'Essai cabinet 30 jours →',
      planKey: 'CABINET_ESSENTIEL',
      ctaNote: 'Carte requise · Aucun débit pendant 30j · 4 utilisateurs max à l\'essai',
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
        { text: 'Tokens IA illimités — Sonnet', ok: true },
      ],
      featured: true,
      cta: 'Essai cabinet Premium 30 jours →',
      planKey: 'CABINET_PREMIUM',
      ctaNote: 'Carte requise · Aucun débit pendant 30j · 4 utilisateurs max à l\'essai',
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
        { text: 'Tokens IA illimités — Sonnet', ok: true },
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

function PlanCard({ plan, annual }: { plan: PlanCardData; annual: boolean }) {
  const href = plan.isContact
    ? 'mailto:contact@finsoft.app'
    : plan.planKey
      ? `/auth/register?plan=${plan.planKey}&billing=${annual ? 'annual' : 'monthly'}`
      : '/auth/register'

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

      <a href={href}
        className={`block text-center py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${
          plan.featured
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : plan.isContact
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'border border-gray-200 text-slate-700 hover:bg-gray-50'
        }`}>
        {plan.cta}
      </a>
      {plan.ctaNote && (
        <p className={`text-center text-xs mt-2 ${plan.featured ? 'text-slate-500' : 'text-slate-400'}`}>
          {plan.ctaNote}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [annual, setAnnual] = useState(false)
  const [profilIdx, setProfilIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [contactForm, setContactForm] = useState({ nom: '', cabinet: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await fetch('/api/contact/cabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      setSent(true)
    } catch { /* silent */ } finally { setSending(false) }
  }

  const planCount = PROFILES_PLANS[profilIdx].length

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FS</span>
            </div>
            <span className="font-bold text-xl text-slate-900">FinSoft</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Se connecter
            </Link>
            <Link href="/auth/register"
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">
              Essai gratuit →
            </Link>
          </div>

          <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenu(!mobileMenu)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            {(['#features', '#pricing', '#faq', '#contact'] as const).map((href, i) => (
              <a key={href} href={href} onClick={() => setMobileMenu(false)}
                className="block text-sm font-medium text-slate-700 py-1">
                {['Fonctionnalités', 'Tarifs', 'FAQ', 'Contact'][i]}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1 text-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium">Se connecter</Link>
              <Link href="/auth/register" className="flex-1 text-center px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold">Essai gratuit</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-b from-slate-50 to-white pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Offre de lancement · 1 mois offert · Résiliable à tout moment
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            La comptabilité intelligente<br />
            <span className="text-emerald-500">pour les cabinets français</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            OCR intelligent, rapprochement bancaire IA, relances automatiques et conformité e-invoicing 2026.
            La plateforme tout-en-un pour les cabinets et PME françaises.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link href="/auth/register"
              className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 text-base">
              Démarrer l&apos;essai gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features"
              className="flex items-center gap-2 px-6 py-3.5 border border-gray-200 text-slate-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-base">
              Voir les fonctionnalités →
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🇪🇺</span>
              Hébergé en Europe
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              RGPD compliant
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              30 jours d&apos;essai offerts
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              Résiliable à tout moment
            </div>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-16 max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-slate-700 rounded-md h-5 w-48 mx-auto" />
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'CA ce mois', value: '48 200 €', note: '↑ +8% vs mois dernier', up: true },
                { label: 'Factures en attente', value: '12', note: '↓ 3 en retard', up: false },
                { label: 'Taux TVA collectée', value: '19,6%', note: '↑ conforme', up: true },
                { label: 'Rapprochement', value: '94%', note: '↑ automatisé', up: true },
              ].map((kpi, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                  <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                  <p className={`text-xs mt-1 font-medium ${kpi.up ? 'text-emerald-600' : 'text-amber-600'}`}>{kpi.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CRÉDIBILITÉ ── */}
      <section className="border-y border-gray-100 py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-8">Conçu avec des experts comptables</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              '🎓 IAE Dijon — École de Management',
              '📋 Validé par des enseignants-chercheurs en comptabilité',
              '🔒 Architecture RGPD · Audit en cours',
            ].map(badge => (
              <span key={badge} className="inline-flex items-center px-4 py-2.5 bg-gray-100 rounded-full text-sm text-slate-700 font-medium">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES — 3 visual blocks ── */}
      <section id="features" className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Une plateforme unifiée pour la comptabilité, la conformité et la collaboration client.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Block 1 — Gain de temps */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gain de temps</h3>
              <p className="text-sm text-slate-500 mb-5">Automatisez la saisie et le rapprochement pour gagner des heures chaque semaine.</p>
              <ul className="space-y-3">
                {[
                  { icon: ScanLine, text: 'OCR intelligent — scan, extraction et classement automatique' },
                  { icon: ArrowRightLeft, text: 'Rapprochement bancaire IA qui apprend vos habitudes' },
                  { icon: Sparkles, text: 'Catégorisation automatique des écritures (PCG)' },
                ].map(item => (
                  <li key={item.text} className="flex items-start gap-3 text-sm text-slate-700">
                    <item.icon className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Block 2 — Conformité française */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-5">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Conformité FR</h3>
              <p className="text-sm text-slate-500 mb-5">PCG, BOFIP, TVA CA3, FEC, e-invoicing 2026 — tout est intégré nativement.</p>
              <ul className="space-y-3">
                {[
                  { icon: BookOpen, text: 'Assistant PCG & BOFIP avec références contextualisées' },
                  { icon: Shield, text: 'TVA CA3 automatique + export FEC conforme' },
                  { icon: Zap, text: 'E-invoicing 2026 natif (Factur-X, OD agréé)' },
                ].map(item => (
                  <li key={item.text} className="flex items-start gap-3 text-sm text-slate-700">
                    <item.icon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Block 3 — Collaboration cabinet */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mb-5">
                <Users2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cabinet & clients</h3>
              <p className="text-sm text-slate-500 mb-5">Portail client, multi-dossiers et relances automatiques pour votre cabinet.</p>
              <ul className="space-y-3">
                {[
                  { icon: Users2, text: 'Portail client sécurisé — zéro email, zéro pièce jointe' },
                  { icon: Bell, text: 'Relances automatiques impayés (J+7, J+15, J+30)' },
                  { icon: Globe, text: 'Multi-dossiers + intégrations Cegid & Sage' },
                ].map(item => (
                  <li key={item.text} className="flex items-start gap-3 text-sm text-slate-700">
                    <item.icon className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARAISON ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Pourquoi FinSoft ?</h2>
            <p className="text-slate-500">Comparatif honnête avec les solutions du marché</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 w-1/2">Fonctionnalité</th>
                  <th className="px-4 py-4 font-bold text-emerald-600 text-center">FinSoft</th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-center hidden sm:table-cell">Pennylane</th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-center hidden md:table-cell">Dext</th>
                  <th className="px-4 py-4 font-medium text-slate-500 text-center hidden lg:table-cell">Sage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COMPARISON.map(row => (
                  <tr key={row.feature} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-700">{row.feature}</td>
                    <td className="px-4 py-4 text-center font-bold text-[#10B981]">
                      <CellIcon val={row.finsoft} />
                    </td>
                    <td className="px-4 py-4 text-center hidden sm:table-cell"><CellIcon val={row.pennylane} /></td>
                    <td className="px-4 py-4 text-center hidden md:table-cell"><CellIcon val={row.dext} /></td>
                    <td className="px-4 py-4 text-center hidden lg:table-cell"><CellIcon val={row.sage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-400 text-center leading-relaxed">
            ✅ Inclus · ⚠️ Partiel ou en option · ❌ Non disponible<br />
            * Comparatif basé sur les offres publiques — mars 2026.<br />
            Pennylane est PDP agréé DGFiP. FinSoft est Opérateur de Dématérialisation, agrément PDP en cours.
          </p>
        </div>
      </section>

      {/* ── PRICING — 4 profils ── */}
      <section id="pricing" className="py-24 px-4 bg-slate-50">
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
              <PlanCard key={plan.id} plan={plan} annual={annual} />
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

      {/* ── SECTION CABINET ── */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400 mb-6">
            Pour les experts-comptables
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Gérez tous vos dossiers depuis une seule plateforme
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Multi-dossiers, portail client, e-invoicing, intégrations Cegid &amp; Sage.
            FinSoft est conçu pour les cabinets qui veulent gagner du temps sur chaque dossier.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            {['Multi-dossiers illimités', 'Portail client sécurisé', 'E-invoicing 2026 natif', 'Intégration Cegid / Sage'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <a href="mailto:contact@finsoft.app"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors">
            Nous contacter
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-slate-600 leading-relaxed">{item.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Profitez de l&apos;offre de lancement
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            1 mois offert · Résiliable à tout moment · Support inclus
          </p>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 text-lg">
            Démarrer gratuitement →
          </Link>
          <p className="text-xs text-slate-500 mt-4">
            Carte requise · Aucun débit pendant 30 jours · Résiliez en 1 clic
          </p>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-24 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Nous contacter</h2>
            <p className="text-slate-500">Une question ? Notre équipe vous répond sous 24h.</p>
          </div>

          {sent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900 mb-2">Message envoyé !</p>
              <p className="text-slate-500 text-sm">Notre équipe vous contactera dans les 24h.</p>
            </div>
          ) : (
            <form onSubmit={e => void handleContact(e)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Votre nom *</label>
                  <input required value={contactForm.nom}
                    onChange={e => setContactForm(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Marie Fontaine"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Cabinet / Entreprise</label>
                  <input value={contactForm.cabinet}
                    onChange={e => setContactForm(p => ({ ...p, cabinet: e.target.value }))}
                    placeholder="Cabinet Fontaine & Associés"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Email *</label>
                <input required type="email" value={contactForm.email}
                  onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="marie@cabinet-fontaine.fr"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Votre message</label>
                <textarea value={contactForm.message}
                  onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Nombre de dossiers, logiciel actuel, fonctionnalités prioritaires…"
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none" />
              </div>
              <button type="submit" disabled={sending}
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors text-sm">
                {sending ? 'Envoi en cours…' : 'Envoyer →'}
              </button>
              <p className="text-xs text-slate-400 text-center">Vos données ne sont jamais partagées avec des tiers.</p>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FS</span>
                </div>
                <span className="font-bold text-xl text-white">FinSoft</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">
                La solution comptable intelligente pour les cabinets d&apos;expertise comptable et PME françaises.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-emerald-400 font-medium">
                <span>🇪🇺</span>
                Hébergé en Europe — RGPD conforme
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Essai gratuit</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link href="/cgv" className="hover:text-white transition-colors">CGV</Link></li>
                <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité (RGPD)</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <p>© 2026 FinSoft · Conçu à l&apos;IAE Dijon · contact@finsoft.app</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
