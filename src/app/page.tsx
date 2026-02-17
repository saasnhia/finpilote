'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import { Header, Footer } from '@/components/layout'
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  ScanLine,
  BadgeCheck,
  AlertTriangle,
  Server,
  Users,
  Building2,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  X,
} from 'lucide-react'

export default function HomePage() {
  const [showContact, setShowContact] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* ══════════════ HERO ══════════════ */}
        <section className="relative overflow-hidden gradient-bg">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-fade-in">
                <ScanLine className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-medium">
                  OCR + enrichissement SIREN automatique
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight animate-slide-up">
                Automatisez votre
                <span className="text-gradient block">comptabilit&eacute;</span>
                en 30 secondes
              </h1>

              <p className="mt-6 text-lg md:text-xl text-navy-300 max-w-2xl mx-auto animate-slide-up stagger-1">
                OCR factures, enrichissement fournisseurs, validation TVA UE,
                rapprochement bancaire &mdash; le tout avec IA.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-2">
                <Link href="/signup">
                  <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                    D&eacute;marrer gratuitement
                  </Button>
                </Link>
                <button
                  onClick={() => setShowContact(true)}
                  className="inline-flex items-center justify-center gap-2 font-display font-medium px-6 py-3.5 text-lg rounded-xl border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                >
                  <Calendar className="w-5 h-5" />
                  Planifier une d&eacute;mo
                </button>
              </div>

              <p className="mt-6 text-sm text-navy-400 animate-slide-up stagger-3">
                Licence perp&eacute;tuelle &bull; Installation locale &bull; RGPD compliant
              </p>
            </div>

            {/* Dashboard Preview */}
            <div className="mt-16 relative animate-slide-up stagger-4">
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent z-10 pointer-events-none" />
              <Card className="overflow-hidden shadow-2xl border-navy-700/50" variant="glass" padding="none">
                <div className="p-6 bg-navy-900/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-coral-500" />
                    <div className="w-3 h-3 rounded-full bg-gold-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-navy-800/50 rounded-lg p-4">
                      <p className="text-xs text-navy-400 mb-1">Factures OCR</p>
                      <p className="text-2xl font-display font-bold text-emerald-400">247</p>
                      <p className="text-xs text-emerald-400/70 mt-1">ce mois</p>
                    </div>
                    <div className="bg-navy-800/50 rounded-lg p-4">
                      <p className="text-xs text-navy-400 mb-1">Rapprochement</p>
                      <p className="text-2xl font-display font-bold text-white">96%</p>
                      <p className="text-xs text-emerald-400/70 mt-1">auto-match&eacute;</p>
                    </div>
                    <div className="bg-navy-800/50 rounded-lg p-4">
                      <p className="text-xs text-navy-400 mb-1">TVA valid&eacute;e</p>
                      <p className="text-2xl font-display font-bold text-gold-400">42 / 42</p>
                      <p className="text-xs text-emerald-400/70 mt-1">VIES OK</p>
                    </div>
                    <div className="bg-navy-800/50 rounded-lg p-4">
                      <p className="text-xs text-navy-400 mb-1">Risque fournisseur</p>
                      <p className="text-2xl font-display font-bold text-emerald-400">2.1</p>
                      <p className="text-xs text-navy-400 mt-1">score moyen /10</p>
                    </div>
                  </div>
                  <div className="mt-4 h-32 bg-navy-800/30 rounded-lg flex items-end justify-around px-4 pb-4">
                    {[40, 65, 45, 80, 60, 90, 75, 85, 70, 95, 80, 88].map((h, i) => (
                      <div
                        key={i}
                        className="w-5 md:w-8 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ══════════════ PROBLEME → SOLUTION ══════════════ */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900">
                Stop aux 5h de saisie manuelle par mois
              </h2>
              <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">
                FinSoft automatise les t&acirc;ches r&eacute;p&eacute;titives pour que vous puissiez vous concentrer sur le conseil client.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Problemes */}
              <Card className="border-coral-200/50 bg-coral-50/30">
                <h3 className="text-xl font-display font-semibold text-navy-900 mb-6 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-coral-500" />
                  Aujourd&apos;hui sans FinSoft
                </h3>
                <ul className="space-y-4">
                  {[
                    'Saisie manuelle des factures fournisseurs',
                    'Erreurs TVA intracommunautaire non d\u00e9tect\u00e9es',
                    'Aucune visibilit\u00e9 sur le risque fournisseur',
                    'Rapprochement bancaire ligne par ligne dans Excel',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-coral-400 flex-shrink-0 mt-0.5" />
                      <span className="text-navy-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Solutions */}
              <Card className="border-emerald-200/50 bg-emerald-50/30">
                <h3 className="text-xl font-display font-semibold text-navy-900 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  Avec FinSoft
                </h3>
                <ul className="space-y-4">
                  {[
                    'OCR + enrichissement SIREN automatique (nom, adresse, TVA)',
                    'Validation TVA UE en temps r\u00e9el via API VIES officielle',
                    'Score de risque fournisseur 1\u201310 avec alertes (Pappers)',
                    'Rapprochement intelligent factures \u2194 banque en 1 clic',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-navy-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* ══════════════ 4 FEATURES CLES ══════════════ */}
        <section className="py-24 bg-navy-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900">
                4 modules qui changent tout
              </h2>
              <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">
                Chaque fonctionnalit&eacute; est connect&eacute;e aux APIs officielles fran&ccedil;aises et europ&eacute;ennes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* OCR Factures */}
              <Card hover className="group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <ScanLine className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold text-navy-900 mb-2">
                      OCR Factures + Enrichissement SIREN
                    </h3>
                    <p className="text-navy-500 mb-4">
                      Uploadez un PDF &mdash; l&apos;IA extrait montant, date, fournisseur puis enrichit
                      automatiquement via le SIREN : raison sociale, adresse, TVA intracommunautaire.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                      <span>API Recherche Entreprises</span>
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* TVA */}
              <Card hover className="group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BadgeCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold text-navy-900 mb-2">
                      Validation TVA Intracommunautaire
                    </h3>
                    <p className="text-navy-500 mb-4">
                      Num&eacute;ro TVA invalide ? Alerte imm&eacute;diate avant votre d&eacute;claration.
                      V&eacute;rification en temps r&eacute;el via le syst&egrave;me officiel europ&eacute;en.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                      <span>API VIES &mdash; Commission Europ&eacute;enne</span>
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Risque */}
              <Card hover className="group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold text-navy-900 mb-2">
                      Alertes Risque Fournisseurs
                    </h3>
                    <p className="text-navy-500 mb-4">
                      Score de solvabilit&eacute; de 1 &agrave; 10 avec recommandations de paiement :
                      comptant, 30 jours, ou &agrave; &eacute;viter. Prot&eacute;gez votre tr&eacute;sorerie.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                      <span>Pappers &mdash; Donn&eacute;es l&eacute;gales fran&ccedil;aises</span>
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Rapprochement */}
              <Card hover className="group">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <ArrowRightLeft className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold text-navy-900 mb-2">
                      Rapprochement Bancaire Intelligent
                    </h3>
                    <p className="text-navy-500 mb-4">
                      Algorithme multi-crit&egrave;res (montant, date, fournisseur, n&deg; facture, IBAN)
                      qui apprend de vos validations. D&eacute;tection des paiements partiels.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                      <span>Scoring 5 crit&egrave;res &mdash; Auto-apprentissage</span>
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ══════════════ SOCIAL PROOF — IAE DIJON ══════════════ */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900">
                Valid&eacute; par des enseignants en comptabilit&eacute; de l&apos;IAE Dijon
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="w-20 h-20 bg-blue-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-lg">IAE</span>
                </div>
                <p className="text-sm font-medium text-gray-700">IAE Dijon</p>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-green-50">
                <div className="w-20 h-20 bg-emerald-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">L3 Gestion 2026</p>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-violet-50">
                <CheckCircle2 className="w-20 h-20 mx-auto mb-2 text-purple-500 opacity-70" />
                <p className="text-sm font-medium text-gray-700">Test&eacute; P&eacute;dagogique</p>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">5h</div>
                <p className="text-sm text-gray-600">Gain/semaine</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">96%</div>
                <p className="text-sm text-gray-600">Matching auto</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">100%</div>
                <p className="text-sm text-gray-600">RGPD France</p>
              </div>
            </div>

            <blockquote className="text-center italic text-gray-700 max-w-2xl mx-auto">
              &ldquo;Excellent pour automatiser OCR + SIREN en cabinet comptable.&rdquo;
              <cite className="block mt-2 text-sm font-medium text-gray-500 not-italic">
                &mdash; Enseignants IAE Dijon
              </cite>
            </blockquote>
          </div>
        </section>

        {/* ══════════════ TARIFS ══════════════ */}
        <section className="py-24 bg-navy-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900">
                FinSoft Local &mdash; Votre comptabilit&eacute; sur votre serveur
              </h2>
              <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">
                Licence perp&eacute;tuelle, pas d&apos;abonnement. Vos donn&eacute;es restent chez vous.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Solo */}
              <Card hover className="text-center relative">
                <div className="mb-6">
                  <div className="inline-flex p-3 rounded-xl bg-navy-100 mb-4">
                    <Users className="w-6 h-6 text-navy-600" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-navy-900">Solo</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold text-navy-900">&euro;299</span>
                  <p className="text-sm text-navy-400 mt-1">licence perp&eacute;tuelle</p>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  {['1 utilisateur', '500 factures / an', 'OCR + SIREN', 'Validation TVA', 'Support email'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-navy-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowContact(true)}
                  className="w-full inline-flex items-center justify-center gap-2 font-display font-medium px-4 py-2.5 text-base rounded-xl border-2 border-navy-200 hover:border-navy-300 bg-transparent hover:bg-navy-50 text-navy-700 transition-all duration-200"
                >
                  Nous contacter
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Card>

              {/* Cabinet — recommended */}
              <Card hover className="text-center relative border-emerald-300 shadow-lg shadow-emerald-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAIRE
                  </span>
                </div>
                <div className="mb-6">
                  <div className="inline-flex p-3 rounded-xl bg-emerald-100 mb-4">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-navy-900">Cabinet</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold text-navy-900">&euro;799</span>
                  <p className="text-sm text-navy-400 mt-1">licence perp&eacute;tuelle</p>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  {['5 utilisateurs', 'Factures illimit\u00e9es', 'OCR + SIREN + Risque', 'Rapprochement auto', 'Support prioritaire'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-navy-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  icon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => setShowContact(true)}
                >
                  Nous contacter
                </Button>
              </Card>

              {/* Entreprise */}
              <Card hover className="text-center relative">
                <div className="mb-6">
                  <div className="inline-flex p-3 rounded-xl bg-navy-100 mb-4">
                    <Server className="w-6 h-6 text-navy-600" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-navy-900">Entreprise</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold text-navy-900">&euro;1 499</span>
                  <p className="text-sm text-navy-400 mt-1">licence perp&eacute;tuelle</p>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  {['Utilisateurs illimit\u00e9s', 'Tout illimit\u00e9 + custom', 'API d\u00e9di\u00e9e', 'Int\u00e9gration sur-mesure', 'Support 6h/jour'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-navy-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowContact(true)}
                  className="w-full inline-flex items-center justify-center gap-2 font-display font-medium px-4 py-2.5 text-base rounded-xl border-2 border-navy-200 hover:border-navy-300 bg-transparent hover:bg-navy-50 text-navy-700 transition-all duration-200"
                >
                  Nous contacter
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Card>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-navy-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Licence perp&eacute;tuelle
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Installation locale (RGPD)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Paiement s&eacute;curis&eacute; &mdash; Facture CE
              </span>
            </div>
          </div>
        </section>

        {/* ══════════════ CTA DEMO ══════════════ */}
        <section className="py-24 gradient-bg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              Planifiez votre d&eacute;mo FinSoft (15 min)
            </h2>
            <p className="text-lg text-navy-300 mb-10 max-w-2xl mx-auto">
              D&eacute;couvrez comment FinSoft peut faire gagner 5h par mois &agrave; votre cabinet.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button
                size="lg"
                icon={<Calendar className="w-5 h-5" />}
                onClick={() => setShowContact(true)}
              >
                R&eacute;server ma d&eacute;mo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center text-navy-300 text-sm">
              <a href="mailto:saasnhia@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                saasnhia@gmail.com
              </a>
              <a href="tel:+33611752632" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                +33 6 11 75 26 32
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ══════════════ MODAL CONTACT ══════════════ */}
      {showContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowContact(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
            <button
              onClick={() => setShowContact(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-navy-100 transition-colors"
            >
              <X className="w-5 h-5 text-navy-400" />
            </button>

            <h3 className="text-2xl font-display font-bold text-navy-900 mb-2">
              Planifiez votre d&eacute;mo
            </h3>
            <p className="text-navy-500 mb-6">
              Remplissez le formulaire et nous vous recontactons sous 24h.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const data = new FormData(form)
                const subject = encodeURIComponent('Demande de d\u00e9mo FinSoft')
                const body = encodeURIComponent(
                  `Nom: ${data.get('name')}\nEmail: ${data.get('email')}\nT\u00e9l\u00e9phone: ${data.get('phone')}\nTaille entreprise: ${data.get('size')}`
                )
                window.location.href = `mailto:saasnhia@gmail.com?subject=${subject}&body=${body}`
                setShowContact(false)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Nom</label>
                <input
                  name="name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-navy-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-navy-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">T&eacute;l&eacute;phone</label>
                <input
                  name="phone"
                  type="tel"
                  className="w-full px-4 py-2.5 rounded-xl border border-navy-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900"
                  placeholder="+33 6 ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Taille de l&apos;entreprise</label>
                <select
                  name="size"
                  className="w-full px-4 py-2.5 rounded-xl border border-navy-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-navy-900 bg-white"
                >
                  <option value="1">Ind&eacute;pendant / Freelance</option>
                  <option value="2-10">2 &agrave; 10 collaborateurs</option>
                  <option value="11-50">11 &agrave; 50 collaborateurs</option>
                  <option value="50+">Plus de 50</option>
                </select>
              </div>
              <Button type="submit" className="w-full" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                R&eacute;server ma d&eacute;mo
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
