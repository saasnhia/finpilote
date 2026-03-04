'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, ChevronDown, ArrowRight, ScanLine, ArrowRightLeft,
  BookOpen, Users2, Bell, Menu, Shield, Zap, Globe,
  Clock, Scale, Sparkles, Euro, TrendingUp, Wrench,
} from 'lucide-react'
import { ScreenshotCarousel } from '@/components/ScreenshotCarousel'
import { PricingPlans } from '@/components/PricingPlans'
import { ComparatifSection } from '@/components/ComparatifSection'

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────

const FAQ_ITEMS: { q: string; r: string; cta?: { text: string; href: string } }[] = [
  { q: 'FinSoft est-il conforme RGPD ?', r: "Oui. Notre infrastructure utilise des serveurs europeens certifies. Aucune donnee n'est transmise a des tiers sans votre consentement. FinSoft est conforme au RGPD et utilise des modeles IA heberges en Europe." },
  { q: 'Vous utilisez Sage ou Cegid ?', r: "FinSoft s'integre avec Sage et Cegid via notre connecteur. Ce qui est repris : FEC, plan comptable personnalise, balances N-1. Immobilisations : import CSV, migration accompagnee sur demande. Notre equipe vous guide etape par etape.", cta: { text: 'Parler de ma migration \u2192', href: 'mailto:contact@finsoft.app?subject=Migration Sage' } },
  { q: "Comment fonctionne l'essai gratuit ?", r: "Vous creez votre compte sans carte bancaire. Acces complet pendant 30 jours. A l'issue de la periode d'essai, l'acces est suspendu sauf souscription a un abonnement payant. Vous pouvez resilier a tout moment en 1 clic depuis vos parametres." },
  { q: "Qu'est-ce que l'e-invoicing 2026 ?", r: "A partir de 2026, la facturation electronique sera obligatoire entre entreprises francaises. FinSoft vous prepare des maintenant avec le format Factur-X et le statut d'Operateur de Dematerialisation." },
  { q: "Puis-je annuler mon abonnement a tout moment ?", r: "Absolument. Pas d'engagement, pas de frais de resiliation. Resiliez en 1 clic depuis vos parametres. Vous pouvez exporter toutes vos donnees a tout moment au format standard (FEC, CSV, PDF)." },
  { q: "Quelles fonctionnalites arrivent prochainement ?", r: "Lettrage avance, gestion multi-exercice et teledeclaration EDI-TDFC sont prevus pour T3 2026. Vous voulez influencer nos priorites ? Parlez-nous directement.", cta: { text: 'Partager mon retour \u2192', href: 'mailto:contact@finsoft.app?subject=Roadmap FinSoft' } },
]

export default function HomePage() {
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
            <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalites</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
            <Link href="/about" className="hover:text-slate-900 transition-colors">A propos</Link>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Se connecter
            </Link>
            <Link href="/signup"
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
            {[
              { href: '#features', label: 'Fonctionnalites' },
              { href: '#pricing', label: 'Tarifs' },
              { href: '#faq', label: 'FAQ' },
              { href: '/about', label: 'A propos' },
              { href: '#contact', label: 'Contact' },
            ].map(item => (
              <a key={item.href} href={item.href} onClick={() => setMobileMenu(false)}
                className="block text-sm font-medium text-slate-700 py-1">
                {item.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1 text-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium">Se connecter</Link>
              <Link href="/signup" className="flex-1 text-center px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold">Essai gratuit</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-b from-slate-50 to-white pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            30 jours gratuits &middot; Sans carte bancaire
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            La comptabilité intelligente<br />
            <span className="text-emerald-500">pour les cabinets français</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Multi-dossiers illimites, portail client et e-invoicing 2026
            — a partir de 99&euro;/mois.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link href="/signup"
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

        {/* Screenshot carousel */}
        <div className="mt-16 max-w-5xl mx-auto px-4">
          <ScreenshotCarousel />
          <p className="text-center text-sm text-slate-500 mt-6">
            Essayez gratuitement pendant 30 jours — Sans carte bancaire
          </p>
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
              '🇪🇺 Données hébergées en Europe (AWS EU) · Conforme RGPD',
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

      {/* ── POURQUOI FINSOFT — 3 cards honnetes ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Pourquoi FinSoft ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-5">
                <Euro className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Prix qui ne punit pas la croissance</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Les solutions existantes facturent a l&apos;utilisateur ou au dossier.
                Plus votre cabinet grandit, plus vous payez.
                FinSoft Cabinet : dossiers illimites a partir de 99&euro;/mois.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">IA francaise integree</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Assistant PCG &amp; BOFIP entraine sur la reglementation francaise.
                Repond aux questions comptables complexes, pas juste des generalites.
                Donnees traitees en Europe, hebergement conforme RGPD.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mb-5">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Construit avec des comptables</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Developpe avec le departement Comptabilite-Finance de l&apos;IAE Dijon.
                Chaque fonctionnalite validee par des praticiens du metier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARATIF ── */}
      <ComparatifSection />

      {/* ── PRICING — shared component ── */}
      <PricingPlans sectionId="pricing" defaultProfile={3} />

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
                    {item.cta && (
                      <a href={item.cta.href} className="inline-block mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                        {item.cta.text}
                      </a>
                    )}
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
            Essayez FinSoft gratuitement
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            30 jours gratuits &middot; Sans carte bancaire &middot; Resiliable a tout moment
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 text-lg">
            Demarrer gratuitement &rarr;
          </Link>
          <p className="text-xs text-slate-500 mt-4">
            30 jours gratuits &middot; Sans carte bancaire &middot; Resiliez en 1 clic
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
                <li><Link href="/signup" className="hover:text-white transition-colors">Essai gratuit</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions legales</Link></li>
                <li><Link href="/legal/cgv" className="hover:text-white transition-colors">CGV</Link></li>
                <li><Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="/legal/politique-confidentialite" className="hover:text-white transition-colors">Confidentialite (RGPD)</Link></li>
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
