import type { TVACalculationResult } from '@/types'
import { Card } from '@/components/ui'
import { TrendingUp, TrendingDown, MinusCircle } from 'lucide-react'

interface TVACalculationBreakdownProps {
  result: TVACalculationResult
}

export function TVACalculationBreakdown({ result }: TVACalculationBreakdownProps) {
  const { ventes, achats, tva_nette } = result

  return (
    <div className="space-y-6">
      {/* Ventes */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">TVA Collectée (Ventes)</h3>
            <p className="text-sm text-navy-500">
              {ventes.par_taux.taux_20.count +
                ventes.par_taux.taux_10.count +
                ventes.par_taux.taux_55.count +
                ventes.par_taux.taux_21.count}{' '}
              transaction(s)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Taux 20% */}
          {ventes.par_taux.taux_20.ttc > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-navy-900">Taux 20%</p>
                <p className="text-xs text-navy-500">{ventes.par_taux.taux_20.count} vente(s)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-900">
                  {ventes.par_taux.taux_20.tva.toFixed(2)} € TVA
                </p>
                <p className="text-xs text-navy-500">
                  Base HT: {ventes.par_taux.taux_20.ht.toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          {/* Taux 10% */}
          {ventes.par_taux.taux_10.ttc > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-navy-900">Taux 10%</p>
                <p className="text-xs text-navy-500">{ventes.par_taux.taux_10.count} vente(s)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-900">
                  {ventes.par_taux.taux_10.tva.toFixed(2)} € TVA
                </p>
                <p className="text-xs text-navy-500">
                  Base HT: {ventes.par_taux.taux_10.ht.toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          {/* Taux 5.5% */}
          {ventes.par_taux.taux_55.ttc > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-navy-900">Taux 5.5%</p>
                <p className="text-xs text-navy-500">{ventes.par_taux.taux_55.count} vente(s)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-900">
                  {ventes.par_taux.taux_55.tva.toFixed(2)} € TVA
                </p>
                <p className="text-xs text-navy-500">
                  Base HT: {ventes.par_taux.taux_55.ht.toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          {/* Taux 2.1% */}
          {ventes.par_taux.taux_21.ttc > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-navy-900">Taux 2.1%</p>
                <p className="text-xs text-navy-500">{ventes.par_taux.taux_21.count} vente(s)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-900">
                  {ventes.par_taux.taux_21.tva.toFixed(2)} € TVA
                </p>
                <p className="text-xs text-navy-500">
                  Base HT: {ventes.par_taux.taux_21.ht.toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          {/* Total TVA collectée */}
          <div className="pt-3 border-t border-emerald-200">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-navy-900">Total TVA Collectée</p>
              <p className="text-lg font-bold text-emerald-600">
                {ventes.tva_collectee.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Achats */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-coral-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-coral-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">TVA Déductible (Achats)</h3>
            <p className="text-sm text-navy-500">
              {achats.par_taux.taux_20.count +
                achats.par_taux.taux_10.count +
                achats.par_taux.taux_55.count +
                achats.par_taux.taux_21.count}{' '}
              transaction(s)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Taux 20% */}
          {achats.par_taux.taux_20.ttc > 0 && (
            <div className="flex items-center justify-between p-3 bg-coral-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-navy-900">Taux 20%</p>
                <p className="text-xs text-navy-500">{achats.par_taux.taux_20.count} achat(s)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-900">
                  {achats.par_taux.taux_20.tva.toFixed(2)} € TVA
                </p>
                <p className="text-xs text-navy-500">
                  Base HT: {achats.par_taux.taux_20.ht.toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          {/* Taux 10% */}
          {achats.par_taux.taux_10.ttc > 0 && (
            <div className="flex items-center justify-between p-3 bg-coral-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-navy-900">Taux 10%</p>
                <p className="text-xs text-navy-500">{achats.par_taux.taux_10.count} achat(s)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-900">
                  {achats.par_taux.taux_10.tva.toFixed(2)} € TVA
                </p>
                <p className="text-xs text-navy-500">
                  Base HT: {achats.par_taux.taux_10.ht.toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          {/* Total TVA déductible */}
          <div className="pt-3 border-t border-coral-200">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-navy-900">Total TVA Déductible</p>
              <p className="text-lg font-bold text-coral-600">
                -{achats.tva_deductible.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Résultat */}
      <Card className="bg-gradient-to-br from-navy-900 to-navy-800 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <MinusCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">TVA Nette</h3>
            <p className="text-sm text-white/70">
              {tva_nette >= 0 ? 'À payer' : 'Crédit de TVA'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-lg">
          <p className="text-3xl font-bold text-white text-center">
            {tva_nette >= 0 ? '+' : ''}
            {tva_nette.toFixed(2)} €
          </p>
        </div>
      </Card>
    </div>
  )
}
