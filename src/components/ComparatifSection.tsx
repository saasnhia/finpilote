'use client'

import { useState } from 'react'
import { ChevronDown, Trophy, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Category {
  name: string
  scoreFinSoft: number
  scorePennylane: number
  winner: 'finsoft' | 'pennylane'
  forcesFinSoft: string[]
  faiblessesFinSoft?: string[]
  forcesPennylane?: string[]
  faiblessesPennylane: string[]
  analyse: string
}

// ─────────────────────────────────────────────────────────────
// DATA — 10 catégories
// ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    name: '\u{1F4CA} Dashboard & KPIs',
    scoreFinSoft: 8,
    scorePennylane: 7,
    winner: 'finsoft',
    forcesFinSoft: [
      'KPIs financiers temps réel (CA, charges, trésorerie)',
      'Alertes intelligentes cliquables',
      'Benchmarks sectoriels intégrés',
      'Import universel depuis le dashboard',
    ],
    forcesPennylane: [
      'Interface épurée et moderne',
      'Graphiques visuels avancés',
    ],
    faiblessesPennylane: [
      'Pas de benchmarks sectoriels',
      'Alertes moins configurables',
    ],
    analyse:
      "FinSoft offre un dashboard orienté action avec alertes cliquables et benchmarks sectoriels. Pennylane propose une interface plus visuelle mais moins configurable pour les besoins spécifiques des cabinets.",
  },
  {
    name: '\u{1F9FE} Factures & OCR',
    scoreFinSoft: 7,
    scorePennylane: 9,
    winner: 'pennylane',
    forcesFinSoft: [
      'OCR intelligent avec extraction automatique',
      'Saisie manuelle factures clients (Factur-X)',
      'Catégorisation automatique PCG',
    ],
    faiblessesPennylane: [
      'Tarification élevée pour gros volumes',
    ],
    forcesPennylane: [
      'Workflow de validation multi-étapes',
      'Collecte automatique fournisseurs',
      'Intégration bancaire native pour le matching',
    ],
    faiblessesFinSoft: [
      'Pas de collecte automatique fournisseurs',
      'Workflow de validation moins avancé',
    ],
    analyse:
      "Pennylane excelle sur la chaîne complète de traitement des factures grâce à la collecte automatique et au workflow de validation. FinSoft compense avec l'OCR intelligent et la facturation Factur-X native.",
  },
  {
    name: '\u{1F916} Assistant IA',
    scoreFinSoft: 7,
    scorePennylane: 9.5,
    winner: 'pennylane',
    forcesFinSoft: [
      'IA spécialisée PCG, BOFIP et CGI',
      'Agents IA personnalisables par cabinet',
      'Données traitées en Europe (RGPD)',
    ],
    faiblessesPennylane: [
      'IA généraliste, moins spécialisée droit fiscal français',
      'Données potentiellement traitées hors UE',
    ],
    forcesPennylane: [
      'Assistant IA conversationnel très abouti',
      'IA intégrée dans tout le workflow',
      'Suggestions contextuelles temps réel',
    ],
    faiblessesFinSoft: [
      'IA contextuelle sur données du dossier prévue T3 2026',
    ],
    analyse:
      "FinSoft cible les cabinets qui veulent un outil comptable solide avec une IA réglementaire (PCG, BOFIP, CGI) — pas un chatbot généraliste. L'assistant Pennylane est plus large mais moins spécialisé sur le droit fiscal français. La roadmap FinSoft prévoit l'IA contextuelle sur les données du dossier pour T3 2026.",
  },
  {
    name: '\u{1F3E6} Banque & rapprochement',
    scoreFinSoft: 6,
    scorePennylane: 9,
    winner: 'pennylane',
    forcesFinSoft: [
      'Import CSV bancaire avec détection automatique',
      'Rapprochement IA qui apprend les habitudes',
    ],
    faiblessesPennylane: [
      'Connexion bancaire parfois instable (Bridge/Powens)',
    ],
    forcesPennylane: [
      'Connexion bancaire native (Open Banking)',
      'Catégorisation automatique avancée',
      'Synchronisation en temps réel',
    ],
    faiblessesFinSoft: [
      'Pas de connexion bancaire directe (Open Banking prévu)',
      'Import manuel CSV uniquement',
    ],
    analyse:
      "L'intégration bancaire est le point fort historique de Pennylane. FinSoft propose le rapprochement IA sur import CSV — la connexion directe via Open Banking est sur la roadmap.",
  },
  {
    name: '\u{1F4D2} Production comptable',
    scoreFinSoft: 7,
    scorePennylane: 8,
    winner: 'pennylane',
    forcesFinSoft: [
      'TVA CA3 automatique conforme',
      'Export FEC certifié DGFiP',
      'Module audit avec seuils de significativité',
    ],
    faiblessesPennylane: [
      'FEC export moins paramétrable',
      'Module audit basique',
    ],
    forcesPennylane: [
      'Workflow de révision collaboratif',
      'Lettrage automatique avancé',
      'Gestion multi-exercice native',
    ],
    faiblessesFinSoft: [
      'Lettrage avancé prévu T3 2026',
      'Gestion multi-exercice en développement',
    ],
    analyse:
      "Pennylane a l'avantage sur la production comptable au quotidien grâce au workflow collaboratif et au lettrage. FinSoft compense avec le module audit et l'export FEC certifié.",
  },
  {
    name: '\u{1F514} Relances & recouvrement',
    scoreFinSoft: 8,
    scorePennylane: 6,
    winner: 'finsoft',
    forcesFinSoft: [
      'Relances automatiques 3 niveaux (J+7, J+15, J+30)',
      'Email personnalisé avec Resend',
      'Configuration par client et par seuil',
      'Historique complet des relances',
    ],
    faiblessesPennylane: [
      'Relances manuelles uniquement',
      'Pas de scénarios automatiques multi-niveaux',
    ],
    forcesPennylane: [
      'Intégration paiement en ligne',
    ],
    faiblessesFinSoft: [
      'Pas de paiement en ligne intégré (prévu)',
    ],
    analyse:
      "Les relances automatiques multi-niveaux sont un avantage net de FinSoft pour les cabinets qui gèrent le recouvrement de leurs clients. Pennylane propose le paiement en ligne mais sans automatisation des relances.",
  },
  {
    name: '\u{1F4B0} Tarification',
    scoreFinSoft: 9,
    scorePennylane: 5,
    winner: 'finsoft',
    forcesFinSoft: [
      'À partir de 99\u20AC/mois — dossiers illimités dès Cabinet',
      'Pas de facturation à l\'utilisateur',
      'Essai 30 jours sans carte bancaire',
      'Résiliable en 1 clic',
    ],
    faiblessesPennylane: [
      'Facturation par dossier et par utilisateur',
      'Coût élevé pour les cabinets multi-dossiers',
      'Engagement annuel fréquent',
    ],
    forcesPennylane: [
      'Offre gratuite pour les indépendants',
    ],
    faiblessesFinSoft: [
      'Pas d\'offre gratuite permanente',
    ],
    analyse:
      "C'est l'un des avantages les plus clairs de FinSoft : un pricing transparent qui ne punit pas la croissance du cabinet. Pennylane facture par dossier, ce qui devient vite prohibitif pour les cabinets avec 50+ clients.",
  },
  {
    name: '\u{1F4C4} E-invoicing 2026',
    scoreFinSoft: 9,
    scorePennylane: 6,
    winner: 'finsoft',
    forcesFinSoft: [
      'Factur-X 1.0 natif — norme EN16931',
      'Validation automatique des 16 champs obligatoires DGFiP',
      'Export PDF/A-3 avec XML embarqué',
      'Badge conformité 2026 intégré',
      'Testeur de conformité inclus',
    ],
    faiblessesPennylane: [
      'Conformité Factur-X partielle en 2026',
      'Pas de validation automatique des champs DGFiP',
      'Dépendance aux mises à jour éditeur',
    ],
    analyse:
      "L'e-invoicing 2026 est obligatoire pour toutes les entreprises françaises. FinSoft est conçu natif pour cette obligation — c'est un avantage structurel face aux solutions qui adaptent rétrospectivement leur architecture.",
  },
  {
    name: '\u{1F465} Portail client',
    scoreFinSoft: 7,
    scorePennylane: 8,
    winner: 'pennylane',
    forcesFinSoft: [
      'Espace partagé sécurisé par client',
      'Dépôt de documents par le client',
      'Accès aux factures en ligne',
      'Lien unique par dossier client',
    ],
    faiblessesPennylane: [],
    forcesPennylane: [
      'Portail client mature avec historique complet',
      'Signature électronique intégrée',
    ],
    faiblessesFinSoft: [
      'Interface portail moins mature que Pennylane',
      'Pas encore de signature électronique intégrée',
    ],
    analyse:
      "FinSoft propose les fondamentaux du portail client (partage de documents, accès factures). La signature électronique est prévue sur la roadmap.",
  },
  {
    name: '\u{1F504} Migration & onboarding',
    scoreFinSoft: 8,
    scorePennylane: 5,
    winner: 'finsoft',
    forcesFinSoft: [
      'Import FEC standard',
      'Connecteur Sage via Chift',
      'Connecteur Cegid via Chift',
      'Import balance N-1 (Bientôt)',
      'Plan comptable personnalisé repris',
      'Migration accompagnée par l\'équipe fondatrice',
    ],
    faiblessesPennylane: [
      'Pas de connecteur natif Sage/Cegid',
      'Migration manuelle pour les cabinets existants',
      'Support migration payant ou inexistant',
    ],
    analyse:
      "C'est l'argument décisif pour les cabinets sur Sage 50 ou Cegid depuis 10 ans : FinSoft propose une migration assistée avec reprise FEC, plan comptable et balances N-1. Pennylane ne cible pas ce segment.",
  },
]

// ─────────────────────────────────────────────────────────────
// RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────

const RECOMMENDATIONS = [
  'Sparklines sur les KPIs — prévu roadmap Q2 2026',
  'Connexion bancaire Open Banking — en cours de développement',
  'Lettrage avancé et multi-exercice — prévu T3 2026',
  'Signature électronique portail client — sur la roadmap',
]

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

function ScoreBar({ score, max = 10, color }: { score: number; max?: number; color: string }) {
  const pct = (score / max) * 100
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-slate-700 w-10 text-right">{score}/{max}</span>
    </div>
  )
}

function CategoryCard({ cat, isOpen, onToggle }: { cat: Category; isOpen: boolean; onToggle: () => void }) {
  const isFinSoftWinner = cat.winner === 'finsoft'

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button onClick={onToggle} className="w-full px-6 py-5 flex items-center gap-4 text-left">
        <span className="text-lg font-bold text-slate-900 flex-1">{cat.name}</span>

        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 w-14 text-right">FinSoft</span>
            <div className="w-24">
              <ScoreBar score={cat.scoreFinSoft} color="bg-emerald-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 w-16 text-right">Pennylane</span>
            <div className="w-24">
              <ScoreBar score={cat.scorePennylane} color="bg-blue-500" />
            </div>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isFinSoftWinner
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          <Trophy className="w-3 h-3" />
          {isFinSoftWinner ? 'FinSoft' : 'Pennylane'}
        </span>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile scores */}
      {!isOpen && (
        <div className="sm:hidden px-6 pb-4 flex gap-4">
          <div className="flex-1">
            <span className="text-xs text-slate-500">FinSoft</span>
            <ScoreBar score={cat.scoreFinSoft} color="bg-emerald-500" />
          </div>
          <div className="flex-1">
            <span className="text-xs text-slate-500">Pennylane</span>
            <ScoreBar score={cat.scorePennylane} color="bg-blue-500" />
          </div>
        </div>
      )}

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* FinSoft */}
            <div>
              <h4 className="text-sm font-bold text-emerald-700 mb-3">FinSoft</h4>
              {cat.forcesFinSoft.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {cat.forcesFinSoft.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {cat.faiblessesFinSoft && cat.faiblessesFinSoft.length > 0 && (
                <ul className="space-y-2">
                  {cat.faiblessesFinSoft.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-500">
                      <XCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pennylane */}
            <div>
              <h4 className="text-sm font-bold text-blue-700 mb-3">Pennylane</h4>
              {cat.forcesPennylane && cat.forcesPennylane.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {cat.forcesPennylane.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {cat.faiblessesPennylane.length > 0 && (
                <ul className="space-y-2">
                  {cat.faiblessesPennylane.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-500">
                      <XCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-600 leading-relaxed italic">{cat.analyse}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function ComparatifSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const avgFinSoft = +(CATEGORIES.reduce((s, c) => s + c.scoreFinSoft, 0) / CATEGORIES.length).toFixed(1)
  const avgPennylane = +(CATEGORIES.reduce((s, c) => s + c.scorePennylane, 0) / CATEGORIES.length).toFixed(1)
  const winsFinSoft = CATEGORIES.filter(c => c.winner === 'finsoft').length
  const winsPennylane = CATEGORIES.filter(c => c.winner === 'pennylane').length

  return (
    <section id="comparatif" className="py-24 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            FinSoft vs Pennylane — Comparatif honnête
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            10 catégories analysées objectivement. Nous montrons où FinSoft excelle et où Pennylane a l&apos;avantage.
          </p>
        </div>

        {/* Global scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
              <span className="font-extrabold text-lg">FS</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">FinSoft</h3>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{avgFinSoft}<span className="text-base text-slate-400">/10</span></p>
            <p className="text-sm text-slate-500 mt-1">{winsFinSoft} victoire{winsFinSoft > 1 ? 's' : ''} sur {CATEGORIES.length}</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <span className="font-extrabold text-lg">PL</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pennylane</h3>
            <p className="text-3xl font-extrabold text-blue-600 mt-2">{avgPennylane}<span className="text-base text-slate-400">/10</span></p>
            <p className="text-sm text-slate-500 mt-1">{winsPennylane} victoire{winsPennylane > 1 ? 's' : ''} sur {CATEGORIES.length}</p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.name}
              cat={cat}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* Recommendations roadmap */}
        <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Roadmap FinSoft — Améliorations prévues</h3>
          <ul className="space-y-3">
            {RECOMMENDATIONS.map(r => (
              <li key={r} className="flex items-start gap-3 text-sm text-slate-600">
                <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
