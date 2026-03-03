'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlan } from '@/hooks/useUserPlan'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, User, CreditCard, Plug, Bell, AlertTriangle,
  Loader2, Save, ExternalLink, Check, LogOut, Trash2,
  RefreshCw, Shield, Download, ChevronRight,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'entreprise' | 'compte' | 'abonnement' | 'integrations' | 'notifications' | 'danger'

interface ProfileData {
  raison_sociale: string
  forme_juridique: string
  siret: string
  tva_numero: string
  regime_tva: string
  adresse_siege: string
  code_ape: string
  iban: string
  logo_url: string
  couleur_principale: string
  prenom: string
  nom: string
  avatar_url: string
  timezone: string
  notif_email_relances: boolean
  notif_email_factures: boolean
  notif_email_digest: string
}

interface SubscriptionData {
  plan: string
  status: string
  current_period_end: string | null
  stripe_customer_id: string | null
}

const DEFAULT_PROFILE: ProfileData = {
  raison_sociale: '', forme_juridique: '', siret: '', tva_numero: '',
  regime_tva: 'franchise', adresse_siege: '', code_ape: '', iban: '',
  logo_url: '', couleur_principale: '#22D3A5',
  prenom: '', nom: '', avatar_url: '',
  timezone: 'Europe/Paris',
  notif_email_relances: true, notif_email_factures: true, notif_email_digest: 'weekly',
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'entreprise',    label: 'Entreprise',      icon: Building2 },
  { id: 'compte',        label: 'Mon compte',       icon: User },
  { id: 'abonnement',    label: 'Abonnement',       icon: CreditCard },
  { id: 'integrations',  label: 'Intégrations',     icon: Plug },
  { id: 'notifications', label: 'Notifications',    icon: Bell },
  { id: 'danger',        label: 'Zone de danger',   icon: AlertTriangle },
]

const FORMES_JURIDIQUES = [
  'Auto-entrepreneur / Micro-entrepreneur',
  'EI (Entreprise Individuelle)', 'EIRL', 'EURL', 'SARL', 'SAS', 'SASU', 'SA', 'SCI',
  'Association loi 1901', 'Autre',
]

const REGIMES_TVA = [
  { value: 'franchise',      label: 'Franchise en base (< 36 800 € / an)' },
  { value: 'reel_simplifie', label: 'Réel simplifié' },
  { value: 'reel_normal',    label: 'Réel normal' },
]

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', cabinet: 'Cabinet', pro: 'Pro',
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-700',
  cabinet: 'bg-blue-100 text-blue-700',
  pro: 'bg-emerald-100 text-emerald-700',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth()
  const { plan, loading: planLoading } = useUserPlan()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('entreprise')

  // Read ?tab= from URL (useSearchParams replaced by window.location.search to avoid Suspense)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab') as Tab | null
    if (t && TABS.some(x => x.id === t)) setActiveTab(t)
  }, [])

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const supabase = createClient()
      const [{ data: profileData }, { data: subData }] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('plan, status, current_period_end, stripe_customer_id').eq('user_id', user.id).maybeSingle(),
      ])

      if (profileData) {
        setProfile({
          raison_sociale:        profileData.raison_sociale        ?? '',
          forme_juridique:       profileData.forme_juridique       ?? '',
          siret:                 profileData.siret                 ?? '',
          tva_numero:            profileData.tva_numero            ?? '',
          regime_tva:            profileData.regime_tva            ?? 'franchise',
          adresse_siege:         profileData.adresse_siege         ?? '',
          code_ape:              profileData.code_ape              ?? '',
          iban:                  profileData.iban                  ?? '',
          logo_url:              profileData.logo_url              ?? '',
          couleur_principale:    profileData.couleur_principale     ?? '#22D3A5',
          prenom:                profileData.prenom                ?? '',
          nom:                   profileData.nom                   ?? '',
          avatar_url:            profileData.avatar_url            ?? '',
          timezone:              profileData.timezone              ?? 'Europe/Paris',
          notif_email_relances:  profileData.notif_email_relances  ?? true,
          notif_email_factures:  profileData.notif_email_factures  ?? true,
          notif_email_digest:    profileData.notif_email_digest    ?? 'weekly',
        })
      }

      if (subData) {
        setSubscription(subData as SubscriptionData)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const pf = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  const saveProfile = async (fields: Partial<ProfileData>) => {
    if (!user?.id) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('user_profiles').update(fields).eq('id', user.id)
      if (error) throw error
      toast.success('Paramètres sauvegardés')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleStripePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? 'Erreur lors de l\'ouverture du portail Stripe')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    try {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      setResetSent(true)
      toast.success('Email de réinitialisation envoyé !')
    } catch {
      toast.error('Erreur lors de l\'envoi')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') {
      toast.error('Tapez SUPPRIMER pour confirmer')
      return
    }
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (res.ok) {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setDeletingAccount(false)
    }
  }

  const inputClass = 'w-full bg-white border border-navy-200 rounded-xl px-3 py-2.5 text-sm text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300'
  const labelClass = 'block text-sm font-medium text-navy-700 mb-1.5'

  const trialDaysLeft = subscription?.current_period_end
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000))
    : null

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-navy-900">Paramètres</h1>
          <p className="text-sm text-navy-500 mt-1">Gérez votre compte et votre abonnement</p>
        </div>

        <div className="flex gap-6">

          {/* Left tab bar */}
          <div className="w-52 flex-shrink-0">
            <nav className="space-y-0.5">
              {TABS.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                      active ? 'bg-emerald-50 text-emerald-700' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-emerald-600' : ''}`} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <>
                {/* ── ENTREPRISE ──────────────────────────────────────────── */}
                {activeTab === 'entreprise' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-navy-100 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-navy-900 mb-4">Informations entreprise</h2>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelClass}>Raison sociale</label>
                          <input type="text" value={profile.raison_sociale} onChange={e => pf('raison_sociale', e.target.value)} placeholder="Ma Société SAS" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Forme juridique</label>
                          <select value={profile.forme_juridique} onChange={e => pf('forme_juridique', e.target.value)} className={inputClass}>
                            <option value="">-- Sélectionner --</option>
                            {FORMES_JURIDIQUES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelClass}>SIRET</label>
                          <input type="text" value={profile.siret} onChange={e => pf('siret', e.target.value)} placeholder="12345678901234" className={`${inputClass} font-mono`} maxLength={14} />
                        </div>
                        <div>
                          <label className={labelClass}>N° TVA intracommunautaire</label>
                          <input type="text" value={profile.tva_numero} onChange={e => pf('tva_numero', e.target.value)} placeholder="FR00123456789" className={`${inputClass} font-mono`} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelClass}>Régime TVA</label>
                          <select value={profile.regime_tva} onChange={e => pf('regime_tva', e.target.value)} className={inputClass}>
                            {REGIMES_TVA.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Code APE / NAF</label>
                          <input type="text" value={profile.code_ape} onChange={e => pf('code_ape', e.target.value)} placeholder="6201Z" className={inputClass} />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className={labelClass}>Adresse siège social</label>
                        <input type="text" value={profile.adresse_siege} onChange={e => pf('adresse_siege', e.target.value)} placeholder="1 rue de la Paix, 75001 Paris" className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>IBAN</label>
                          <input type="text" value={profile.iban} onChange={e => pf('iban', e.target.value)} placeholder="FR76 3000..." className={`${inputClass} font-mono`} />
                        </div>
                        <div>
                          <label className={labelClass}>Couleur principale</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={profile.couleur_principale} onChange={e => pf('couleur_principale', e.target.value)} className="w-10 h-10 rounded-lg border border-navy-200 cursor-pointer p-1" />
                            <input type="text" value={profile.couleur_principale} onChange={e => pf('couleur_principale', e.target.value)} className={`${inputClass} font-mono`} placeholder="#22D3A5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-navy-100 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-navy-900 mb-1">Mentions légales</h2>
                      <p className="text-xs text-navy-400 mb-3">Apparaissent au bas de vos factures</p>
                      <textarea
                        value={profile.logo_url}
                        onChange={e => pf('logo_url', e.target.value)}
                        placeholder="URL de votre logo (https://...)"
                        rows={2}
                        className={`${inputClass} mb-3`}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => void saveProfile({
                          raison_sociale: profile.raison_sociale,
                          forme_juridique: profile.forme_juridique,
                          siret: profile.siret,
                          tva_numero: profile.tva_numero,
                          regime_tva: profile.regime_tva,
                          adresse_siege: profile.adresse_siege,
                          code_ape: profile.code_ape,
                          iban: profile.iban,
                          couleur_principale: profile.couleur_principale,
                          logo_url: profile.logo_url,
                        })}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                )}

                {/* ── MON COMPTE ──────────────────────────────────────────── */}
                {activeTab === 'compte' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-navy-100 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-navy-900 mb-4">Informations personnelles</h2>

                      {/* Avatar */}
                      <div className="flex items-center gap-4 mb-5 p-4 bg-navy-50 rounded-xl">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700">
                          {(profile.prenom || user?.email || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-navy-900">{profile.prenom || profile.nom ? `${profile.prenom} ${profile.nom}`.trim() : 'Nom non renseigné'}</p>
                          <p className="text-sm text-navy-500">{user?.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelClass}>Prénom</label>
                          <input type="text" value={profile.prenom} onChange={e => pf('prenom', e.target.value)} placeholder="Marie" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Nom</label>
                          <input type="text" value={profile.nom} onChange={e => pf('nom', e.target.value)} placeholder="Dupont" className={inputClass} />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className={labelClass}>Fuseau horaire</label>
                        <select value={profile.timezone} onChange={e => pf('timezone', e.target.value)} className={inputClass}>
                          <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                          <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                          <option value="Europe/Brussels">Europe/Brussels (UTC+1/+2)</option>
                          <option value="Europe/Zurich">Europe/Zurich (UTC+1/+2)</option>
                        </select>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => void saveProfile({ prenom: profile.prenom, nom: profile.nom, timezone: profile.timezone })}
                          disabled={saving}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Enregistrer
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-navy-100 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-navy-900 mb-1">Sécurité</h2>
                      <p className="text-sm text-navy-500 mb-4">Gérez votre mot de passe et la sécurité du compte</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => void handleResetPassword()}
                          disabled={resetSent}
                          className="flex items-center gap-2 px-4 py-2.5 border border-navy-200 rounded-xl text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-60 transition-colors"
                        >
                          {resetSent ? <Check className="w-4 h-4 text-emerald-500" /> : <RefreshCw className="w-4 h-4" />}
                          {resetSent ? 'Email envoyé !' : 'Réinitialiser le mot de passe'}
                        </button>
                        {resetSent && <p className="text-xs text-navy-500">Vérifiez votre boîte email</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ABONNEMENT ──────────────────────────────────────────── */}
                {activeTab === 'abonnement' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-navy-100 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-navy-900 mb-4">Votre abonnement</h2>

                      {planLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 mb-5 p-4 bg-navy-50 rounded-xl">
                            <Shield className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${PLAN_COLORS[plan] ?? 'bg-slate-100 text-slate-700'}`}>
                                  Plan {PLAN_LABELS[plan] ?? plan}
                                </span>
                                {subscription?.status === 'trialing' && (
                                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Essai</span>
                                )}
                                {subscription?.status === 'active' && (
                                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Actif</span>
                                )}
                              </div>
                              {subscription?.current_period_end && (
                                <p className="text-xs text-navy-500">
                                  {subscription.status === 'trialing'
                                    ? `Essai gratuit — ${trialDaysLeft ?? 0} jour${(trialDaysLeft ?? 0) > 1 ? 's' : ''} restant${(trialDaysLeft ?? 0) > 1 ? 's' : ''}`
                                    : `Renouvellement le ${new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}`
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          {subscription?.stripe_customer_id ? (
                            <div className="space-y-3">
                              <button
                                onClick={() => void handleStripePortal()}
                                disabled={portalLoading}
                                className="w-full flex items-center justify-between px-4 py-3 border border-navy-200 rounded-xl text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-60 transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                  Gérer mon abonnement (Stripe)
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-navy-400" />
                              </button>
                              <p className="text-xs text-navy-400 px-1">
                                Modifiez votre mode de paiement, téléchargez vos factures Stripe ou résiliez votre abonnement depuis le portail Stripe.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                              <p className="text-sm font-medium text-amber-800 mb-1">Aucun abonnement Stripe</p>
                              <p className="text-xs text-amber-600 mb-3">Souscrivez à un plan payant pour accéder à toutes les fonctionnalités.</p>
                              <Link href="/pricing" className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                                Voir les plans <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── INTÉGRATIONS ────────────────────────────────────────── */}
                {activeTab === 'integrations' && (
                  <div className="space-y-3">
                    {[
                      { name: 'Cegid Loop', desc: 'Synchronisation bidirectionnelle des écritures comptables', href: '/parametres/integrations', status: 'configurer' },
                      { name: 'Sage',       desc: 'Export/import via Chift API',                               href: '/parametres/integrations', status: 'configurer' },
                      { name: 'GoCardless', desc: 'Connexion bancaire open banking',                           href: '/parametres/integrations', status: 'bientôt' },
                      { name: 'Slack',      desc: 'Notifications dans vos canaux Slack',                       href: '/parametres/integrations', status: 'bientôt' },
                    ].map(integ => (
                      <div key={integ.name} className="bg-white border border-navy-100 rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-navy-900 text-sm">{integ.name}</p>
                          <p className="text-xs text-navy-500 mt-0.5">{integ.desc}</p>
                        </div>
                        {integ.status === 'bientôt' ? (
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">Bientôt</span>
                        ) : (
                          <Link href={integ.href} className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-50 border border-navy-200 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-100 transition-colors whitespace-nowrap">
                            Configurer <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── NOTIFICATIONS ───────────────────────────────────────── */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-navy-100 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-navy-900 mb-4">Préférences email</h2>

                      <div className="space-y-4">
                        {[
                          { key: 'notif_email_relances' as const, label: 'Alertes relances', desc: 'Notifications par email quand des factures sont en retard de paiement' },
                          { key: 'notif_email_factures' as const, label: 'Nouvelles factures', desc: 'Confirmation lors de la création ou réception d\'une facture' },
                        ].map(notif => (
                          <div key={notif.key} className="flex items-start justify-between gap-4 py-3 border-b border-navy-50">
                            <div>
                              <p className="text-sm font-medium text-navy-900">{notif.label}</p>
                              <p className="text-xs text-navy-500 mt-0.5">{notif.desc}</p>
                            </div>
                            <button
                              onClick={() => pf(notif.key, !profile[notif.key])}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${profile[notif.key] ? 'bg-emerald-500' : 'bg-navy-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${profile[notif.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        ))}

                        <div className="py-3">
                          <label className="block text-sm font-medium text-navy-900 mb-1">Résumé périodique</label>
                          <p className="text-xs text-navy-500 mb-3">Fréquence de réception du récapitulatif de votre activité</p>
                          <select
                            value={profile.notif_email_digest}
                            onChange={e => pf('notif_email_digest', e.target.value)}
                            className="w-full max-w-xs bg-white border border-navy-200 rounded-xl px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          >
                            <option value="never">Jamais</option>
                            <option value="daily">Quotidien</option>
                            <option value="weekly">Hebdomadaire</option>
                            <option value="monthly">Mensuel</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => void saveProfile({
                            notif_email_relances: profile.notif_email_relances,
                            notif_email_factures: profile.notif_email_factures,
                            notif_email_digest: profile.notif_email_digest,
                          })}
                          disabled={saving}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── DANGER ──────────────────────────────────────────────── */}
                {activeTab === 'danger' && (
                  <div className="space-y-4">
                    {/* Export */}
                    <div className="bg-white border border-navy-100 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-navy-900 mb-1">Exporter mes données</h2>
                      <p className="text-sm text-navy-500 mb-4">
                        Conformément au RGPD (Art. 20), vous pouvez exporter l'ensemble de vos données.
                        L'export inclut vos transactions, factures et informations de compte.
                      </p>
                      <button className="flex items-center gap-2 px-4 py-2.5 border border-navy-200 rounded-xl text-sm font-medium text-navy-700 hover:bg-navy-50 transition-colors">
                        <Download className="w-4 h-4" />
                        Demander l'export de mes données
                      </button>
                      <p className="text-xs text-navy-400 mt-2">L'export vous sera envoyé par email sous 24h.</p>
                    </div>

                    {/* Sign out */}
                    <div className="bg-white border border-navy-100 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-navy-900 mb-1">Déconnexion</h2>
                      <p className="text-sm text-navy-500 mb-4">Déconnectez-vous de tous vos appareils.</p>
                      <button
                        onClick={async () => {
                          const supabase = createClient()
                          await supabase.auth.signOut()
                          router.push('/login')
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 border border-navy-200 rounded-xl text-sm font-medium text-navy-700 hover:bg-navy-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>

                    {/* Delete account */}
                    <div className="bg-white border-2 border-red-200 rounded-2xl p-6">
                      <h2 className="text-base font-semibold text-red-700 mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Supprimer mon compte
                      </h2>
                      <p className="text-sm text-navy-500 mb-4">
                        Cette action est irréversible. Toutes vos données (transactions, factures, paramètres) seront définitivement supprimées.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-300 rounded-xl text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer définitivement mon compte
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-navy-100">
              <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirmer la suppression
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-navy-600 mb-4">
                Cette action est <strong>irréversible</strong>. Tapez <code className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono text-xs">SUPPRIMER</code> pour confirmer.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full border border-red-300 rounded-xl px-3 py-2.5 text-sm font-mono text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
                  className="flex-1 px-4 py-2.5 text-sm text-navy-600 border border-navy-200 rounded-xl hover:bg-navy-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => void handleDeleteAccount()}
                  disabled={deletingAccount || deleteConfirm !== 'SUPPRIMER'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
