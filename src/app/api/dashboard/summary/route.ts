import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types pour les lignes Supabase ──────────────────────────────────────────

interface FactureClientRow {
  id: string
  montant_ttc: number
  montant_paye: number
  statut_paiement: string
  date_echeance: string
  numero_facture: string
  // Supabase foreign table join retourne un tableau
  client: { nom: string }[] | null
}

interface FactureFournisseurRow {
  id: string
  montant_ttc: number | null
  date_facture: string | null
  numero_facture: string | null
  fournisseur: string | null
  statut: string
}

interface RapprochementRow {
  id: string
  montant: number
  confidence_score: number
  created_at: string
  // Supabase foreign table joins retournent des tableaux
  facture: { fournisseur: string | null; montant_ttc: number | null; date_facture: string | null }[] | null
  transaction: { description: string; date: string; amount: number }[] | null
}

export interface BalanceAgeeItem {
  id: string
  numero_facture: string
  nom: string
  montant_ttc: number
  resteA: number
  date_reference: string
  joursRetard: number
  tranche: 'non_echu' | '0_30' | '31_60' | '61_90' | 'plus_90'
  statut: string
}

// ─── Calcul tranche balance âgée ─────────────────────────────────────────────

function computeTranche(joursRetard: number): BalanceAgeeItem['tranche'] {
  if (joursRetard <= 0) return 'non_echu'
  if (joursRetard <= 30) return '0_30'
  if (joursRetard <= 60) return '31_60'
  if (joursRetard <= 90) return '61_90'
  return 'plus_90'
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
  const lastOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const [
    profileRes,
    facturesClientsRes,
    facturesFournisseursRes,
    dossiersRes,
    comptesBancairesRes,
    tvaRes,
    alertesRes,
    rapprochementsRes,
    transactionsRes,
  ] = await Promise.allSettled([
    // Profil utilisateur
    supabase
      .from('user_profiles')
      .select('profile_type, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle(),

    // Factures clients (AR) — utilisées en mode entreprise (balance âgée) et mode cabinet (KPI retard)
    supabase
      .from('factures_clients')
      .select('id, montant_ttc, montant_paye, statut_paiement, date_echeance, numero_facture, client:clients(nom)')
      .eq('user_id', user.id)
      .in('statut_paiement', ['en_attente', 'en_retard', 'partiellement_payee'])
      .order('date_echeance', { ascending: true }),

    // Factures fournisseurs (AP) — mode cabinet balance âgée + mode entreprise KPI
    supabase
      .from('factures')
      .select('id, montant_ttc, date_facture, numero_facture, fournisseur, statut')
      .eq('user_id', user.id)
      .neq('statut', 'payée')
      .not('montant_ttc', 'is', null)
      .order('date_facture', { ascending: true }),

    // Dossiers actifs — KPI cabinet
    supabase
      .from('dossiers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('actif', true),

    // Trésorerie (solde bancaire) — KPI entreprise
    supabase
      .from('comptes_bancaires')
      .select('current_balance')
      .eq('user_id', user.id)
      .eq('is_active', true),

    // TVA du mois
    supabase
      .from('declarations_tva')
      .select('tva_nette, statut')
      .eq('user_id', user.id)
      .gte('periode_debut', firstOfMonth)
      .lte('periode_debut', lastOfMonth)
      .maybeSingle(),

    // Alertes actives
    supabase
      .from('alerts')
      .select('id, severite, titre')
      .eq('user_id', user.id)
      .eq('statut', 'nouvelle')
      .order('created_at', { ascending: false }),

    // Rapprochements à valider
    supabase
      .from('rapprochements_factures')
      .select('id, montant, confidence_score, created_at, facture:factures(fournisseur, montant_ttc, date_facture), transaction:transactions(description, date, amount)')
      .eq('user_id', user.id)
      .eq('statut', 'suggestion')
      .order('confidence_score', { ascending: false })
      .limit(5),

    // Activité récente
    supabase
      .from('transactions')
      .select('id, date, description, amount, category, status')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(8),
  ])

  // ── Profil ────────────────────────────────────────────────────────────────
  const profileType: 'cabinet' | 'entreprise' =
    (profileRes.status === 'fulfilled' ? profileRes.value.data?.profile_type : null) ?? 'cabinet'

  // ── Factures clients (AR) ─────────────────────────────────────────────────
  const facturesClients = (
    facturesClientsRes.status === 'fulfilled' ? facturesClientsRes.value.data ?? [] : []
  ) as FactureClientRow[]

  const balanceAgeeClients: BalanceAgeeItem[] = facturesClients.map(f => {
    const echeance = new Date(f.date_echeance)
    const joursRetard = Math.floor((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24))
    const resteA = (f.montant_ttc ?? 0) - (f.montant_paye ?? 0)
    return {
      id: f.id,
      numero_facture: f.numero_facture,
      nom: (Array.isArray(f.client) ? f.client[0]?.nom : null) ?? '—',
      montant_ttc: f.montant_ttc,
      resteA,
      date_reference: f.date_echeance,
      joursRetard,
      tranche: computeTranche(joursRetard),
      statut: f.statut_paiement,
    }
  })

  const totalEncoursClients = facturesClients.reduce(
    (sum, f) => sum + ((f.montant_ttc ?? 0) - (f.montant_paye ?? 0)),
    0
  )
  const countEncoursClients = facturesClients.length
  const totalEnRetard = facturesClients
    .filter(f => f.statut_paiement === 'en_retard')
    .reduce((sum, f) => sum + ((f.montant_ttc ?? 0) - (f.montant_paye ?? 0)), 0)
  const countEnRetard = facturesClients.filter(f => f.statut_paiement === 'en_retard').length

  // ── Factures fournisseurs (AP) ────────────────────────────────────────────
  const facturesFournisseurs = (
    facturesFournisseursRes.status === 'fulfilled' ? facturesFournisseursRes.value.data ?? [] : []
  ) as FactureFournisseurRow[]

  // Balance âgée fournisseurs — due date estimée = date_facture + 30 jours
  const balanceAgeeFournisseurs: BalanceAgeeItem[] = facturesFournisseurs
    .filter(f => f.date_facture && f.montant_ttc)
    .map(f => {
      const dateFacture = new Date(f.date_facture!)
      const echeanceEstimee = new Date(dateFacture.getTime() + 30 * 24 * 60 * 60 * 1000)
      const joursRetard = Math.floor((today.getTime() - echeanceEstimee.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: f.id,
        numero_facture: f.numero_facture ?? '—',
        nom: f.fournisseur ?? 'Fournisseur inconnu',
        montant_ttc: f.montant_ttc!,
        resteA: f.montant_ttc!,
        date_reference: echeanceEstimee.toISOString().split('T')[0],
        joursRetard,
        tranche: computeTranche(joursRetard),
        statut: f.statut,
      }
    })

  const totalFournisseursAPayer = facturesFournisseurs.reduce(
    (sum, f) => sum + (f.montant_ttc ?? 0),
    0
  )
  // Retards cabinet : factures fournisseurs avec echeance estimée dépassée
  const countFournisseursEnRetard = balanceAgeeFournisseurs.filter(
    f => f.joursRetard > 0
  ).length

  // ── Dossiers ──────────────────────────────────────────────────────────────
  const dossiersActifs =
    dossiersRes.status === 'fulfilled' ? (dossiersRes.value.count ?? 0) : 0

  // ── Trésorerie ────────────────────────────────────────────────────────────
  const comptes =
    comptesBancairesRes.status === 'fulfilled' ? comptesBancairesRes.value.data ?? [] : []
  const tresorerie = (comptes as { current_balance: number }[]).reduce(
    (sum, c) => sum + (c.current_balance ?? 0),
    0
  )

  // ── TVA + alertes ─────────────────────────────────────────────────────────
  const tva = tvaRes.status === 'fulfilled' ? tvaRes.value.data : null
  const alertes = (alertesRes.status === 'fulfilled' ? alertesRes.value.data ?? [] : []) as {
    id: string; severite: string; titre: string
  }[]
  const alertesCount = alertes.length
  const alertesCritiques = alertes.filter(a => a.severite === 'critical').length

  const rapprochements = (
    rapprochementsRes.status === 'fulfilled' ? rapprochementsRes.value.data ?? [] : []
  ) as RapprochementRow[]
  const transactions = transactionsRes.status === 'fulfilled' ? transactionsRes.value.data ?? [] : []

  return NextResponse.json({
    success: true,
    profile_type: profileType,
    // KPIs communs
    kpis: {
      // Mode cabinet
      dossiers_actifs: dossiersActifs,
      factures_en_retard_count: countFournisseursEnRetard,
      // Mode entreprise
      encours_clients: totalEncoursClients,
      count_en_attente: countEncoursClients,
      total_en_retard: totalEnRetard,
      count_en_retard: countEnRetard,
      fournisseurs_a_payer: totalFournisseursAPayer,
      tresorerie,
      // Communs
      tva_nette: tva?.tva_nette ?? null,
      tva_statut: tva?.statut ?? null,
      alertes_count: alertesCount,
      alertes_critiques: alertesCritiques,
    },
    // Balance âgée selon mode
    balance_agee_clients: balanceAgeeClients,
    balance_agee_fournisseurs: balanceAgeeFournisseurs,
    rapprochements,
    transactions,
  })
}
