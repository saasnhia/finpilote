'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { SyncStatus } from '@/components/integrations/SyncStatus'
import {
  Plug, ExternalLink, FileText, AlertCircle,
  CheckCircle, Lock, Workflow, Zap, Copy,
} from 'lucide-react'

interface Connexion {
  id: string
  provider: string
  statut: 'connecte' | 'erreur' | 'inactif'
  derniere_synchro?: string | null
}

interface Provider {
  id: string
  nom: string
  description: string
  logo: string
  docUrl: string
  requiresEnv: string[]
}

const PROVIDERS: Provider[] = [
  {
    id: 'cegid_loop',
    nom: 'Cegid Loop',
    description: 'Synchronisation écritures, plan de comptes PCG, tiers et balance. OAuth2 officiel Cegid.',
    logo: 'CL',
    docUrl: 'https://developers.cegid.com',
    requiresEnv: ['CEGID_CLIENT_ID', 'CEGID_CLIENT_SECRET'],
  },
  {
    id: 'sage50',
    nom: 'Sage 50',
    description: 'Import factures, écritures et journaux Sage 50 via Chift API.',
    logo: 'S5',
    docUrl: 'https://app.chift.eu/docs',
    requiresEnv: ['CHIFT_API_KEY', 'CHIFT_CONSUMER_ID'],
  },
  {
    id: 'fec_manuel',
    nom: 'Import FEC manuel',
    description: 'Importez directement un fichier FEC (format DGFiP). Aucune connexion logiciel requise.',
    logo: 'FEC',
    docUrl: '/import-releve',
    requiresEnv: [],
  },
]

const N8N_WEBHOOKS = [
  { label: 'Facture reçue', path: '/api/webhooks/n8n/facture-recue', method: 'POST', desc: 'n8n pousse une facture fournisseur dans FinSoft' },
  { label: 'Sync Cegid', path: '/api/webhooks/n8n/sync-cegid', method: 'POST', desc: 'Import transactions depuis Cegid Loop' },
  { label: 'Sync Sage', path: '/api/webhooks/n8n/sync-sage', method: 'POST', desc: 'Import balance depuis Sage 50' },
  { label: 'Nouveau client', path: '/api/webhooks/n8n/nouveau-client', method: 'POST', desc: 'Création client depuis CRM/formulaire' },
  { label: 'Santé', path: '/api/webhooks/n8n/status', method: 'GET', desc: 'Ping de disponibilité FinSoft' },
]

export default function IntegrationsPage() {
  const [connexions, setConnexions] = useState<Connexion[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  useEffect(() => {
    const fetchConnexions = async () => {
      try {
        const res = await fetch('/api/integrations/connexions')
        if (res.ok) {
          const data = await res.json()
          setConnexions(data.connexions ?? [])
        }
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    fetchConnexions()
  }, [])

  const getConnexion = (providerId: string): Connexion | undefined =>
    connexions.find(c => c.provider === providerId)

  const handleConnect = async (provider: Provider) => {
    if (provider.id === 'fec_manuel') {
      window.location.href = '/import-releve'
      return
    }

    setConnecting(provider.id)
    try {
      if (provider.id === 'cegid_loop') {
        const res = await fetch('/api/integrations/cegid')
        const data = await res.json()
        if (data.authUrl) {
          window.open(data.authUrl, '_blank', 'width=600,height=700')
        } else {
          alert(data.error ?? 'Erreur lors de la connexion')
        }
      } else if (provider.id === 'sage50') {
        alert('Chift API — configurez CHIFT_API_KEY et CHIFT_CONSUMER_ID dans votre .env.local')
      }
    } finally {
      setConnecting(null)
    }
  }

  const handleSync = async (providerId: string) => {
    await fetch('/api/integrations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: providerId }),
    })
  }

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Connexions logiciels
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            Connectez FinSoft à votre logiciel comptable pour synchroniser automatiquement vos données.
          </p>
        </div>

        {/* Env vars warning */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Variables d&apos;environnement requises</p>
            <p>Ajoutez dans <code className="bg-amber-100 px-1 rounded font-mono text-xs">.env.local</code> :</p>
            <ul className="mt-1 space-y-0.5 font-mono text-xs">
              <li>CEGID_CLIENT_ID=&lt;depuis developers.cegid.com&gt;</li>
              <li>CEGID_CLIENT_SECRET=&lt;depuis developers.cegid.com&gt;</li>
              <li>CEGID_REDIRECT_URI=https://finpilote.vercel.app/api/integrations/cegid/callback</li>
              <li>CHIFT_API_KEY=&lt;depuis app.chift.eu&gt;</li>
              <li>CHIFT_CONSUMER_ID=&lt;depuis app.chift.eu&gt;</li>
            </ul>
          </div>
        </div>

        {/* Providers */}
        <div className="space-y-4">
          {PROVIDERS.map(provider => {
            const connexion = getConnexion(provider.id)
            const statut = connexion?.statut ?? 'inactif'
            const isConnected = statut === 'connecte'

            return (
              <Card key={provider.id} className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-navy-100 text-navy-600'}
                  `}>
                    {provider.logo}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-navy-900">
                        {provider.nom}
                      </h3>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Connecté
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-navy-500">{provider.description}</p>
                    {provider.requiresEnv.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Lock className="w-3 h-3 text-navy-400" />
                        <span className="text-xs text-navy-400 font-mono">
                          {provider.requiresEnv.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={provider.docUrl}
                      target={provider.id !== 'fec_manuel' ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors"
                      title="Documentation"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <Button
                      size="sm"
                      variant={isConnected ? 'outline' : 'primary'}
                      onClick={() => handleConnect(provider)}
                      loading={connecting === provider.id}
                      icon={<Plug className="w-4 h-4" />}
                    >
                      {isConnected ? 'Reconfigurer' : provider.id === 'fec_manuel' ? 'Importer' : 'Connecter'}
                    </Button>
                  </div>
                </div>

                {/* Sync status (only if connected or erreur) */}
                {connexion && statut !== 'inactif' && (
                  <SyncStatus
                    provider={provider.id}
                    statut={statut}
                    derniereSynchro={connexion.derniere_synchro}
                    onSync={() => handleSync(provider.id)}
                  />
                )}
              </Card>
            )
          })}
        </div>

        {/* ─── Section n8n ─── */}
        <div className="mt-10 mb-4 flex items-center gap-2">
          <Workflow className="w-5 h-5 text-brand-green-action" />
          <h2 className="text-lg font-display font-bold text-navy-900">Automatisation n8n</h2>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-brand-green-primary/10 text-brand-green-action font-medium">
            On-premise
          </span>
        </div>
        <p className="text-sm text-navy-500 mb-4">
          Connectez n8n à FinSoft pour automatiser vos workflows cabinet : archivage, notifications, synchronisation Cegid/Sage.
          Téléchargez les workflows prêts à l&apos;emploi dans <code className="font-mono text-xs bg-navy-100 px-1 rounded">n8n/workflows/</code>.
        </p>

        {/* n8n config block */}
        <Card className="mb-4 bg-neutral-950 border-white/10">
          <div className="flex items-start gap-3 mb-3">
            <Zap className="w-4 h-4 text-brand-green-action mt-0.5 flex-shrink-0" />
            <p className="text-sm text-neutral-300 font-medium">Variables .env.local</p>
          </div>
          <div className="font-mono text-xs text-neutral-400 space-y-1">
            <p><span className="text-brand-green-action">N8N_URL</span>=http://localhost:5678</p>
            <p><span className="text-brand-green-action">N8N_WEBHOOK_SECRET</span>=finsoft_n8n_secret_2026</p>
            <p><span className="text-brand-green-action">N8N_API_KEY</span>=&lt;clé API n8n&gt;</p>
          </div>
        </Card>

        {/* Webhook endpoints table */}
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-neutral-500 uppercase tracking-wider">
                <th className="text-left px-4 py-2.5">Webhook</th>
                <th className="text-left px-4 py-2.5 hidden sm:table-cell">Description</th>
                <th className="px-4 py-2.5 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {N8N_WEBHOOKS.map((wh) => (
                <tr key={wh.path} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${wh.method === 'POST' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {wh.method}
                      </span>
                      <span className="font-mono text-xs text-neutral-300 truncate">{wh.path}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 hidden sm:table-cell">{wh.desc}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyToClipboard(wh.path, wh.path)}
                      className="p-1.5 rounded hover:bg-white/5 text-neutral-500 hover:text-neutral-300 transition-colors"
                      title="Copier le chemin"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copied === wh.path && (
                      <span className="text-[10px] text-brand-green-action ml-1">Copié</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Workflows download links */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { file: '01-cron-rappels-slack.json', label: 'CRON Rappels → Slack' },
            { file: '02-audit-rapport-gdrive.json', label: 'Audit → Google Drive' },
            { file: '03-alertes-critiques-email.json', label: 'Alertes critiques → Email' },
            { file: '04-nouveau-dossier-notion.json', label: 'Dossier → Notion' },
            { file: '05-import-bancaire-rapprochement.json', label: 'Import → Rapprochement' },
          ].map(wf => (
            <a
              key={wf.file}
              href={`/n8n/workflows/${wf.file}`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
            >
              <Workflow className="w-3 h-3" />
              {wf.label}
            </a>
          ))}
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
