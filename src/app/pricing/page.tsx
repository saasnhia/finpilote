'use client'

import { useEffect, useState } from 'react'
import { Header, Footer } from '@/components/layout'
import { Card } from '@/components/ui'
import {
  CheckCircle2,
  ChevronRight,
  Users,
  Building2,
  Zap,
  Clock,
  Info,
} from 'lucide-react'

interface Plan {
  id: 'solo' | 'cabinet' | 'entreprise'
  name: string
  priceAnnual: number
  priceMonthly: number
  popular: boolean
  icon: React.ReactNode
  features: string[]
  cegidNote: boolean
  mailSubject: string
}

const PLANS: Plan[] = [
  {
    id: 'solo',
    name: 'Solo',
    priceAnnual: 400,
    priceMonthly: 33,
    popular: false,
    icon: <Users className="w-6 h-6 text-navy-600" />,
    features: [
      '1 utilisateur',
      '500 factures / an',
      'OCR + enrichissement SIREN',
      'Validation TVA intracommunautaire (VIES)',
      'Synchronisation Sage (via Chift)',
      'Support email',
    ],
    cegidNote: false,
    mailSubject: 'Souscription plan Solo FinSoft — 400€/an',
  },
  {
    id: 'cabinet',
    name: 'Cabinet',
    priceAnnual: 900,
    priceMonthly: 75,
    popular: true,
    icon: <Building2 className="w-6 h-6 text-emerald-600" />,
    features: [
      '5 utilisateurs',
      'Factures illimitées',
      'OCR + SIREN + Score risque fournisseur (Pappers)',
      'Rapprochement bancaire intelligent (5 critères)',
      'Synchronisation Sage (via Chift)',
      'Alertes KPI automatiques',
      'Audit IA',
      'Support prioritaire',
    ],
    cegidNote: true,
    mailSubject: 'Souscription plan Cabinet FinSoft — 900€/an',
  },
  {
    id: 'entreprise',
    name: 'Entreprise',
    priceAnnual: 1900,
    priceMonthly: 158,
    popular: false,
    icon: <Zap className="w-6 h-6 text-navy-600" />,
    features: [
      'Utilisateurs illimités',
      'Tout illimité + custom',
      'API dédiée FinSoft',
      'Synchronisation Sage + Cegid (dès disponibilité)',
      'Intégration ERP sur-mesure',
      'Support 6h/jour dédié',
      'SLA garanti',
    ],
    cegidNote: true,
    mailSubject: 'Souscription plan Entreprise FinSoft — 1900€/an',
  },
]

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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Bandeau subscription required */}
        {subscriptionRequired && (
          <div className="bg-[#22D3A5] text-navy-900 py-3 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
              <Info className="w-4 h-4 flex-shrink-0" />
              Bienvenue sur FinSoft&nbsp;! Choisissez votre plan pour acc&eacute;der &agrave; votre espace cabinet.
            </div>
          </div>
        )}

        <section className="py-24 bg-navy-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-navy-900">
                Tarifs FinSoft &mdash; Abonnement annuel
              </h1>
              <p className="mt-4 text-lg text-navy-500 max-w-2xl mx-auto">
                H&eacute;berg&eacute; en Europe, donn&eacute;es chiffr&eacute;es, RGPD compliant.
                Pour activer votre acc&egrave;s, &eacute;crivez-nous.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  hover
                  className={`text-center relative ${
                    plan.popular
                      ? 'border-emerald-300 shadow-lg shadow-emerald-500/10'
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        POPULAIRE
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`inline-flex p-3 rounded-xl mb-4 ${
                      plan.popular ? 'bg-emerald-100' : 'bg-navy-100'
                    }`}>
                      {plan.icon}
                    </div>
                    <h2 className="text-xl font-display font-semibold text-navy-900">{plan.name}</h2>
                  </div>

                  <div className="mb-2">
                    <span className="text-4xl font-display font-bold text-navy-900">
                      &euro;{plan.priceAnnual.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-lg text-navy-500 ml-1">/an</span>
                  </div>
                  <p className="text-sm text-navy-400 mb-6">soit {plan.priceMonthly}&euro;/mois</p>

                  <ul className="space-y-3 text-left mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-navy-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.cegidNote && (
                      <li className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-navy-100 text-navy-500 font-bold whitespace-nowrap">🔜</span>
                        <div>
                          <span className="text-navy-400">Cegid Loop</span>
                          <p className="text-[11px] text-navy-400 mt-0.5">
                            Connexion OAuth2 Cegid XRP Flex &mdash; disponible T2 2026
                          </p>
                        </div>
                      </li>
                    )}
                  </ul>

                  <a
                    href={`mailto:contact@finsoft.fr?subject=${encodeURIComponent(plan.mailSubject)}`}
                    className={`w-full inline-flex items-center justify-center gap-2 font-display font-medium px-4 py-2.5 text-base rounded-xl transition-all duration-200 ${
                      plan.popular
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'border-2 border-navy-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 text-navy-700'
                    }`}
                  >
                    Choisir ce plan
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </Card>
              ))}
            </div>

            {/* Garanties */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-navy-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Abonnement annuel renouvelable
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                H&eacute;berg&eacute; en Europe (RGPD)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Paiement s&eacute;curis&eacute; &mdash; Facture CE
              </span>
            </div>

            {/* Cegid roadmap note */}
            <div className="mt-10 max-w-2xl mx-auto p-4 bg-navy-50 border border-navy-200 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-navy-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-navy-600">
                <p className="font-medium mb-0.5">Cegid Loop &mdash; disponible T2 2026</p>
                <p className="text-navy-400">
                  La synchronisation Cegid XRP Flex via OAuth2 est en cours de d&eacute;veloppement.
                  Les clients Cabinet et Entreprise y auront acc&egrave;s automatiquement d&egrave;s sa disponibilit&eacute;.
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
