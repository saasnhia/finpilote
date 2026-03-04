'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useUserPlan } from '@/hooks/useUserPlan'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Plus, Copy, Link2, ToggleLeft, ToggleRight,
  Trash2, Loader2, X, CheckCircle2, Clock,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortailClient {
  id: string
  client_nom: string
  token: string
  actif: boolean
  derniere_connexion: string | null
  created_at: string
}

// ─── Plan gate ────────────────────────────────────────────────────────────────

function CabinetBanner() {
  return (
    <Card className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-navy-900 mb-2">Portail clients simplifié</h2>
      <p className="text-sm text-navy-500 max-w-sm mb-6">
        Partagez un espace sécurisé avec vos clients pour recevoir leurs documents et partager leurs factures.
        Disponible avec le plan <strong>Cabinet</strong>.
      </p>
      <Link href="/pricing" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors">
        Voir les plans
      </Link>
    </Card>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PortailCabinetPage() {
  const { user } = useAuth()
  const { plan, loading: planLoading } = useUserPlan()
  const isCabinet = plan === 'cabinet' || plan === 'pro'

  const [portails, setPortails] = useState<PortailClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [clientNom, setClientNom] = useState('')
  const [saving, setSaving] = useState(false)

  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://worthifast.vercel.app'

  const fetchPortails = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('portails_client')
        .select('*')
        .eq('cabinet_user_id', user.id)
        .order('created_at', { ascending: false })
      setPortails((data ?? []) as PortailClient[])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => {
    if (user?.id && isCabinet) void fetchPortails()
    else if (!planLoading) setLoading(false)
  }, [user?.id, isCabinet, planLoading, fetchPortails])

  const handleCreate = async () => {
    if (!user?.id || !clientNom.trim()) { toast.error('Le nom du client est requis'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('portails_client').insert({
        cabinet_user_id: user.id,
        client_nom: clientNom.trim(),
      })
      if (error) throw error
      toast.success('Portail créé')
      setShowModal(false)
      setClientNom('')
      void fetchPortails()
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = (token: string) => {
    const url = `${BASE_URL}/portail/client/${token}`
    void navigator.clipboard.writeText(url)
    toast.success('Lien copié !')
  }

  const handleToggle = async (portail: PortailClient) => {
    try {
      const supabase = createClient()
      await supabase.from('portails_client').update({ actif: !portail.actif }).eq('id', portail.id)
      toast.success(portail.actif ? 'Portail désactivé' : 'Portail activé')
      void fetchPortails()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce portail client ?')) return
    try {
      const supabase = createClient()
      await supabase.from('portails_client').delete().eq('id', id)
      toast.success('Portail supprimé')
      void fetchPortails()
    } catch { toast.error('Erreur') }
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-navy-900">Portail clients</h1>
              <p className="text-sm text-navy-500">Partagez un espace sécurisé avec chaque client</p>
            </div>
          </div>
          {isCabinet && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau portail
            </button>
          )}
        </div>

        {/* Plan gate */}
        {planLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : !isCabinet ? (
          <CabinetBanner />
        ) : (
          <>
            {/* Info banner */}
            <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
              <Link2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Comment ça fonctionne ?</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Générez un lien sécurisé pour chaque client. Ils pourront y déposer leurs documents et consulter leurs factures sans créer de compte.
                </p>
              </div>
            </div>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-display font-semibold text-navy-900">
                  Portails actifs ({portails.filter(p => p.actif).length}/{portails.length})
                </h2>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-navy-50 animate-pulse rounded-lg" />)}
                </div>
              ) : portails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-10 h-10 text-navy-300 mb-3" />
                  <p className="text-sm font-medium text-navy-600">Aucun portail créé</p>
                  <p className="text-xs text-navy-400 mt-1">Créez votre premier portail client pour commencer</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Créer un portail
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {portails.map(portail => (
                    <div
                      key={portail.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        portail.actif ? 'border-navy-100 bg-white' : 'border-navy-100 bg-navy-50/50 opacity-70'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                        portail.actif ? 'bg-blue-100 text-blue-700' : 'bg-navy-100 text-navy-500'
                      }`}>
                        {portail.client_nom.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-navy-900">{portail.client_nom}</p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            portail.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-navy-100 text-navy-500'
                          }`}>
                            {portail.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-navy-400 font-mono truncate max-w-[200px]">
                            /portail/client/{portail.token.slice(0, 8)}…
                          </p>
                          {portail.derniere_connexion ? (
                            <p className="text-xs text-navy-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Dernière connexion {new Date(portail.derniere_connexion).toLocaleDateString('fr-FR')}
                            </p>
                          ) : (
                            <p className="text-xs text-navy-400">Jamais connecté</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleCopyLink(portail.token)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copier le lien
                        </button>
                        <button
                          onClick={() => void handleToggle(portail)}
                          title={portail.actif ? 'Désactiver' : 'Activer'}
                          className="p-2 text-navy-500 hover:bg-navy-50 rounded-lg transition-colors"
                        >
                          {portail.actif
                            ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                            : <ToggleLeft className="w-5 h-5 text-navy-400" />}
                        </button>
                        <button
                          onClick={() => void handleDelete(portail.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* What the client sees */}
            <Card className="mt-6">
              <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Ce que voit le client via son lien
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-navy-600">
                <div className="p-3 bg-navy-50 rounded-lg">
                  <p className="font-medium text-navy-700 mb-1">📤 Documents à transmettre</p>
                  <p>Upload par glisser-déposer, statut reçu/en attente</p>
                </div>
                <div className="p-3 bg-navy-50 rounded-lg">
                  <p className="font-medium text-navy-700 mb-1">📄 Mes factures</p>
                  <p>Liste des factures émises, téléchargement PDF</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-navy-100">
              <h2 className="text-lg font-display font-bold text-navy-900">Nouveau portail client</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-navy-50 rounded-lg">
                <X className="w-5 h-5 text-navy-500" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-navy-700 mb-2">Nom du client *</label>
              <input
                type="text"
                value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void handleCreate()}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Ex: Cabinet Moreau, M. Dupont…"
                autoFocus
              />
              <p className="text-xs text-navy-400 mt-2">Un lien unique sera généré et partageable avec ce client.</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-navy-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-navy-600 hover:bg-navy-50 rounded-lg">
                Annuler
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={saving || !clientNom.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer le portail
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
