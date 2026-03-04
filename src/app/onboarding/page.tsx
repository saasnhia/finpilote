'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, User, Landmark, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, Check,
  Users, Briefcase, TrendingUp, Coffee,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileType = 'cabinet' | 'entreprise'
type UsageType = 'independant' | 'tpe' | 'pme' | 'cabinet'

interface WizardForm {
  raison_sociale: string
  forme_juridique: string
  siret: string
  tva_numero: string
  regime_tva: string
  adresse_siege: string
  code_ape: string
  prenom: string
  nom: string
  profile_type: ProfileType
  usage_type: UsageType
  nb_dossiers_cabinet: number
}

const DEFAULT_FORM: WizardForm = {
  raison_sociale: '',
  forme_juridique: 'SAS',
  siret: '',
  tva_numero: '',
  regime_tva: 'franchise',
  adresse_siege: '',
  code_ape: '',
  prenom: '',
  nom: '',
  profile_type: 'entreprise',
  usage_type: 'independant',
  nb_dossiers_cabinet: 0,
}

const FORMES_JURIDIQUES = [
  'Auto-entrepreneur / Micro-entrepreneur',
  'EI (Entreprise Individuelle)',
  'EIRL', 'EURL', 'SARL', 'SAS', 'SASU', 'SA', 'SCI',
  'Association loi 1901', 'Autre',
]

const REGIMES_TVA = [
  { value: 'franchise',       label: 'Franchise en base (< 36 800 € / an)' },
  { value: 'reel_simplifie',  label: 'Réel simplifié' },
  { value: 'reel_normal',     label: 'Réel normal' },
]

function generateTVANumber(siret: string): string {
  const clean = siret.replace(/\s/g, '')
  if (clean.length < 9) return ''
  const siren = clean.slice(0, 9)
  if (!/^\d{9}$/.test(siren)) return ''
  const key = (12 * parseInt(siren, 10) + 3) % 97
  return `FR${key.toString().padStart(2, '0')}${siren}`
}

interface UsageCard {
  type: UsageType
  icon: React.ElementType
  title: string
  subtitle: string
  profile: ProfileType
}

const USAGE_CARDS: UsageCard[] = [
  { type: 'independant', icon: Coffee,    title: 'Indépendant / Freelance', subtitle: 'Auto-entrepreneur, consultant, artisan', profile: 'entreprise' },
  { type: 'tpe',         icon: TrendingUp,title: 'TPE / PME',               subtitle: 'Société de 1 à 250 salariés',            profile: 'entreprise' },
  { type: 'pme',         icon: Users,     title: 'Grande entreprise',       subtitle: 'Groupe, ETI ou filiale',                 profile: 'entreprise' },
  { type: 'cabinet',     icon: Briefcase, title: 'Cabinet comptable',       subtitle: 'Expert-comptable, multi-dossiers',       profile: 'cabinet'    },
]

const BANKS = [
  'BNP Paribas', 'Crédit Agricole', 'Société Générale', 'LCL',
  'Banque Populaire', 'CIC', "Caisse d'Épargne", 'La Banque Postale',
]

const STEPS = [
  { n: 1, label: 'Structure' },
  { n: 2, label: 'Usage' },
  { n: 3, label: 'Banque' },
  { n: 4, label: 'Récap' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState<WizardForm>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => {
    if (key === 'siret') {
      const tva = generateTVANumber(String(value))
      setForm(prev => ({ ...prev, siret: String(value), tva_numero: tva || prev.tva_numero }))
      return
    }
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    if (step === 1 && !form.raison_sociale.trim()) {
      setError('La raison sociale est requise')
      return
    }
    setError(null)
    setStep(prev => Math.min(4, prev + 1) as 1 | 2 | 3 | 4)
  }

  const handleBack = () => {
    setError(null)
    setStep(prev => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)
  }

  const handleFinish = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erreur lors de la sauvegarde')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Erreur réseau, veuillez réessayer')
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#22D3A5]/50 focus:border-[#22D3A5]/50'
  const selectClass = 'w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#22D3A5]/50'
  const labelClass = 'block text-xs font-medium text-slate-300 mb-1.5'

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-4 py-10">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-[#22D3A5] rounded-xl flex items-center justify-center">
            <span className="text-[#0F172A] font-black text-lg">W</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Worthifast
          </span>
        </div>
        <p className="text-sm text-slate-400">Configurons votre espace en quelques étapes</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center w-full max-w-md mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.n} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s.n
                  ? 'bg-[#22D3A5] text-[#0F172A]'
                  : step === s.n
                    ? 'bg-[#22D3A5] text-[#0F172A] ring-4 ring-[#22D3A5]/20'
                    : 'bg-white/10 text-slate-400'
              }`}>
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium ${step >= s.n ? 'text-[#22D3A5]' : 'text-slate-600'}`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 rounded transition-all ${step > s.n ? 'bg-[#22D3A5]' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        {/* STEP 1 — Structure */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#22D3A5]/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#22D3A5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Votre structure</h2>
                <p className="text-xs text-slate-400">Informations de votre entreprise ou cabinet</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass}>Prénom</label>
                <input type="text" value={form.prenom} onChange={e => setField('prenom', e.target.value)} placeholder="Marie" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input type="text" value={form.nom} onChange={e => setField('nom', e.target.value)} placeholder="Dupont" className={inputClass} />
              </div>
            </div>

            <div className="mb-3">
              <label className={labelClass}>Raison sociale <span className="text-red-400">*</span></label>
              <input type="text" value={form.raison_sociale} onChange={e => setField('raison_sociale', e.target.value)} placeholder="Ma Société SAS" className={inputClass} />
            </div>

            <div className="mb-3">
              <label className={labelClass}>Forme juridique</label>
              <select value={form.forme_juridique} onChange={e => setField('forme_juridique', e.target.value)} className={selectClass}>
                {FORMES_JURIDIQUES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass}>SIRET</label>
                <input
                  type="text"
                  value={form.siret}
                  onChange={e => setField('siret', e.target.value.replace(/\D/g, '').slice(0, 14))}
                  placeholder="12345678901234"
                  maxLength={14}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>
                  N° TVA intracommunautaire
                  {form.tva_numero && <span className="ml-1 text-[#22D3A5] text-[10px]">auto</span>}
                </label>
                <input type="text" value={form.tva_numero} onChange={e => setField('tva_numero', e.target.value)} placeholder="FR00123456789" className={`${inputClass} font-mono`} />
              </div>
            </div>

            <div className="mb-3">
              <label className={labelClass}>Régime TVA</label>
              <select value={form.regime_tva} onChange={e => setField('regime_tva', e.target.value)} className={selectClass}>
                {REGIMES_TVA.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Adresse siège social</label>
              <input type="text" value={form.adresse_siege} onChange={e => setField('adresse_siege', e.target.value)} placeholder="1 rue de la Paix, 75001 Paris" className={inputClass} />
            </div>
          </div>
        )}

        {/* STEP 2 — Usage */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#22D3A5]/10 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-[#22D3A5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Votre profil d'utilisation</h2>
                <p className="text-xs text-slate-400">Votre tableau de bord s'adaptera automatiquement</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {USAGE_CARDS.map(card => {
                const Icon = card.icon
                const selected = form.usage_type === card.type
                return (
                  <button
                    key={card.type}
                    onClick={() => setForm(prev => ({ ...prev, usage_type: card.type, profile_type: card.profile }))}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                      selected ? 'border-[#22D3A5] bg-[#22D3A5]/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${selected ? 'bg-[#22D3A5] text-[#0F172A]' : 'bg-white/10 text-slate-400'}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <p className={`text-sm font-semibold mb-0.5 ${selected ? 'text-[#22D3A5]' : 'text-white'}`}>{card.title}</p>
                    <p className="text-[11px] text-slate-400 leading-snug">{card.subtitle}</p>
                  </button>
                )
              })}
            </div>

            {form.usage_type === 'cabinet' && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <label className="block text-xs font-medium text-blue-300 mb-2">Combien de dossiers clients gérez-vous ?</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={form.nb_dossiers_cabinet}
                    onChange={e => setField('nb_dossiers_cabinet', parseInt(e.target.value, 10) || 0)}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                  <span className="text-xs text-slate-400">dossiers actifs environ</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Banque */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#22D3A5]/10 rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5 text-[#22D3A5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Connexion bancaire</h2>
                <p className="text-xs text-slate-400">Importez vos relevés automatiquement</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
              <p className="text-sm text-slate-300 mb-2 font-medium">Pourquoi connecter votre banque ?</p>
              <ul className="space-y-1.5">
                {['Import automatique de vos relevés bancaires', 'Rapprochement bancaire en un clic', 'Zéro saisie manuelle — gain de temps garanti'].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <Check className="w-3.5 h-3.5 text-[#22D3A5] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button disabled className="w-full py-3 px-4 bg-white/10 text-slate-400 rounded-xl font-medium text-sm cursor-not-allowed border border-white/10 mb-3 flex items-center justify-center gap-2">
              <Landmark className="w-4 h-4" />
              Connecter ma banque via GoCardless
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full ml-1">Bientôt</span>
            </button>

            <p className="text-xs text-slate-500 text-center mb-4">
              En attendant, importez vos relevés CSV dans{' '}
              <span className="text-slate-400">Import → Relevé bancaire</span>
            </p>

            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mb-2">Banques supportées à venir</p>
              <div className="flex flex-wrap gap-1.5">
                {BANKS.map(bank => (
                  <span key={bank} className="text-[11px] bg-white/5 text-slate-400 px-2.5 py-1 rounded-lg border border-white/5">{bank}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Récap */}
        {step === 4 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#22D3A5]/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#22D3A5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Tout est prêt !</h2>
                <p className="text-xs text-slate-400">Vérifiez vos informations avant de commencer</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-5 space-y-2">
              {[
                { label: 'Structure',  value: form.raison_sociale || '—' },
                { label: 'Forme',      value: form.forme_juridique },
                { label: 'SIRET',      value: form.siret || 'Non renseigné' },
                { label: 'Régime TVA', value: REGIMES_TVA.find(r => r.value === form.regime_tva)?.label ?? form.regime_tva },
                { label: 'Profil',     value: USAGE_CARDS.find(c => c.type === form.usage_type)?.title ?? form.usage_type },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-slate-500 flex-shrink-0">{row.label}</span>
                  <span className="text-xs text-white text-right truncate max-w-[220px]">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Premiers pas recommandés</p>
              <div className="space-y-2">
                {[
                  { done: true,  label: 'Compte créé et configuré' },
                  { done: false, label: 'Importer votre premier relevé bancaire' },
                  { done: false, label: 'Créer votre première facture client' },
                  { done: false, label: 'Configurer votre déclaration TVA' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2.5 text-sm ${item.done ? 'text-[#22D3A5]' : 'text-slate-400'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${item.done ? 'bg-[#22D3A5] border-[#22D3A5]' : 'border-white/20'}`}>
                      {item.done && <Check className="w-3 h-3 text-[#0F172A]" />}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[#22D3A5]/10 border border-[#22D3A5]/20 rounded-xl text-xs text-[#22D3A5] flex items-start gap-2">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Paiement sécurisé Stripe · Aucun débit avant 30 jours · Résiliation possible à tout moment depuis vos paramètres.</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
          {step > 1 ? (
            <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#22D3A5] text-[#0F172A] rounded-xl font-semibold text-sm hover:bg-[#22D3A5]/90 transition-colors"
            >
              Continuer
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#22D3A5] text-[#0F172A] rounded-xl font-bold text-sm hover:bg-[#22D3A5]/90 transition-colors disabled:opacity-70"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Commencer avec Worthifast →
            </button>
          )}
        </div>

        {step === 3 && (
          <p className="text-center mt-3">
            <button onClick={handleNext} className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
              Je connecterai plus tard
            </button>
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        Modifiez ces informations à tout moment dans <span className="text-slate-500">Paramètres → Entreprise</span>
      </p>
    </div>
  )
}
