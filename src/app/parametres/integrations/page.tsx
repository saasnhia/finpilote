'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { SyncStatus } from '@/components/integrations/SyncStatus'
import {
  Plug, ExternalLink, FileText, AlertCircle,
  CheckCircle, Lock, RefreshCw,
} from 'lucide-react'

interface ErpStatus {
  configured: boolean
  connected: boolean
  sync_status: 'idle' | 'syncing' | 'error' | 'success'
  last_sync_at: string | null
  synced_count: number
  sync_error: string | null
  // Sage only
  chift_company_id?: string | null
}

const DEFAULT_STATUS: ErpStatus = {
  configured: false,
  connected: false,
  sync_status: 'idle',
  last_sync_at: null,
  synced_count: 0,
  sync_error: null,
}

export default function IntegrationsPage() {
  const [cegidStatus, setCegidStatus] = useState<ErpStatus>(DEFAULT_STATUS)
  const [sageStatus, setSageStatus] = useState<ErpStatus>(DEFAULT_STATUS)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [sageCompanyId, setSageCompanyId] = useState('')
  const [flashMsg, setFlashMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const flash = (type: 'success' | 'error', text: string) => {
    setFlashMsg({ type, text })
    setTimeout(() => setFlashMsg(null), 5000)
  }

  const loadStatuses = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/integrations/cegid/status'),
        fetch('/api/integrations/sage/status'),
      ])
      if (cRes.ok) {
        const d = await cRes.json() as ErpStatus & { success: boolean }
        setCegidStatus(d)
      }
      if (sRes.ok) {
        const d = await sRes.json() as ErpStatus & { success: boolean }
        setSageStatus(d)
        if (d.chift_company_id) setSageCompanyId(d.chift_company_id)
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatuses()

    // Gestion des redirections OAuth (lecture côté client uniquement)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const connected = params.get('connected')
      const err = params.get('error')
      if (connected === 'cegid') flash('success', 'Cegid connecté avec succès !')
      if (err === 'cegid_no_code') flash('error', 'Connexion Cegid annulée ou code manquant.')
      if (err === 'cegid_callback') flash('error', 'Erreur lors de la connexion Cegid.')
      if (err === 'encryption_not_configured') flash('error', 'INTEGRATION_ENCRYPTION_KEY non configurée.')
    }
  }, [loadStatuses])

  const handleCegidConnect = async () => {
    setConnecting('cegid')
    try {
      const res = await fetch('/api/integrations/cegid/connect', { method: 'POST' })
      const data = await res.json() as { authUrl?: string; error?: string }
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        flash('error', data.error ?? 'Erreur lors de la connexion Cegid')
      }
    } catch {
      flash('error', 'Erreur réseau')
    } finally {
      setConnecting(null)
    }
  }

  const handleSageConnect = async () => {
    if (!sageCompanyId.trim()) {
      flash('error', 'Entrez votre Chift company ID')
      return
    }
    setConnecting('sage')
    try {
      const res = await fetch('/api/integrations/sage/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chift_company_id: sageCompanyId.trim() }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (data.success) {
        flash('success', 'Sage 50 configuré avec succès !')
        await loadStatuses()
      } else {
        flash('error', data.error ?? 'Erreur lors de la connexion Sage')
      }
    } catch {
      flash('error', 'Erreur réseau')
    } finally {
      setConnecting(null)
    }
  }

  const handleSync = async (provider: 'cegid' | 'sage') => {
    setSyncing(provider)
    try {
      const res = await fetch(`/api/integrations/${provider}/sync`, { method: 'POST' })
      const data = await res.json() as { success?: boolean; synced_count?: number; error?: string }
      if (data.success) {
        flash('success', `${provider === 'cegid' ? 'Cegid' : 'Sage'} — ${data.synced_count ?? 0} écriture(s) synchronisée(s)`)
        await loadStatuses()
      } else {
        flash('error', data.error ?? 'Erreur de synchronisation')
      }
    } catch {
      flash('error', 'Erreur réseau')
    } finally {
      setSyncing(null)
    }
  }

  void loading

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Connexions logiciels
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            Connectez FinSoft à votre logiciel comptable pour synchroniser automatiquement vos données chaque nuit à 2h00.
          </p>
        </div>

        {/* Flash message */}
        {flashMsg && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
            flashMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {flashMsg.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {flashMsg.text}
          </div>
        )}

        {/* Env vars warning */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Variables d&apos;environnement requises</p>
            <ul className="mt-1 space-y-0.5 font-mono text-xs">
              <li>INTEGRATION_ENCRYPTION_KEY=&lt;64 hex chars&gt;</li>
              <li>CEGID_CLIENT_ID / CEGID_CLIENT_SECRET</li>
              <li>CEGID_REDIRECT_URI=https://finpilote.vercel.app/api/integrations/cegid/callback</li>
              <li>CHIFT_API_KEY / CHIFT_CONSUMER_ID</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── CEGID LOOP ── */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                cegidStatus.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-navy-100 text-navy-600'
              }`}>
                CL
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-semibold text-navy-900">Cegid Loop</h3>
                  {cegidStatus.connected && (
                    <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle className="w-3 h-3" /> Connecté
                    </span>
                  )}
                  {!cegidStatus.configured && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Non configuré
                    </span>
                  )}
                </div>
                <p className="text-sm text-navy-500">
                  Synchronisation écritures, plan de comptes PCG, tiers et balance. OAuth2 officiel Cegid.
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Lock className="w-3 h-3 text-navy-400" />
                  <span className="text-xs text-navy-400 font-mono">CEGID_CLIENT_ID, CEGID_CLIENT_SECRET</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href="https://developers.cegid.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors"
                  title="Documentation Cegid"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {cegidStatus.connected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleSync('cegid')}
                    loading={syncing === 'cegid'}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Synchroniser
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={cegidStatus.connected ? 'outline' : 'primary'}
                  onClick={() => void handleCegidConnect()}
                  loading={connecting === 'cegid'}
                  icon={<Plug className="w-4 h-4" />}
                  disabled={!cegidStatus.configured}
                >
                  {cegidStatus.connected ? 'Reconfigurer' : 'Connecter'}
                </Button>
              </div>
            </div>

            {cegidStatus.connected && (
              <SyncStatus
                provider="cegid"
                statut={
                  cegidStatus.sync_status === 'error' ? 'erreur'
                  : cegidStatus.sync_status === 'idle' || cegidStatus.sync_status === 'syncing' ? 'inactif'
                  : 'connecte'
                }
                derniereSynchro={cegidStatus.last_sync_at}
                onSync={() => handleSync('cegid')}
              />
            )}

            {cegidStatus.sync_error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-mono">
                {cegidStatus.sync_error}
              </p>
            )}
          </Card>

          {/* ── SAGE 50 via Chift ── */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                sageStatus.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-navy-100 text-navy-600'
              }`}>
                S5
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-semibold text-navy-900">Sage 50</h3>
                  {sageStatus.connected && (
                    <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle className="w-3 h-3" /> Connecté
                    </span>
                  )}
                  {!sageStatus.configured && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Non configuré
                    </span>
                  )}
                </div>
                <p className="text-sm text-navy-500">
                  Import factures, écritures et journaux Sage 50 via Chift API. Connectez d&apos;abord Sage sur{' '}
                  <a href="https://app.chift.eu" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
                    app.chift.eu
                  </a>, puis entrez votre Company ID ci-dessous.
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Lock className="w-3 h-3 text-navy-400" />
                  <span className="text-xs text-navy-400 font-mono">CHIFT_API_KEY, CHIFT_CONSUMER_ID</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href="https://app.chift.eu/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors"
                  title="Documentation Chift"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {sageStatus.connected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleSync('sage')}
                    loading={syncing === 'sage'}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Synchroniser
                  </Button>
                )}
              </div>
            </div>

            {/* Chift Company ID input */}
            <div className="flex items-center gap-3 pt-2 border-t border-navy-100">
              <div className="flex-1">
                <label className="block text-xs font-medium text-navy-600 mb-1">
                  Chift Company ID
                </label>
                <input
                  type="text"
                  value={sageCompanyId}
                  onChange={e => setSageCompanyId(e.target.value)}
                  placeholder="ex. comp_xxxxxxxx"
                  disabled={!sageStatus.configured}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 font-mono"
                />
                <p className="mt-1.5 text-xs text-navy-400">
                  Obtenez votre ID Chift sur{' '}
                  <a
                    href="https://app.chift.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline"
                  >
                    app.chift.eu
                  </a>{' '}
                  — rubrique Companies.
                </p>
              </div>
              <div className="flex-shrink-0 pt-5">
                <Button
                  size="sm"
                  variant={sageStatus.connected ? 'outline' : 'primary'}
                  onClick={() => void handleSageConnect()}
                  loading={connecting === 'sage'}
                  icon={<Plug className="w-4 h-4" />}
                  disabled={!sageStatus.configured}
                >
                  {sageStatus.connected ? 'Mettre à jour' : 'Configurer'}
                </Button>
              </div>
            </div>

            {sageStatus.connected && (
              <SyncStatus
                provider="sage"
                statut={
                  sageStatus.sync_status === 'error' ? 'erreur'
                  : sageStatus.sync_status === 'idle' || sageStatus.sync_status === 'syncing' ? 'inactif'
                  : 'connecte'
                }
                derniereSynchro={sageStatus.last_sync_at}
                onSync={() => handleSync('sage')}
              />
            )}

            {sageStatus.sync_error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-mono">
                {sageStatus.sync_error}
              </p>
            )}
          </Card>
        </div>

        {/* FEC manual upload shortcut */}
        <Card className="mt-6 flex items-center gap-4 bg-navy-50 !border-navy-200">
          <FileText className="w-8 h-8 text-navy-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-navy-800 text-sm">Import FEC manuel</p>
            <p className="text-xs text-navy-500">
              Importez un fichier FEC DGFiP (.txt, .csv) — fonctionne avec tous les logiciels comptables
            </p>
          </div>
          <a href="/import-releve" className="text-sm font-medium text-emerald-600 hover:underline whitespace-nowrap">
            Importer →
          </a>
        </Card>
      </div>
    </AppShell>
  )
}
