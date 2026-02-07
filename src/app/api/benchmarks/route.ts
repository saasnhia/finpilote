import { NextRequest, NextResponse } from 'next/server'
import {
  getSectorBenchmark,
  getAllSectors,
  compareToBenchmark,
} from '@/lib/benchmarks/sector-data'

/**
 * GET /api/benchmarks?sector=commerce&metric=marge&value=15
 * Retourne les benchmarks sectoriels avec comparaison
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sector = searchParams.get('sector') || 'services'
  const metric = searchParams.get('metric')
  const userValue = parseFloat(searchParams.get('value') || '0')

  // Liste de tous les secteurs
  if (searchParams.get('list') === 'true') {
    return NextResponse.json({
      success: true,
      sectors: getAllSectors(),
    })
  }

  const benchmark = getSectorBenchmark(sector)

  // Sans métrique = retourne le benchmark complet
  if (!metric) {
    return NextResponse.json({ success: true, benchmark })
  }

  // Comparaison spécifique
  const metricMap: Record<
    string,
    { value: number; lowerIsBetter: boolean; unit: string }
  > = {
    ca: { value: benchmark.ca_moyen_mensuel, lowerIsBetter: false, unit: '€' },
    marge: { value: benchmark.marge_moyenne, lowerIsBetter: false, unit: '%' },
    point_mort: {
      value: benchmark.point_mort_moyen,
      lowerIsBetter: true,
      unit: 'jours',
    },
    charges_fixes: {
      value: benchmark.charges_fixes_ratio,
      lowerIsBetter: true,
      unit: '%',
    },
    charges_variables: {
      value: benchmark.taux_charges_variables,
      lowerIsBetter: true,
      unit: '%',
    },
  }

  const metricConfig = metricMap[metric]
  if (!metricConfig) {
    return NextResponse.json(
      { error: 'Métrique invalide. Utilisez: ca, marge, point_mort, charges_fixes, charges_variables' },
      { status: 400 }
    )
  }

  const comparison = compareToBenchmark(
    userValue,
    metricConfig.value,
    metricConfig.lowerIsBetter
  )

  return NextResponse.json({
    success: true,
    sector: benchmark.label,
    metric,
    user_value: userValue,
    sector_average: metricConfig.value,
    delta: comparison.delta,
    status: comparison.status,
    unit: metricConfig.unit,
  })
}
