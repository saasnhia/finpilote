'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useTVADeclarations } from '@/hooks/useTVADeclarations'
import { Card, Button, Input } from '@/components/ui'
import { TVACalculationBreakdown } from '@/components/tva/TVACalculationBreakdown'
import { ArrowLeft, Calculator, Loader2, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { TVACalculationResult } from '@/types'

export default function NouvelleDéclarationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { calculateTVA, generateCA3 } = useTVADeclarations(user?.id)

  const [periodeDebut, setPeriodeDebut] = useState('')
  const [periodeFin, setPeriodeFin] = useState('')
  const [regime, setRegime] = useState<'reel_normal' | 'reel_simplifie'>('reel_normal')
  const [calculating, setCalculating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<TVACalculationResult | null>(null)

  const handleCalculate = async () => {
    if (!periodeDebut || !periodeFin) {
      toast.error('Veuillez sélectionner une période')
      return
    }

    setCalculating(true)
    const response = await calculateTVA(periodeDebut, periodeFin)
    setCalculating(false)

    if (response.success && response.result) {
      setResult(response.result)
      toast.success('TVA calculée avec succès')
    } else {
      toast.error(response.error || 'Erreur lors du calcul')
    }
  }

  const handleGenerate = async () => {
    if (!periodeDebut || !periodeFin) {
      toast.error('Veuillez sélectionner une période')
      return
    }

    setGenerating(true)
    const response = await generateCA3(periodeDebut, periodeFin, regime)
    setGenerating(false)

    if (response.success && response.declaration) {
      toast.success('Déclaration CA3 générée')
      router.push(`/tva/ca3/${response.declaration.id}`)
    } else {
      toast.error(response.error || 'Erreur lors de la génération')
    }
  }

  // Set default period (previous month)
  const setDefaultPeriod = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)

    setPeriodeDebut(firstDay.toISOString().split('T')[0])
    setPeriodeFin(lastDay.toISOString().split('T')[0])
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tva"
          className="inline-flex items-center gap-2 text-sm text-navy-600 hover:text-navy-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux déclarations
        </Link>
        <h1 className="text-2xl font-display font-bold text-navy-900">
          Nouvelle déclaration TVA
        </h1>
        <p className="text-sm text-navy-500 mt-1">
          Sélectionnez une période pour calculer automatiquement votre TVA
        </p>
      </div>

      {/* Period Selection */}
      <Card className="mb-6">
        <h3 className="font-semibold text-navy-900 mb-4">Période de déclaration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Date de début"
            type="date"
            value={periodeDebut}
            onChange={e => setPeriodeDebut(e.target.value)}
          />
          <Input
            label="Date de fin"
            type="date"
            value={periodeFin}
            onChange={e => setPeriodeFin(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-navy-700 mb-2">Régime TVA</label>
          <select
            value={regime}
            onChange={e => setRegime(e.target.value as 'reel_normal' | 'reel_simplifie')}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="reel_normal">Réel Normal (mensuel)</option>
            <option value="reel_simplifie">Réel Simplifié (annuel)</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={setDefaultPeriod}
            variant="outline"
            className="flex-1"
          >
            Mois dernier
          </Button>
          <Button
            onClick={handleCalculate}
            disabled={calculating || !periodeDebut || !periodeFin}
            icon={calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            className="flex-1"
          >
            {calculating ? 'Calcul en cours...' : 'Calculer la TVA'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <>
          <TVACalculationBreakdown result={result} />

          <Card className="mt-6">
            <div className="text-center">
              <h3 className="font-semibold text-navy-900 mb-2">Générer la déclaration CA3</h3>
              <p className="text-sm text-navy-500 mb-4">
                Le formulaire CA3 sera pré-rempli avec les montants calculés
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                icon={generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                className="w-full"
              >
                {generating ? 'Génération...' : 'Générer la déclaration CA3'}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
