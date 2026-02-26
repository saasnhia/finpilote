'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { TVAStatusBadge } from '@/components/tva/TVAStatusBadge'
import type { DeclarationTVA } from '@/types'
import {
  ArrowLeft,
  Calendar,
  Euro,
  CheckCircle,
  Send,
  Loader2,
  Download,
  FileText,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface LigneCA3 {
  id: string
  declaration_id: string
  ligne_numero: number
  libelle: string
  base_imposable: number | null
  montant_tva: number | null
}

function formatEuro(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function TVADetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [declaration, setDeclaration] = useState<DeclarationTVA | null>(null)
  const [lignes, setLignes] = useState<LigneCA3[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/tva/declarations/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setDeclaration(data.declaration)
          setLignes(data.lignes || [])
        } else {
          toast.error(data.error || 'Déclaration introuvable')
        }
      })
      .catch(() => toast.error('Erreur réseau'))
      .finally(() => setLoading(false))
  }, [id])

  const handleValidate = async () => {
    if (!declaration) return
    setValidating(true)
    try {
      const res = await fetch(`/api/tva/declarations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'validee',
          date_validation: new Date().toISOString().split('T')[0],
        }),
      })
      const data = await res.json()
      if (data.success) {
        setDeclaration(data.declaration)
        toast.success('Déclaration validée')
      } else {
        toast.error(data.error || 'Erreur lors de la validation')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </AppShell>
    )
  }

  if (!declaration) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Déclaration introuvable</h2>
            <Link href="/tva">
              <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>
                Retour aux déclarations
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const periode = new Date(declaration.periode_debut).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/tva">
              <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Déclaration CA3 — {periode}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {declaration.regime === 'reel_normal' ? 'Régime réel normal' : 'Régime réel simplifié'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TVAStatusBadge statut={declaration.statut} />
            {declaration.statut === 'brouillon' && (
              <Button
                onClick={handleValidate}
                disabled={validating}
                icon={validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              >
                {validating ? 'Validation…' : 'Valider'}
              </Button>
            )}
            {declaration.statut === 'validee' && (
              <Button
                variant="outline"
                icon={<Send className="w-4 h-4" />}
                onClick={() => toast.success('Export CERFA disponible en V2')}
              >
                Envoyer aux impôts
              </Button>
            )}
            <Button
              variant="ghost"
              icon={<Download className="w-4 h-4" />}
              onClick={() => toast.success('Export PDF disponible en V2')}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">TVA Collectée</p>
                <p className="text-xl font-bold text-emerald-400">
                  {formatEuro(declaration.tva_collectee)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">TVA Déductible</p>
                <p className="text-xl font-bold text-red-400">
                  {formatEuro(declaration.tva_deductible)}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${declaration.tva_nette >= 0 ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                <Euro className={`w-5 h-5 ${declaration.tva_nette >= 0 ? 'text-amber-400' : 'text-blue-400'}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">
                  {declaration.tva_nette >= 0 ? 'TVA à Payer' : 'Crédit TVA'}
                </p>
                <p className={`text-xl font-bold ${declaration.tva_nette >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                  {formatEuro(Math.abs(declaration.tva_nette))}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Dates */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Informations de la déclaration
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Période début</p>
              <p className="text-sm font-medium text-white">{formatDate(declaration.periode_debut)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Période fin</p>
              <p className="text-sm font-medium text-white">{formatDate(declaration.periode_fin)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Date validation</p>
              <p className="text-sm font-medium text-white">{formatDate(declaration.date_validation)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Date envoi</p>
              <p className="text-sm font-medium text-white">{formatDate(declaration.date_envoi)}</p>
            </div>
          </div>
        </Card>

        {/* Détail par taux */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Détail par taux de TVA</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 text-slate-400 font-medium">Taux</th>
                  <th className="text-right py-2 text-slate-400 font-medium">Ventes HT</th>
                  <th className="text-right py-2 text-slate-400 font-medium">TVA collectée</th>
                  <th className="text-right py-2 text-slate-400 font-medium">Achats HT</th>
                  <th className="text-right py-2 text-slate-400 font-medium">TVA déductible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {([['20%', declaration.ventes_tva_20, declaration.achats_tva_20],
                   ['10%', declaration.ventes_tva_10, declaration.achats_tva_10],
                   ['5,5%', declaration.ventes_tva_55, declaration.achats_tva_55],
                   ['2,1%', declaration.ventes_tva_21, declaration.achats_tva_21]] as [string, number, number][])
                  .filter(([, v, a]) => (v || 0) + (a || 0) > 0)
                  .map(([taux, ventes, achats]) => (
                    <tr key={taux}>
                      <td className="py-2 text-white font-medium">{taux}</td>
                      <td className="py-2 text-right text-slate-300">{formatEuro(ventes)}</td>
                      <td className="py-2 text-right text-emerald-400">{formatEuro((ventes || 0) * parseFloat(taux) / 100)}</td>
                      <td className="py-2 text-right text-slate-300">{formatEuro(achats)}</td>
                      <td className="py-2 text-right text-red-400">{formatEuro((achats || 0) * parseFloat(taux) / 100)}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="border-t border-slate-600">
                <tr>
                  <td className="py-2 font-semibold text-white">Total</td>
                  <td className="py-2 text-right font-semibold text-white">{formatEuro(declaration.montant_ht)}</td>
                  <td className="py-2 text-right font-semibold text-emerald-400">{formatEuro(declaration.tva_collectee)}</td>
                  <td className="py-2 text-right"></td>
                  <td className="py-2 text-right font-semibold text-red-400">{formatEuro(declaration.tva_deductible)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Lignes CA3 si disponibles */}
        {lignes.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Formulaire CA3</h2>
            <div className="space-y-1">
              {lignes.map(l => (
                <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <span className="text-xs text-slate-400">
                    <span className="font-mono text-slate-500 mr-2">Ligne {l.ligne_numero}</span>
                    {l.libelle}
                  </span>
                  <div className="flex gap-6 text-xs font-mono">
                    {l.base_imposable != null && (
                      <span className="text-slate-300">{formatEuro(l.base_imposable)}</span>
                    )}
                    {l.montant_tva != null && (
                      <span className="text-emerald-400">{formatEuro(l.montant_tva)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes */}
        {declaration.notes && (
          <Card>
            <h2 className="text-sm font-semibold text-slate-300 mb-2">Notes</h2>
            <p className="text-sm text-slate-400 whitespace-pre-wrap">{declaration.notes}</p>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
