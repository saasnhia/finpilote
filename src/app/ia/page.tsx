'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout'
import Link from 'next/link'
import {
  Sparkles,
  Shield,
  ShieldCheck,
  Euro,
  ArrowRightLeft,
  Mail,
  ChevronDown,
  Lock,
  Bot,
  BookOpen,
  Plus,
  Send,
  Info,
  Loader2,
} from 'lucide-react'
import { AuditAgent } from '@/components/ai/AuditAgent'
import { TVAAgent } from '@/components/ai/TVAAgent'
import { RapprochementAgent } from '@/components/ai/RapprochementAgent'
import { MailAgent } from '@/components/ai/MailAgent'

interface AgentCard {
  id: string
  icon: React.ElementType
  iconColor: string
  title: string
  description: string
  component: React.ReactNode
}

const agents: AgentCard[] = [
  {
    id: 'audit',
    icon: ShieldCheck,
    iconColor: 'text-emerald-400',
    title: 'Agent Audit',
    description: 'Détecte anomalies, doublons et incohérences selon le Plan Comptable Général.',
    component: <AuditAgent />,
  },
  {
    id: 'tva',
    icon: Euro,
    iconColor: 'text-blue-400',
    title: 'Agent TVA',
    description: 'Vérifie les taux TVA, calcule le solde CA3 et émet des conseils fiscaux.',
    component: <TVAAgent />,
  },
  {
    id: 'rapprochement',
    icon: ArrowRightLeft,
    iconColor: 'text-amber-400',
    title: 'Agent Rapprochement',
    description: 'Explique les anomalies bancaires en langage clair et propose des actions correctives.',
    component: <RapprochementAgent />,
  },
  {
    id: 'mail',
    icon: Mail,
    iconColor: 'text-purple-400',
    title: 'Agent Mail',
    description: 'Génère des rappels de paiement personnalisés et courtois pour vos clients en retard.',
    component: <MailAgent />,
  },
]

interface AgentCustom {
  id: string
  nom: string
  description: string | null
  avatar_emoji: string
  couleur: string
  system_prompt: string
  secteur_metier: string | null
  actif: boolean
  nb_conversations: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

type Tab = 'worthifast' | 'mes-agents' | 'pcg'

function AgentSection({ agent }: { agent: AgentCard }) {
  const [open, setOpen] = useState(false)
  const Icon = agent.icon

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-5 h-5 ${agent.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{agent.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 truncate">{agent.description}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4">
            {agent.component}
          </div>
        </div>
      )}
    </div>
  )
}

function AgentCustomCard({ agent }: { agent: AgentCustom }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const history = messages
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`/api/ia/agents-custom/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, conversation_history: history }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch { /* silent */ } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{ backgroundColor: agent.couleur + '22' }}
        >
          {agent.avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{agent.nom}</p>
          <p className="text-xs text-gray-600 mt-0.5 truncate">
            {agent.description ?? agent.system_prompt.slice(0, 80)}
          </p>
        </div>
        <span className="text-[10px] text-gray-400 mr-2 flex-shrink-0">
          {agent.nb_conversations} conv.
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4 italic">
                Posez votre première question à cet agent…
              </p>
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Votre question…"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DossierOption { id: string; nom: string }

function getDateSuggestions(): { label: string; question: string }[] {
  const now = new Date()
  const month = now.getMonth() // 0-indexed
  const suggestions: { label: string; question: string }[] = []

  // TVA CA3 reminder around declaration periods (monthly or quarterly)
  if ([0, 3, 6, 9].includes(month)) {
    suggestions.push({ label: 'TVA CA3 du trimestre', question: 'Quelles sont les échéances et modalités de déclaration de TVA CA3 pour le trimestre en cours ?' })
  }

  // Year-end closing (Nov-Feb)
  if (month >= 10 || month <= 1) {
    suggestions.push({ label: 'Clôture annuelle', question: 'Quelles sont les écritures de clôture obligatoires en fin d\'exercice ? (provisions, amortissements, régularisations)' })
  }

  // CFE payment (Oct-Dec)
  if (month >= 9 && month <= 11) {
    suggestions.push({ label: 'CFE — Échéance', question: 'Quelles sont les échéances de paiement de la CFE et les conditions d\'exonération ?' })
  }

  // IS acomptes (Mar, Jun, Sep, Dec)
  if ([2, 5, 8, 11].includes(month)) {
    suggestions.push({ label: 'Acompte IS', question: 'Comment calculer les acomptes d\'impôt sur les sociétés ? Quelles sont les dates limites ?' })
  }

  // Always show a general suggestion
  suggestions.push({ label: 'Liasse fiscale', question: 'Quels sont les formulaires obligatoires de la liasse fiscale pour une SAS au régime réel normal ?' })

  return suggestions.slice(0, 3)
}

function PCGBOFIPTab() {
  const [contexte, setContexte] = useState<'pcg' | 'bofip' | 'cgi'>('pcg')
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [sourcesTrouvees, setSourcesTrouvees] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dossiers, setDossiers] = useState<DossierOption[]>([])
  const [selectedDossier, setSelectedDossier] = useState<string>('')
  const dateSuggestions = getDateSuggestions()

  useEffect(() => {
    fetch('/api/dossiers')
      .then(r => r.json())
      .then(d => { if (d.success && d.dossiers) setDossiers(d.dossiers.map((ds: { id: string; nom: string }) => ({ id: ds.id, nom: ds.nom }))) })
      .catch(() => {})
  }, [])

  const ask = async () => {
    if (!question.trim() || loading) return
    setLoading(true)
    setResponse(null)
    setError(null)
    try {
      const res = await fetch('/api/ia/pcg-bofip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), contexte, ...(selectedDossier && { dossier_id: selectedDossier }) }),
      })
      const data = await res.json()
      if (data.success) {
        setResponse(data.response)
        setSourcesTrouvees(data.sources_trouvees ?? 0)
      } else {
        setError(data.error ?? 'Erreur inconnue')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const placeholders: Record<string, string> = {
    pcg: 'Ex : Quel compte utiliser pour les frais de formation professionnelle ?',
    bofip: 'Ex : Quelle est la règle de déductibilité des cadeaux clients ?',
    cgi: 'Ex : Quelles sont les conditions d\'exonération de TVA intracommunautaire ?',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-950 border border-blue-800">
        <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-blue-400">Assistant Comptable & Fiscal</p>
          <p className="text-xs text-gray-300 leading-relaxed">
            PCG, BOFIP, CGI — réponses expertes basées sur la réglementation française en vigueur.
            Données anonymisées, hébergement France.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['pcg', 'bofip', 'cgi'] as const).map(ctx => (
          <button
            key={ctx}
            onClick={() => setContexte(ctx)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              contexte === ctx
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {ctx === 'pcg' ? 'Plan Comptable (PCG)' : ctx === 'bofip' ? 'BOFIP Fiscal' : 'Code Général des Impôts'}
          </button>
        ))}
      </div>

      {/* Dossier context selector */}
      {dossiers.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Contexte dossier :</label>
          <select
            value={selectedDossier}
            onChange={e => setSelectedDossier(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Aucun (question générale)</option>
            {dossiers.map(d => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date-based suggestions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-400 self-center mr-1">Suggestions :</span>
        {dateSuggestions.map(s => (
          <button
            key={s.label}
            onClick={() => setQuestion(s.question)}
            className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) ask() }}
        placeholder={placeholders[contexte]}
        rows={3}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <button
        onClick={ask}
        disabled={!question.trim() || loading}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
        {loading ? 'Recherche en cours…' : 'Obtenir une réponse experte'}
      </button>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {response && (
        <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2">
          {sourcesTrouvees > 0 && (
            <p className="text-xs text-blue-600 font-medium">
              {sourcesTrouvees} compte(s) PCG trouvé(s) dans la base de référence
            </p>
          )}
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{response}</p>
        </div>
      )}
    </div>
  )
}

export default function IAPage() {
  const [tab, setTab] = useState<Tab>('worthifast')
  const [customAgents, setCustomAgents] = useState<AgentCustom[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)

  useEffect(() => {
    if (tab === 'mes-agents') {
      setLoadingAgents(true)
      fetch('/api/ia/agents-custom')
        .then(r => r.json())
        .then(d => { if (d.success) setCustomAgents(d.agents ?? []) })
        .catch(() => {})
        .finally(() => setLoadingAgents(false))
    }
  }, [tab])

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'worthifast', label: 'Agents Worthifast', icon: Sparkles },
    { id: 'mes-agents', label: 'Mes Agents', icon: Bot },
    { id: 'pcg', label: 'PCG & BOFIP', icon: BookOpen },
  ]

  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Sparkles className="w-6 h-6 text-emerald-500" />
              <h1 className="text-2xl font-bold text-gray-900">Assistant IA Worthifast</h1>
              <span className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                  10 analyses / heure en période de lancement. Cette limite sera augmentée prochainement.
                </span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-medium">
                <Lock className="w-3 h-3" />
                Données anonymisées
              </span>
            </div>
            <p className="text-sm text-gray-500 ml-9">
              Agents IA spécialisés pour votre comptabilité — propulsés par Mistral AI (France)
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-200">
            {tabs.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab: Agents Worthifast */}
          {tab === 'worthifast' && (
            <>
              {/* Bandeau sécurité RGPD */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950 border border-emerald-800">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-emerald-400">Confidentialité garantie</p>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    Vos données sont <strong>anonymisées automatiquement</strong> avant tout envoi au modèle IA.
                    Aucune donnée personnelle (nom, email, IBAN) ne quitte vos serveurs.
                    Le modèle reçoit uniquement des montants, dates et catégories codifiés.
                    Hébergement : <strong>Mistral AI (France)</strong>.
                  </p>
                </div>
              </div>

              {/* Agent cards */}
              <div className="space-y-3">
                {agents.map(agent => (
                  <AgentSection key={agent.id} agent={agent} />
                ))}
              </div>
            </>
          )}

          {/* Tab: Mes Agents */}
          {tab === 'mes-agents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Mes agents personnalisés</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Agents créés et entraînés sur vos besoins métier</p>
                </div>
                <Link
                  href="/ia/creer-agent"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Créer un agent
                </Link>
              </div>

              {loadingAgents && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}

              {!loadingAgents && customAgents.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                  <Bot className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Aucun agent créé</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Créez votre premier agent IA personnalisé en 4 étapes
                  </p>
                  <Link
                    href="/ia/creer-agent"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Créer mon premier agent
                  </Link>
                </div>
              )}

              {!loadingAgents && customAgents.length > 0 && (
                <div className="space-y-3">
                  {customAgents.map(agent => (
                    <AgentCustomCard key={agent.id} agent={agent} />
                  ))}
                  <div className="text-center pt-2">
                    <Link
                      href="/ia/mes-agents"
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Gérer tous mes agents →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: PCG & BOFIP */}
          {tab === 'pcg' && <PCGBOFIPTab />}
        </div>
      </div>
    </AppShell>
  )
}
