/**
 * scripts/test-seed.ts
 * Seeds Supabase with test data for E2E testing.
 * Uses service role key (bypasses RLS).
 * Saves session + seeded IDs to scripts/.test-state.json
 *
 * Run: npx tsx scripts/test-seed.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://jwaqsszcaicikhgmfcwc.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YXFzc3pjYWljaWtoZ21mY3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA1NjA3NCwiZXhwIjoyMDg1NjMyMDc0fQ.k9kEhr2Le4FyLyy_s770dcP55DEM46H_HqGzbnOzjFc'
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YXFzc3pjYWljaWtoZ21mY3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTYwNzQsImV4cCI6MjA4NTYzMjA3NH0.A9PkW91fcQl52eIiOr8LEsVc9ldG2IANray8Wjd2dII'

const TEST_EMAIL = 'test-e2e@finsoft.dev'
const TEST_PASSWORD = 'TestE2E_Finsoft_2026!'
const STATE_FILE = path.join(__dirname, '.test-state.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function rnd(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function log(msg: string) {
  process.stdout.write('  ' + msg + '\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 FinSoft — Test Seed\n')
  console.log('Connecting to Supabase...')

  // Admin client (bypasses RLS)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 1. Create/get test user ──────────────────────────────────────────────
  console.log('\n[1/9] Test user...')
  let userId: string

  // Try creating user; if email already exists, list users to find it
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })

  if (createErr) {
    if (!createErr.message.includes('already been registered') && !createErr.message.includes('already exists') && !createErr.message.includes('duplicate')) {
      throw new Error('Failed to create user: ' + createErr.message)
    }
    // User already exists — find via listUsers
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
    const existing = list?.users?.find((u: { email?: string }) => u.email === TEST_EMAIL)
    if (!existing) throw new Error('Could not find existing test user')
    userId = existing.id
    log('✓ User exists: ' + userId)
  } else {
    if (!created?.user) throw new Error('Failed to create user: no user returned')
    userId = created.user.id
    log('✓ User created: ' + userId)
  }

  // ── 2. Set enterprise plan ───────────────────────────────────────────────
  console.log('\n[2/9] User profile (plan=entreprise)...')
  await admin.from('user_profiles').upsert(
    {
      id: userId,
      plan: 'entreprise',
      factures_count: 0,
      factures_limit: 999999,
      max_users: 999,
    },
    { onConflict: 'id' }
  )
  log('✓ Profile set to plan=entreprise')

  // ── 3. Sign in to get session ────────────────────────────────────────────
  console.log('\n[3/9] Signing in...')
  const anon = createClient(SUPABASE_URL, ANON_KEY)
  const { data: authData, error: signInError } = await anon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signInError || !authData.session) {
    throw new Error('Sign in failed: ' + signInError?.message)
  }
  const session = authData.session
  log('✓ Session obtained, expires_at: ' + new Date(session.expires_at! * 1000).toISOString())

  // Build cookie header (raw JSON — @supabase/ssr default, no base64)
  const sessionJson = JSON.stringify(session)
  const PROJECT_REF = 'jwaqsszcaicikhgmfcwc'
  const cookieKey = `sb-${PROJECT_REF}-auth-token`
  const CHUNK_MAX = 3180
  let cookies: Record<string, string> = {}
  const encoded = encodeURIComponent(sessionJson)
  if (encoded.length <= CHUNK_MAX) {
    cookies[cookieKey] = sessionJson
  } else {
    // Split into chunks (same as @supabase/ssr chunker)
    const raw = sessionJson
    let remaining = raw
    let chunkIdx = 0
    while (remaining.length > 0) {
      // Find safe chunk boundary
      let head = remaining.slice(0, CHUNK_MAX)
      while (encodeURIComponent(head).length > CHUNK_MAX) {
        head = head.slice(0, -1)
      }
      cookies[`${cookieKey}.${chunkIdx}`] = head
      remaining = remaining.slice(head.length)
      chunkIdx++
    }
  }
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
  log('✓ Cookie header built (' + cookieHeader.length + ' chars)')

  // ── 4. Bank accounts ─────────────────────────────────────────────────────
  console.log('\n[4/9] Comptes bancaires (2)...')
  // Clean up existing test data first
  await admin.from('comptes_bancaires').delete().eq('user_id', userId)

  const { data: comptes, error: comptesErr } = await admin
    .from('comptes_bancaires')
    .insert([
      {
        user_id: userId,
        bank_name: 'Crédit Agricole',
        account_name: 'Compte courant test',
        iban: 'FR7610107001011234567890185',
        bic: 'AGRIFRPP',
        account_type: 'checking',
        current_balance: 12391.70,
        is_active: true,
      },
      {
        user_id: userId,
        bank_name: 'BNP Paribas',
        account_name: 'Compte épargne test',
        iban: 'FR7630004000031234567890143',
        bic: 'BNPAFRPP',
        account_type: 'savings',
        current_balance: 25000.00,
        is_active: true,
      },
    ])
    .select()

  if (comptesErr) throw new Error('Comptes bancaires: ' + comptesErr.message)
  const compteIds = comptes!.map(c => c.id)
  log('✓ ' + comptes!.length + ' comptes créés')

  // ── 5. Transactions (20) ─────────────────────────────────────────────────
  console.log('\n[5/9] Transactions (20)...')
  await admin.from('transactions').delete().eq('user_id', userId)

  const categories = ['loyer', 'salaires', 'fournitures', 'informatique', 'transport', 'restauration']
  const txData = [
    // Recettes
    { date: daysAgo(90), description: 'VIREMENT CLIENT MOREAU CABINET', amount: 2400.00, type: 'income', category: 'prestations', tva_taux: 20 },
    { date: daysAgo(82), description: 'VIREMENT CLIENT MARTIN BOULANGERIE', amount: 3800.00, type: 'income', category: 'prestations', tva_taux: 20 },
    { date: daysAgo(75), description: 'VIREMENT FACTURE F2025-089', amount: 890.00, type: 'income', category: 'prestations', tva_taux: 20 },
    { date: daysAgo(60), description: 'REMBOURSEMENT TROP-PERCU ASSURANCE', amount: 185.00, type: 'income', category: 'remboursements', tva_taux: 0 },
    { date: daysAgo(45), description: 'VIREMENT CLIENT DUPONT GARAGE SARL', amount: 5000.00, type: 'income', category: 'prestations', tva_taux: 20 },
    { date: daysAgo(30), description: 'VIREMENT ACOMPTE PROJET DIGITAL', amount: 1500.00, type: 'income', category: 'prestations', tva_taux: 20 },
    { date: daysAgo(15), description: 'VIREMENT SOLDE FACTURE MOREAU', amount: 750.00, type: 'income', category: 'prestations', tva_taux: 20 },
    { date: daysAgo(5), description: 'VIREMENT HONORAIRES MISSION AUDIT', amount: 4200.00, type: 'income', category: 'prestations', tva_taux: 20 },
    // Dépenses
    { date: daysAgo(88), description: 'PRELEVEMENT LOYER BUREAU NOVEMBRE', amount: -1200.00, type: 'expense', category: 'loyer', tva_taux: 20 },
    { date: daysAgo(80), description: 'PRELEVEMENT EDF ENERGIE BUREAUX', amount: -142.50, type: 'expense', category: 'charges', tva_taux: 20 },
    { date: daysAgo(72), description: 'CB RESTAURANT REPAS CLIENT LE MOULIN', amount: -87.00, type: 'expense', category: 'restauration', tva_taux: 10 },
    { date: daysAgo(65), description: 'PRELEVEMENT ORANGE PRO TELEPHONE', amount: -65.00, type: 'expense', category: 'telecom', tva_taux: 20 },
    { date: daysAgo(55), description: 'ACHAT LOGICIEL COMPTABLE ANNUEL', amount: -299.00, type: 'expense', category: 'informatique', tva_taux: 20 },
    { date: daysAgo(48), description: 'CB FOURNITURES BUREAU LECLERC PRO', amount: -87.30, type: 'expense', category: 'fournitures', tva_taux: 20 },
    { date: daysAgo(40), description: 'PRELEVEMENT ASSURANCE PRO AXA', amount: -198.00, type: 'expense', category: 'assurances', tva_taux: 20 },
    { date: daysAgo(35), description: 'PRELEVEMENT LOYER BUREAU DECEMBRE', amount: -1200.00, type: 'expense', category: 'loyer', tva_taux: 20 },
    { date: daysAgo(25), description: 'ACHAT MATERIEL INFORMATIQUE DELL', amount: -1840.00, type: 'expense', category: 'informatique', tva_taux: 20 },
    { date: daysAgo(20), description: 'CB PARKING GARE DIJON MISSION', amount: -34.00, type: 'expense', category: 'transport', tva_taux: 20 },
    { date: daysAgo(10), description: 'PRELEVEMENT LOGICIEL CRM MENSUEL', amount: -89.00, type: 'expense', category: 'informatique', tva_taux: 20 },
    { date: daysAgo(3), description: 'ACHAT OUTILLAGE ATELIER TECHNIQUE', amount: -450.00, type: 'expense', category: 'materiel', tva_taux: 20 },
  ]

  const txsToInsert = txData.map(t => ({
    ...t,
    user_id: userId,
    bank_account_id: compteIds[0],
    source: 'bank_import' as const,
    status: 'active' as const,
    confidence_score: rnd(0.7, 0.99),
  }))

  const { data: transactions, error: txErr } = await admin
    .from('transactions')
    .insert(txsToInsert)
    .select()

  if (txErr) throw new Error('Transactions: ' + txErr.message)
  log('✓ ' + transactions!.length + ' transactions insérées')

  // ── 6. Factures fournisseurs (5) ─────────────────────────────────────────
  console.log('\n[6/9] Factures fournisseurs (5)...')
  await admin.from('factures').delete().eq('user_id', userId)

  const { data: factures, error: factErr } = await admin
    .from('factures')
    .insert([
      {
        user_id: userId,
        fournisseur: 'Cabinet Moreau & Associés',
        numero_facture: 'FCT-2025-001',
        date_facture: daysAgo(85),
        montant_ht: 2000.00,
        montant_tva: 400.00,
        montant_ttc: 2400.00,
        statut: 'validee',
        fichier_url: 'https://example.com/test-facture-001.pdf',
      },
      {
        user_id: userId,
        fournisseur: 'Boulangerie Martin SAS',
        numero_facture: 'FCT-2025-002',
        date_facture: daysAgo(75),
        montant_ht: 3166.67,
        montant_tva: 633.33,
        montant_ttc: 3800.00,
        statut: 'validee',
        fichier_url: 'https://example.com/test-facture-002.pdf',
      },
      {
        user_id: userId,
        fournisseur: 'Garage Dupont SARL',
        numero_facture: 'FCT-2025-003',
        date_facture: daysAgo(40),
        montant_ht: 4166.67,
        montant_tva: 833.33,
        montant_ttc: 5000.00,
        statut: 'en_attente',
        fichier_url: 'https://placeholder.finsoft.dev/test-facture-003.pdf',
      },
      {
        user_id: userId,
        fournisseur: 'Fournisseur Retard SARL',
        numero_facture: 'FCT-2025-004',
        date_facture: daysAgo(65),
        montant_ht: 1500.00,
        montant_tva: 300.00,
        montant_ttc: 1800.00,
        statut: 'en_attente',
        fichier_url: 'https://placeholder.finsoft.dev/test-facture-004.pdf',
      },
      {
        user_id: userId,
        fournisseur: 'Tech Solutions Pro',
        numero_facture: 'FCT-2025-005',
        date_facture: daysAgo(10),
        montant_ht: 720.00,
        montant_tva: 144.00,
        montant_ttc: 864.00,
        statut: 'en_attente',
        fichier_url: 'https://placeholder.finsoft.dev/test-facture-005.pdf',
      },
    ])
    .select()

  if (factErr) throw new Error('Factures: ' + factErr.message)
  log('✓ ' + factures!.length + ' factures insérées')

  // ── 7. Clients + Factures clients ────────────────────────────────────────
  console.log('\n[7/9] Clients + factures_clients (5)...')
  await admin.from('factures_clients').delete().eq('user_id', userId)
  await admin.from('clients').delete().eq('user_id', userId)

  const { data: clients, error: clientErr } = await admin
    .from('clients')
    .insert([
      { user_id: userId, nom: 'Entreprise Alpha SA', email: 'compta@alpha-sa.fr', telephone: '0380123456', siren: '412345678' },
      { user_id: userId, nom: 'Beta Consulting SARL', email: 'direction@beta-consulting.fr', telephone: '0380654321', siren: '523456789' },
      { user_id: userId, nom: 'Gamma Technologie SAS', email: 'finance@gamma-tech.fr', telephone: '0380789012', siren: '634567890' },
    ])
    .select()

  if (clientErr) throw new Error('Clients: ' + clientErr.message)
  log('✓ ' + clients!.length + ' clients créés')

  const today = new Date()
  const { data: facturesClients, error: fcErr } = await admin
    .from('factures_clients')
    .insert([
      {
        user_id: userId,
        client_id: clients![0].id,
        numero_facture: 'CLI-2025-001',
        objet: 'Mission conseil fiscal Q3',
        montant_ht: 2000.00,
        tva: 400.00,
        montant_ttc: 2400.00,
        date_emission: daysAgo(45),
        date_echeance: daysAgo(15),
        statut_paiement: 'payee',
        montant_paye: 2400.00,
        date_dernier_paiement: daysAgo(14),
      },
      {
        user_id: userId,
        client_id: clients![1].id,
        numero_facture: 'CLI-2025-002',
        objet: 'Audit comptable annuel',
        montant_ht: 3500.00,
        tva: 700.00,
        montant_ttc: 4200.00,
        date_emission: daysAgo(60),
        date_echeance: daysAgo(30),
        statut_paiement: 'en_retard',
        montant_paye: 0,
      },
      {
        user_id: userId,
        client_id: clients![2].id,
        numero_facture: 'CLI-2025-003',
        objet: 'Mise en conformité RGPD',
        montant_ht: 1200.00,
        tva: 240.00,
        montant_ttc: 1440.00,
        date_emission: daysAgo(50),
        date_echeance: daysAgo(20),
        statut_paiement: 'en_retard',
        montant_paye: 0,
      },
      {
        user_id: userId,
        client_id: clients![0].id,
        numero_facture: 'CLI-2025-004',
        objet: 'Formation équipe comptabilité',
        montant_ht: 950.00,
        tva: 190.00,
        montant_ttc: 1140.00,
        date_emission: daysAgo(10),
        date_echeance: daysFromNow(20),
        statut_paiement: 'en_attente',
        montant_paye: 0,
      },
      {
        user_id: userId,
        client_id: clients![1].id,
        numero_facture: 'CLI-2025-005',
        objet: 'Prestation TVA Q4',
        montant_ht: 800.00,
        tva: 160.00,
        montant_ttc: 960.00,
        date_emission: daysAgo(5),
        date_echeance: daysFromNow(25),
        statut_paiement: 'en_attente',
        montant_paye: 0,
      },
    ])
    .select()

  if (fcErr) throw new Error('Factures clients: ' + fcErr.message)
  log('✓ ' + facturesClients!.length + ' factures clients créées')

  // ── 8. Anomalies rapprochement (10) ─────────────────────────────────────
  console.log('\n[8/9] Anomalies rapprochement (10)...')
  await admin.from('anomalies_detectees').delete().eq('user_id', userId)

  const anomaliesData = [
    { type: 'doublon_transaction', severite: 'critical', description: 'Transaction PRELEVEMENT EDF en double le 2025-11-03 (142,50€)', montant: 142.50, statut: 'ouverte' },
    { type: 'transaction_sans_facture', severite: 'warning', description: 'Virement CLIENT DUPONT 5000€ sans facture correspondante', montant: 5000.00, statut: 'ouverte' },
    { type: 'facture_sans_transaction', severite: 'warning', description: 'Facture FCT-2025-004 de 1800€ sans mouvement bancaire associé', montant: 1800.00, statut: 'ouverte' },
    { type: 'ecart_montant', severite: 'critical', description: 'Écart de 50€ entre facture FCT-2025-003 (5000€) et virement reçu (4950€)', montant: 4950.00, montant_attendu: 5000.00, ecart: -50.00, statut: 'ouverte' },
    { type: 'ecart_tva', severite: 'warning', description: '15 transactions sans taux TVA renseigné — impact CA3', montant: null, statut: 'ouverte' },
    { type: 'date_incoherente', severite: 'info', description: 'Facture FCT-2025-005 antérieure de 5 jours au virement correspondant', montant: 864.00, statut: 'ouverte' },
    { type: 'montant_eleve', severite: 'warning', description: 'Transaction ACHAT MATERIEL DELL 1840€ inhabituellement élevée', montant: 1840.00, statut: 'ouverte' },
    { type: 'doublon_facture', severite: 'critical', description: 'Facture FCT-2025-001 possiblement en doublon avec mouvement du 2025-08-15', montant: 2400.00, statut: 'ouverte' },
    { type: 'transaction_sans_facture', severite: 'info', description: 'CB RESTAURANT 87€ — facture justificatif manquant', montant: 87.00, statut: 'ouverte' },
    { type: 'ecart_montant', severite: 'warning', description: 'Remboursement AXA 185€ non prévu dans le contrat (attendu 0€)', montant: 185.00, montant_attendu: 0, ecart: 185.00, statut: 'ouverte' },
  ]

  const { data: anomalies, error: anomErr } = await admin
    .from('anomalies_detectees')
    .insert(anomaliesData.map(a => ({ ...a, user_id: userId })))
    .select()

  if (anomErr) throw new Error('Anomalies: ' + anomErr.message)
  log('✓ ' + anomalies!.length + ' anomalies insérées')

  // ── 9. Déclarations TVA (3) + Alertes (5) ───────────────────────────────
  console.log('\n[9/9] TVA + Alertes...')

  await admin.from('declarations_tva').delete().eq('user_id', userId)
  const { data: tvaDecls, error: tvaErr } = await admin
    .from('declarations_tva')
    .insert([
      {
        user_id: userId,
        periode_debut: '2025-07-01',
        periode_fin: '2025-09-30',
        regime: 'reel_normal',
        montant_ht: 14500.00,
        tva_collectee: 2900.00,
        tva_deductible: 800.00,
        tva_nette: 2100.00,
        statut: 'validee',
        date_validation: new Date(Date.now() - 45 * 86400000).toISOString(),
        ventes_tva_20: 12000.00,
        ventes_tva_10: 2500.00,
        achats_tva_20: 4000.00,
      },
      {
        user_id: userId,
        periode_debut: '2025-10-01',
        periode_fin: '2025-12-31',
        regime: 'reel_normal',
        montant_ht: 18200.00,
        tva_collectee: 3640.00,
        tva_deductible: 1200.00,
        tva_nette: 2440.00,
        statut: 'brouillon',
        ventes_tva_20: 18200.00,
        achats_tva_20: 6000.00,
      },
      {
        user_id: userId,
        periode_debut: '2026-01-01',
        periode_fin: '2026-03-31',
        regime: 'reel_normal',
        montant_ht: 4800.00,
        tva_collectee: 960.00,
        tva_deductible: 280.00,
        tva_nette: 680.00,
        statut: 'brouillon',
        ventes_tva_20: 4800.00,
        achats_tva_20: 1400.00,
      },
    ])
    .select()

  if (tvaErr) throw new Error('Déclarations TVA: ' + tvaErr.message)
  log('✓ ' + tvaDecls!.length + ' déclarations TVA créées')

  await admin.from('alerts').delete().eq('user_id', userId)
  const { data: alertsData, error: alertErr } = await admin
    .from('alerts')
    .insert([
      {
        user_id: userId,
        type: 'facture_impayee',
        severite: 'critical',
        titre: 'Facture CLI-2025-002 impayée — Beta Consulting SARL',
        description: 'Facture de 4200€ en retard de 30 jours. Action immédiate requise.',
        impact_financier: 4200.00,
        statut: 'nouvelle',
        actions_suggerees: ['Relancer Beta Consulting', 'Envoyer mise en demeure'],
      },
      {
        user_id: userId,
        type: 'facture_impayee',
        severite: 'warning',
        titre: 'Facture CLI-2025-003 impayée — Gamma Technologie',
        description: 'Facture de 1440€ en retard de 20 jours.',
        impact_financier: 1440.00,
        statut: 'nouvelle',
        actions_suggerees: ['Relancer par email', 'Proposer un échéancier'],
      },
      {
        user_id: userId,
        type: 'rapprochement_echoue',
        severite: 'warning',
        titre: '10 anomalies de rapprochement non résolues',
        description: 'Incluant 2 doublons critiques et 3 factures sans transaction.',
        statut: 'vue',
        actions_suggerees: ['Lancer le rapprochement automatique'],
      },
      {
        user_id: userId,
        type: 'ecart_tva',
        severite: 'warning',
        titre: '15 transactions sans taux TVA',
        description: 'Ces transactions peuvent fausser votre déclaration CA3.',
        statut: 'nouvelle',
        actions_suggerees: ['Vérifier les taux TVA manquants'],
      },
      {
        user_id: userId,
        type: 'transaction_anormale',
        severite: 'info',
        titre: 'Transaction DELL 1840€ hors norme',
        description: 'Montant 3x supérieur à la moyenne habituelle. Vérification conseillée.',
        impact_financier: 1840.00,
        statut: 'nouvelle',
        actions_suggerees: ['Vérifier la facture correspondante'],
      },
    ])
    .select()

  if (alertErr) throw new Error('Alertes: ' + alertErr.message)
  log('✓ ' + alertsData!.length + ' alertes créées')

  // ── Save state ──────────────────────────────────────────────────────────
  const state = {
    userId,
    session,
    cookieHeader,
    ids: {
      comptes: compteIds,
      transactions: transactions!.map(t => t.id),
      factures: factures!.map(f => f.id),
      facturesClients: facturesClients!.map(f => f.id),
      clients: clients!.map(c => c.id),
      anomalies: anomalies!.map(a => a.id),
      tvaDecls: tvaDecls!.map(t => t.id),
      alerts: alertsData!.map(a => a.id),
    },
    seededAt: new Date().toISOString(),
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  log('✓ State saved to ' + STATE_FILE)

  console.log('\n✅ Seed terminé — ' + [
    comptes!.length + ' comptes',
    transactions!.length + ' transactions',
    factures!.length + ' factures',
    facturesClients!.length + ' factures clients',
    clients!.length + ' clients',
    anomalies!.length + ' anomalies',
    tvaDecls!.length + ' déclarations TVA',
    alertsData!.length + ' alertes',
  ].join(', '))
  console.log('\nLance maintenant : npx tsx scripts/test-features.ts\n')
}

main().catch(err => {
  console.error('\n❌ Seed error:', err.message)
  process.exit(1)
})
