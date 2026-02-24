'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  User,
  Building2,
  Bell,
  Shield,
  LogOut,
  Loader2,
  Save,
  Trash2,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type ProfileType = 'cabinet' | 'entreprise'

const PROFILE_LABELS: Record<ProfileType, { emoji: string; label: string; desc: string }> = {
  cabinet: { emoji: '🏢', label: 'Cabinet comptable', desc: 'Gestion multi-dossiers, balance âgée, TVA par dossier' },
  entreprise: { emoji: '📊', label: 'Entreprise / TPE / PME', desc: 'Encours clients, fournisseurs, trésorerie, rapprochement' },
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileType, setProfileType] = useState<ProfileType | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSwitching, setProfileSwitching] = useState(false)

  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    companyName: '',
    email: user?.email || '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/settings/profile')
        const json = await res.json()
        if (json.success) setProfileType(json.profile_type as ProfileType)
      } catch { /* silent */ }
      finally { setProfileLoading(false) }
    }
    if (user) fetchProfile()
    else setProfileLoading(false)
  }, [user])

  const handleSwitchProfile = async () => {
    setProfileSwitching(true)
    try {
      const res = await fetch('/api/settings/profile', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success('Redirection vers l\'onboarding…')
        router.push('/onboarding')
      } else {
        toast.error(json.error ?? 'Erreur lors de la réinitialisation')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setProfileSwitching(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-navy-500">Chargement...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-navy-900">
            Paramètres
          </h1>
          <p className="mt-1 text-navy-500">
            Gérez votre compte et vos préférences
          </p>
        </div>

        <div className="space-y-6">
          {/* Mon profil FinSoft */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Mon profil FinSoft
                </h2>
                <p className="text-sm text-navy-500">
                  Adapte votre tableau de bord à votre usage
                </p>
              </div>
            </div>

            {profileLoading ? (
              <div className="flex items-center gap-2 text-sm text-navy-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement du profil…
              </div>
            ) : profileType ? (
              <div className="flex items-center justify-between p-4 bg-navy-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{PROFILE_LABELS[profileType].emoji}</span>
                  <div>
                    <p className="font-semibold text-navy-900">{PROFILE_LABELS[profileType].label}</p>
                    <p className="text-xs text-navy-500 mt-0.5">{PROFILE_LABELS[profileType].desc}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSwitchProfile}
                  loading={profileSwitching}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Changer de profil
                </Button>
              </div>
            ) : null}
          </Card>

          {/* Profile Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-navy-100 rounded-lg">
                <User className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Profil
                </h2>
                <p className="text-sm text-navy-500">
                  Informations personnelles
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Nom complet"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(d => ({ ...d, fullName: e.target.value }))}
                  placeholder="Jean Dupont"
                  disabled={!user}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(d => ({ ...d, email: e.target.value }))}
                  disabled
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                icon={<Save className="w-4 h-4" />}
                disabled={!user}
              >
                Enregistrer
              </Button>
            </form>
          </Card>

          {/* Company Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Building2 className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Entreprise
                </h2>
                <p className="text-sm text-navy-500">
                  Informations de votre société
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Nom de l'entreprise"
                value={profileData.companyName}
                onChange={(e) => setProfileData(d => ({ ...d, companyName: e.target.value }))}
                placeholder="Ma Société SARL"
                disabled={!user}
              />
              
              <p className="text-sm text-navy-500">
                Ces informations apparaîtront sur vos rapports exportés.
              </p>
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Bell className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Notifications
                </h2>
                <p className="text-sm text-navy-500">
                  Gérez vos alertes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-navy-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium text-navy-900">Alerte seuil de rentabilité</p>
                  <p className="text-sm text-navy-500">
                    Recevez une alerte quand vous approchez du SR
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-navy-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={!user}
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-navy-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium text-navy-900">Rapport mensuel</p>
                  <p className="text-sm text-navy-500">
                    Recevez un récapitulatif chaque mois
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-navy-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={!user}
                />
              </label>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Shield className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-navy-900">
                  Sécurité
                </h2>
                <p className="text-sm text-navy-500">
                  Gérez votre compte
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {user && (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Déconnexion
                </Button>
              )}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-coral-200 bg-coral-50/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-coral-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-coral-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-coral-900">
                  Zone dangereuse
                </h2>
                <p className="text-sm text-coral-700">
                  Actions irréversibles
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-coral-700">
                La suppression de votre compte effacera définitivement toutes vos données.
                Cette action est irréversible.
              </p>
              
              <Button
                variant="danger"
                disabled={!user}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Supprimer mon compte
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </AppShell>
  )
}
