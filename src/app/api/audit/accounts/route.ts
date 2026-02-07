import { NextRequest, NextResponse } from 'next/server'
import { calculateAuditThresholds } from '@/lib/audit/audit-thresholds'
import type { CompanyAuditData, AccountBalance, AccountRisk } from '@/types'

/**
 * POST /api/audit/accounts
 * Classe les comptes de la balance par seuils d'audit.
 * Accepte les données financières + balance des comptes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      chiffre_affaires_ht,
      total_bilan,
      effectif_moyen,
      resultat_net,
      balance,
    } = body as {
      chiffre_affaires_ht: number
      total_bilan: number
      effectif_moyen: number
      resultat_net: number
      balance: AccountBalance[]
    }

    if (total_bilan == null || chiffre_affaires_ht == null) {
      return NextResponse.json(
        { error: 'CA HT et total bilan sont requis' },
        { status: 400 }
      )
    }

    if (!balance || !Array.isArray(balance) || balance.length === 0) {
      return NextResponse.json(
        { error: 'La balance des comptes est requise (tableau non vide)' },
        { status: 400 }
      )
    }

    const companyData: CompanyAuditData = {
      company_name: '',
      exercice_debut: '',
      exercice_fin: '',
      chiffre_affaires_ht,
      total_bilan,
      effectif_moyen: effectif_moyen ?? 0,
      resultat_net: resultat_net ?? 0,
    }

    const thresholds = calculateAuditThresholds(companyData)

    // Classifier chaque compte
    const significatifs: AccountRisk[] = []
    const aVerifier: AccountRisk[] = []
    const insignifiants: AccountRisk[] = []

    for (const account of balance) {
      const absSolde = Math.abs(account.solde_net)
      const mouvementTotal = account.mouvement_debit + account.mouvement_credit
      const ratioBilan = total_bilan > 0 ? (absSolde / total_bilan) * 100 : 0

      let riskLevel: AccountRisk['risk_level']
      let classification: AccountRisk['classification']
      let notes: string | undefined

      if (absSolde >= thresholds.signification.value) {
        riskLevel = 'high'
        classification = 'significatif'
        notes = `Solde supérieur au seuil de signification. Audit détaillé requis.`
      } else if (absSolde >= thresholds.planification.value) {
        riskLevel = 'medium'
        classification = 'a_verifier'
        notes = `Entre seuil de planification et signification. Procédures analytiques recommandées.`
      } else {
        riskLevel = 'low'
        classification = 'insignifiant'
      }

      // Compte avec peu de solde mais beaucoup de mouvements
      if (classification === 'insignifiant' && mouvementTotal >= thresholds.signification.value) {
        riskLevel = 'medium'
        classification = 'a_verifier'
        notes = `Solde faible mais mouvements élevés. Vérification recommandée.`
      }

      const accountRisk: AccountRisk = {
        numero_compte: account.numero_compte,
        libelle: account.libelle,
        classe: account.classe,
        solde_net: account.solde_net,
        mouvement_total: mouvementTotal,
        ratio_bilan: Math.round(ratioBilan * 100) / 100,
        risk_level: riskLevel,
        classification,
        notes,
      }

      switch (classification) {
        case 'significatif':
          significatifs.push(accountRisk)
          break
        case 'a_verifier':
          aVerifier.push(accountRisk)
          break
        case 'insignifiant':
          insignifiants.push(accountRisk)
          break
      }
    }

    // Trier par solde décroissant
    const sortBySolde = (a: AccountRisk, b: AccountRisk) =>
      Math.abs(b.solde_net) - Math.abs(a.solde_net)

    significatifs.sort(sortBySolde)
    aVerifier.sort(sortBySolde)
    insignifiants.sort(sortBySolde)

    return NextResponse.json({
      success: true,
      comptes_significatifs: significatifs,
      comptes_a_verifier: aVerifier,
      comptes_insignifiants: insignifiants,
      thresholds,
      summary: {
        total_comptes: balance.length,
        significatifs: significatifs.length,
        a_verifier: aVerifier.length,
        insignifiants: insignifiants.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur serveur: ' + error.message },
      { status: 500 }
    )
  }
}
