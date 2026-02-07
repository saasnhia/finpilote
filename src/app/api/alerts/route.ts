import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/alerts
 * Liste les alertes de l'utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statut = searchParams.get('statut')
    const severite = searchParams.get('severite')

    let query = supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (statut) query = query.eq('statut', statut)
    if (severite) query = query.eq('severite', severite)

    const { data: alerts, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erreur récupération alertes' }, { status: 500 })
    }

    const all = alerts || []
    return NextResponse.json({
      success: true,
      alerts: all,
      stats: {
        total: all.length,
        nouvelles: all.filter(a => a.statut === 'nouvelle').length,
        critical: all.filter(a => a.severite === 'critical' && a.statut !== 'resolue' && a.statut !== 'ignoree').length,
        warning: all.filter(a => a.severite === 'warning' && a.statut !== 'resolue' && a.statut !== 'ignoree').length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}

/**
 * POST /api/alerts
 * Génère automatiquement les alertes basées sur les données
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const alerts: Array<{
      user_id: string
      type: string
      severite: string
      titre: string
      description: string
      impact_financier?: number
      actions_suggerees: string[]
      transaction_id?: string
      facture_id?: string
    }> = []

    // ─── 1. Factures impayées (>30 jours) ───
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: unpaidInvoices } = await supabase
      .from('factures')
      .select('*')
      .eq('user_id', user.id)
      .eq('validation_status', 'validated')
      .lt('date_facture', thirtyDaysAgo.toISOString().split('T')[0])

    if (unpaidInvoices && unpaidInvoices.length > 0) {
      for (const inv of unpaidInvoices.slice(0, 5)) {
        const daysSince = Math.floor(
          (Date.now() - new Date(inv.date_facture).getTime()) / (1000 * 60 * 60 * 24)
        )
        const fournisseur = inv.nom_fournisseur || 'Fournisseur inconnu'
        const numero = inv.numero_facture || 'N/A'
        const montant = (inv.montant_ttc || 0).toFixed(2)

        alerts.push({
          user_id: user.id,
          type: 'facture_impayee',
          severite: daysSince > 60 ? 'critical' : 'warning',
          titre: `Facture ${numero} impayée – ${fournisseur}`,
          description: `Facture de ${montant} € émise le ${new Date(inv.date_facture).toLocaleDateString('fr-FR')} par ${fournisseur}. Retard de paiement : ${daysSince} jours.${daysSince > 60 ? ' Action immédiate requise.' : ''}`,
          impact_financier: inv.montant_ttc,
          actions_suggerees: [
            `Relancer ${fournisseur} par email ou téléphone`,
            'Vérifier le relevé bancaire pour un éventuel paiement reçu',
            'Marquer comme payée si le règlement a été effectué',
            ...(daysSince > 60 ? ['Envisager une mise en demeure ou procédure de recouvrement'] : ['Planifier une relance téléphonique sous 48h']),
          ],
          facture_id: inv.id,
        })
      }
    }

    // ─── 2. Transactions anormales (montant > 3 écarts-types) ───
    const { data: recentTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100)

    if (recentTx && recentTx.length > 5) {
      const amounts = recentTx.map(t => Math.abs(t.amount))
      const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length
      const stdDev = Math.sqrt(amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length)
      const threshold = mean + 3 * stdDev

      for (const tx of recentTx) {
        if (Math.abs(tx.amount) > threshold && Math.abs(tx.amount) > 500) {
          const txDate = new Date(tx.date).toLocaleDateString('fr-FR')
          alerts.push({
            user_id: user.id,
            type: 'transaction_anormale',
            severite: 'warning',
            titre: `Transaction inhabituellement élevée – ${Math.abs(tx.amount).toFixed(0)} €`,
            description: `"${tx.description}" du ${txDate} : ${Math.abs(tx.amount).toFixed(2)} € (moyenne habituelle : ${mean.toFixed(0)} €, seuil : ${threshold.toFixed(0)} €). Vérification nécessaire.`,
            impact_financier: Math.abs(tx.amount),
            actions_suggerees: [
              'Vérifier que le montant est correct auprès du fournisseur/client',
              'Confirmer la légitimité de la transaction',
              'Vérifier s\'il ne s\'agit pas d\'un doublon ou d\'une erreur bancaire',
            ],
            transaction_id: tx.id,
          })
        }
      }
    }

    // ─── 3. Écarts TVA (transactions sans taux TVA) ───
    const { data: noTvaTx } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .is('tva_taux', null)

    if (noTvaTx && noTvaTx.length > 5) {
      alerts.push({
        user_id: user.id,
        type: 'ecart_tva',
        severite: 'warning',
        titre: `${noTvaTx.length} transactions sans taux de TVA`,
        description: `${noTvaTx.length} dépenses n'ont pas de taux de TVA renseigné. Cela peut fausser votre déclaration CA3 et entraîner un redressement fiscal.`,
        actions_suggerees: [
          'Vérifier et attribuer le taux de TVA correct à chaque transaction',
          'Identifier les transactions exonérées (taux 0%)',
          'Régulariser avant la prochaine déclaration TVA',
        ],
      })
    }

    // ─── 4. Transactions non rapprochées ───
    const { data: unmatchedTx } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .is('status', null)

    if (unmatchedTx && unmatchedTx.length > 10) {
      alerts.push({
        user_id: user.id,
        type: 'rapprochement_echoue',
        severite: 'info',
        titre: `${unmatchedTx.length} transactions non rapprochées`,
        description: `${unmatchedTx.length} transactions de charges n'ont pas de facture associée. Le rapprochement automatique peut résoudre la majorité.`,
        actions_suggerees: [
          'Lancer le rapprochement automatique',
          'Importer les factures manquantes',
          'Rapprocher manuellement les transactions restantes',
        ],
      })
    }

    // ─── 5. Alertes KPIs (données financières) ───
    const { data: latestFinData } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: false })
      .limit(1)

    if (latestFinData && latestFinData.length > 0) {
      const fd = latestFinData[0]
      const fixedCosts = fd.fixed_costs || {}
      const totalFixed = Object.values(fixedCosts).reduce((s: number, c: any) => s + (Number(c) || 0), 0)
      const marginRate = 1 - (fd.variable_cost_rate / 100)
      const breakEvenPoint = marginRate > 0 ? totalFixed / marginRate : 0
      const annualRevenue = fd.revenue * 12
      const breakEvenDays = annualRevenue > 0 ? (breakEvenPoint * 12 / annualRevenue) * 365 : 365
      const currentResult = fd.revenue - totalFixed - fd.revenue * (fd.variable_cost_rate / 100)

      if (breakEvenDays > 250) {
        const excessDays = Math.round(breakEvenDays) - 180
        alerts.push({
          user_id: user.id,
          type: 'point_mort_eleve',
          severite: breakEvenDays > 300 ? 'critical' : 'warning',
          titre: `Point Mort critique : ${Math.round(breakEvenDays)} jours`,
          description: `Votre Point Mort est de ${Math.round(breakEvenDays)} jours, soit ${excessDays} jours au-delà de l'objectif de 180 jours. La rentabilité annuelle est menacée.`,
          impact_financier: breakEvenPoint,
          actions_suggerees: [
            'Renégocier les charges fixes (loyer, assurances) : potentiel -15%',
            'Augmenter les tarifs de 5-10% pour améliorer la marge',
            'Lancer une action commerciale pour augmenter le CA de 20%',
            'Diversifier les sources de revenus',
          ],
        })
      }

      if (marginRate < 0.15) {
        alerts.push({
          user_id: user.id,
          type: 'marge_faible',
          severite: marginRate < 0.1 ? 'critical' : 'warning',
          titre: `Marge insuffisante : ${(marginRate * 100).toFixed(0)}%`,
          description: `Votre marge sur coûts variables est de ${(marginRate * 100).toFixed(1)}%, en dessous du seuil recommandé de 20%. Chaque euro de CA ne génère que ${(marginRate * 100).toFixed(0)} centimes de contribution.`,
          actions_suggerees: [
            'Augmenter les prix de vente de 5 à 10%',
            'Négocier les coûts fournisseurs (volume, fidélité)',
            'Réduire les dépenses variables non essentielles',
          ],
        })
      }

      if (currentResult < 0) {
        alerts.push({
          user_id: user.id,
          type: 'ca_baisse',
          severite: Math.abs(currentResult) > totalFixed * 0.5 ? 'critical' : 'warning',
          titre: `Résultat mensuel en déficit : -${Math.abs(currentResult).toFixed(0)} €`,
          description: `Votre résultat mensuel est négatif de ${Math.abs(currentResult).toFixed(0)} €. Les charges totales (${(totalFixed + fd.revenue * fd.variable_cost_rate / 100).toFixed(0)} €) dépassent le CA (${fd.revenue.toFixed(0)} €).`,
          impact_financier: Math.abs(currentResult),
          actions_suggerees: [
            'Étape 1 : Geler immédiatement les dépenses non essentielles',
            'Étape 2 : Accélérer le recouvrement des créances clients',
            'Étape 3 : Renégocier les charges fixes sous 30 jours',
            'Consulter un expert-comptable pour un plan de redressement',
          ],
        })
      }
    }

    if (alerts.length === 0) {
      return NextResponse.json({ success: true, generated: 0 })
    }

    // Clear old unresolved auto-generated alerts
    await supabase
      .from('alerts')
      .delete()
      .eq('user_id', user.id)
      .in('statut', ['nouvelle', 'vue'])

    const { error: insertError } = await supabase
      .from('alerts')
      .insert(alerts)

    if (insertError) {
      console.error('Error inserting alerts:', insertError)
      return NextResponse.json({ error: 'Erreur création alertes' }, { status: 500 })
    }

    return NextResponse.json({ success: true, generated: alerts.length })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}
