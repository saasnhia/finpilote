'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { SyncStatus } from '@/components/integrations/SyncStatus'
import {
  Plug, ExternalLink, FileText, AlertCircle,
  CheckCircle, Lock,
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

export default function IntegrationsPage() {
  const [connexions, setConnexions] = useState<Connexion[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

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

  // Avoid unused variable warning during loading
  void loading

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
