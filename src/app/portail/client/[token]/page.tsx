import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ token: string }>
}

interface PortailRow {
  id: string
  client_nom: string
  actif: boolean
}

export default async function PortailClientPublicPage({ params }: Props) {
  const { token } = await params

  const supabase = await createClient()
  const { data: portail } = await supabase
    .from('portails_client')
    .select('id, client_nom, actif')
    .eq('token', token)
    .eq('actif', true)
    .single()

  if (!portail) notFound()

  const p = portail as PortailRow

  // Track last connection (fire and forget)
  void supabase
    .from('portails_client')
    .update({ derniere_connexion: new Date().toISOString() })
    .eq('token', token)
    .then(() => {})

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Worthifast</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Espace sécurisé
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-medium mb-3">
            🔒 Espace sécurisé — {p.client_nom}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {p.client_nom}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Votre espace personnel pour transmettre des documents et consulter vos factures.
          </p>
        </div>

        {/* Section 1: Documents à transmettre */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📤</span>
            <h2 className="text-base font-semibold text-gray-900">Documents à transmettre</h2>
          </div>

          {/* Upload zone */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-emerald-300 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📎</span>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Glissez vos fichiers ici</p>
            <p className="text-xs text-gray-400">PDF, images, Excel — 50 Mo max par fichier</p>
            <p className="text-xs text-emerald-600 font-medium mt-2">ou cliquez pour sélectionner</p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documents demandés</p>
              <p className="text-xs text-gray-400">Statut</p>
            </div>
            <div className="py-3 text-center text-sm text-gray-400">
              Aucun document demandé pour le moment
            </div>
          </div>
        </div>

        {/* Section 2: Mes factures */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📄</span>
            <h2 className="text-base font-semibold text-gray-900">Mes factures</h2>
          </div>

          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">Aucune facture disponible pour le moment</p>
            <p className="text-xs text-gray-300 mt-1">
              Vos factures apparaîtront ici dès qu'elles seront émises par votre cabinet.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Cet espace est sécurisé et accessible uniquement via ce lien personnel.
          </p>
          <p className="text-xs text-gray-300 mt-1">Propulsé par Worthifast — Hébergé en France 🇫🇷</p>
        </div>
      </main>
    </div>
  )
}
