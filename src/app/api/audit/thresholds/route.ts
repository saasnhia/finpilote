import { NextRequest, NextResponse } from 'next/server'
import { performAuditAnalysis, getLegalThresholds } from '@/lib/audit/audit-thresholds'
import type { CompanyAuditData } from '@/types'

/**
 * POST /api/audit/thresholds
 * Calcule les seuils d'audit et vérifie l'obligation légale.
 * Accepte les données de l'entreprise en JSON.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      company_name,
      siren,
      secteur,
      exercice_debut,
      exercice_fin,
      chiffre_affaires_ht,
      total_bilan,
      effectif_moyen,
      resultat_net,
      balance,
    } = body as CompanyAuditData

    // Validation des champs obligatoires
    if (!company_name || company_name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom de l\'entreprise est requis' },
        { status: 400 }
      )
    }

    if (chiffre_affaires_ht == null || total_bilan == null || effectif_moyen == null) {
      return NextResponse.json(
        { error: 'CA HT, total bilan et effectif moyen sont requis' },
        { status: 400 }
      )
    }

    if (chiffre_affaires_ht < 0 || total_bilan < 0 || effectif_moyen < 0) {
      return NextResponse.json(
        { error: 'Les valeurs financières ne peuvent pas être négatives' },
        { status: 400 }
      )
    }

    const companyData: CompanyAuditData = {
      company_name: company_name.trim(),
      siren: siren?.trim(),
      secteur: secteur?.trim(),
      exercice_debut: exercice_debut || new Date().getFullYear() + '-01-01',
      exercice_fin: exercice_fin || new Date().getFullYear() + '-12-31',
      chiffre_affaires_ht,
      total_bilan,
      effectif_moyen,
      resultat_net: resultat_net ?? 0,
      balance,
    }

    const result = performAuditAnalysis(companyData)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/audit/thresholds
 * Retourne les seuils légaux de référence (sans calcul).
 */
export async function GET() {
  const legal = getLegalThresholds()

  return NextResponse.json({
    success: true,
    legal,
    description: {
      ca: 'Chiffre d\'affaires HT annuel',
      bilan: 'Total du bilan',
      effectif: 'Nombre moyen de salariés',
    },
    rule: 'L\'audit légal est obligatoire si 2 des 3 critères sont dépassés (Art. L823-1 Code de commerce)',
  })
}
