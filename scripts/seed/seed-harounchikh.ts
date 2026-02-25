/**
 * Seed Cabinet Demo — harounchikh71@gmail.com
 * Injecte 8 clients, 40 factures, 8 déclarations TVA, transactions + rapprochements, 5 alertes
 * Run: npx tsx scripts/seed/seed-harounchikh.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://jwaqsszcaicikhgmfcwc.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TARGET_EMAIL = process.env.SEED_TARGET_EMAIL ?? 'harounchikh71@gmail.com'

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(msg) }
function err(msg: string) { console.error('❌', msg) }

async function del(table: string, userId: string) {
  const { error } = await supabase.from(table).delete().eq('user_id', userId)
  if (error) {
    // Some tables might not exist or have different FK - just warn
    log(`  ⚠ ${table}: ${error.message}`)
  } else {
    log(`  ✓ ${table} vidée`)
  }
}

// ─── Step 1: Get user_id ────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  log('\n📍 Étape 1 — Récupération user_id...')
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw new Error(`listUsers: ${error.message}`)
  const user = data.users.find(u => u.email === TARGET_EMAIL)
  if (!user) throw new Error(`Utilisateur ${TARGET_EMAIL} introuvable dans Supabase`)
  log(`  ✅ user_id = ${user.id}`)
  return user.id
}

// ─── Step 2: Clean data ─────────────────────────────────────────────────────

async function cleanData(userId: string) {
  log('\n🗑 Étape 2 — Nettoyage des données existantes...')

  // FK order: dependent tables first
  await del('rapprochements', userId)
  await del('rappels_email', userId)
  await del('alerts', userId)
  await del('applied_insights', userId)
  await del('automation_log', userId)
  await del('import_history', userId)

  // Factures clients (depend on clients)
  const { error: fcErr } = await supabase
    .from('factures_clients')
    .delete()
    .eq('user_id', userId)
  log(fcErr ? `  ⚠ factures_clients: ${fcErr.message}` : '  ✓ factures_clients vidée')

  // Clients
  await del('clients', userId)

  // Declarations TVA
  await del('declarations_tva', userId)

  // Transactions (after rapprochements)
  await del('transactions', userId)

  // Comptes bancaires
  await del('comptes_bancaires', userId)

  // Factures OCR
  await del('factures', userId)

  // Dossiers
  await del('dossiers', userId)

  log('  ✅ Nettoyage terminé')
}

// ─── Step 3: Update profile ─────────────────────────────────────────────────

async function updateProfile(userId: string) {
  log('\n👤 Étape 3 — Mise à jour profil Cabinet...')
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      plan: 'cabinet',
      profile_type: 'cabinet',
      onboarding_completed: true,
      subscription_status: 'active',
      factures_limit: 999999,
      max_users: 10,
    }, { onConflict: 'id' })

  if (error) {
    err(`user_profiles: ${error.message}`)
  } else {
    log('  ✅ Plan cabinet + subscription active')
  }
}

// ─── Step 4: Insert demo data ────────────────────────────────────────────────

async function insertData(userId: string) {
  log('\n📦 Étape 4 — Injection données démo...')

  // ── 4.1 Dossier Cabinet ──────────────────────────────────────────────────
  log('  4.1 Dossier Cabinet Moreau & Associés...')
  const { error: dossierErr } = await supabase.from('dossiers').insert({
    user_id: userId,
    nom: 'Cabinet Moreau & Associés',
    siren: '412345678',
    secteur: 'Expertise comptable',
    regime_tva: 'réel normal',
    email: 'contact@moreau-associes.fr',
    telephone: '+33 1 42 60 12 34',
    notes: 'Dossier principal du cabinet — 14 rue de la Paix, 75002 Paris',
    actif: true,
  })
  if (dossierErr) log(`    ⚠ dossier: ${dossierErr.message}`)
  else log('    ✓ Dossier créé')

  // ── 4.2 Clients ──────────────────────────────────────────────────────────
  log('  4.2 Clients...')
  const clientsData = [
    { nom: 'SARL DUPONT BATIMENT',            email: 'contact@dupont-btp.fr',           telephone: '+33 1 43 72 11 22', adresse: '47 avenue Ledru-Rollin, 75011 Paris',       siren: '523456789', notes: 'BTP — CA 450 000€' },
    { nom: 'SAS TECH INNOV',                  email: 'direction@tech-innov.fr',          telephone: '+33 4 78 62 33 44', adresse: '12 cours Lafayette, 69002 Lyon',            siren: '634567890', notes: 'Informatique — CA 280 000€' },
    { nom: 'EURL BOULANGERIE MARTIN',         email: 'martin.boulangerie@hotmail.fr',    telephone: '+33 5 56 44 12 34', adresse: '23 rue Sainte-Catherine, 33000 Bordeaux',   siren: '745678901', notes: 'Alimentaire — CA 180 000€' },
    { nom: 'SCI LES LILAS',                   email: 'gestion@sci-leslilas.fr',          telephone: '+33 4 91 33 55 66', adresse: '8 rue Paradis, 13001 Marseille',            siren: '856789012', notes: 'Immobilier — CA 95 000€' },
    { nom: 'SARL TRANSPORT LECLERC',          email: 'logistique@transport-leclerc.fr',  telephone: '+33 3 20 57 88 99', adresse: '156 boulevard de la Liberté, 59000 Lille',  siren: '967890123', notes: 'Transport — CA 620 000€' },
    { nom: 'SAS CABINET MEDICAL DR PETIT',    email: 'secretariat@drpetit-nantes.fr',    telephone: '+33 2 40 44 22 33', adresse: '5 rue Prémion, 44000 Nantes',               siren: '178901234', notes: 'Santé — CA 210 000€' },
    { nom: 'EURL DESIGN & CO',                email: 'studio@design-co.fr',              telephone: '+33 5 61 22 77 88', adresse: '31 allée Charles de Fitte, 31000 Toulouse', siren: '289012345', notes: 'Communication — CA 145 000€' },
    { nom: 'SA INDUSTRIE RENARD',             email: 'dg@industrie-renard.fr',           telephone: '+33 3 88 76 54 32', adresse: '42 route du Rhin, 67000 Strasbourg',        siren: '390123456', notes: 'Industrie — CA 1 200 000€' },
  ].map(c => ({ ...c, user_id: userId }))

  const { data: clients, error: clientsErr } = await supabase
    .from('clients')
    .insert(clientsData)
    .select('id, nom')

  if (clientsErr || !clients) {
    err(`clients: ${clientsErr?.message}`)
    throw new Error('Impossible de créer les clients')
  }
  log(`    ✓ ${clients.length} clients créés`)

  const clientMap = Object.fromEntries(clients.map(c => [c.nom, c.id]))
  const dupont    = clientMap['SARL DUPONT BATIMENT']
  const techinnov = clientMap['SAS TECH INNOV']
  const martin    = clientMap['EURL BOULANGERIE MARTIN']
  const lilas     = clientMap['SCI LES LILAS']
  const leclerc   = clientMap['SARL TRANSPORT LECLERC']
  const medical   = clientMap['SAS CABINET MEDICAL DR PETIT']
  const design    = clientMap['EURL DESIGN & CO']
  const renard    = clientMap['SA INDUSTRIE RENARD']

  // ── 4.3 Factures clients (40 total, 5 per client) ────────────────────────
  log('  4.3 Factures clients (40)...')

  // Helper: pick status
  // 60% payée, 25% en_attente, 15% en_retard
  const statuses = (i: number) => {
    const s = i % 20
    if (s < 12) return 'payee'        // 60%
    if (s < 17) return 'en_attente'   // 25%
    return 'en_retard'                // 15%
  }

  const factureRows = [
    // DUPONT BATIMENT (BTP, CA 450k) — montants ~10k-50k HT
    { client_id: dupont,   num: '001', objet: 'Travaux fondations immeuble A', montant_ht: 48000, date_emission: '2026-01-05', date_echeance: '2026-02-05', idx: 0 },
    { client_id: dupont,   num: '002', objet: 'Rénovation façade bâtiment',   montant_ht: 32000, date_emission: '2026-01-08', date_echeance: '2026-02-08', idx: 1 },
    { client_id: dupont,   num: '003', objet: 'Pose carrelage salle de bain', montant_ht: 12500, date_emission: '2026-01-12', date_echeance: '2026-02-12', idx: 2 },
    { client_id: dupont,   num: '004', objet: 'Maçonnerie mur porteur',       montant_ht: 28000, date_emission: '2026-01-18', date_echeance: '2026-01-18', idx: 17 }, // retard
    { client_id: dupont,   num: '005', objet: 'Étanchéité toiture terrasse',  montant_ht: 15000, date_emission: '2026-01-25', date_echeance: '2026-02-25', idx: 4 },

    // TECH INNOV (Informatique, CA 280k) — montants ~5k-30k HT
    { client_id: techinnov, num: '006', objet: 'Développement app mobile iOS', montant_ht: 28000, date_emission: '2026-01-06', date_echeance: '2026-02-06', idx: 0 },
    { client_id: techinnov, num: '007', objet: 'Audit cybersécurité SI',       montant_ht: 8500,  date_emission: '2026-01-10', date_echeance: '2026-02-10', idx: 1 },
    { client_id: techinnov, num: '008', objet: 'Migration cloud AWS',          montant_ht: 18000, date_emission: '2026-01-15', date_echeance: '2026-01-15', idx: 18 }, // retard
    { client_id: techinnov, num: '009', objet: 'Maintenance corrective T1',    montant_ht: 5200,  date_emission: '2026-01-20', date_echeance: '2026-02-20', idx: 3 },
    { client_id: techinnov, num: '010', objet: 'Formation React Native équipe',montant_ht: 7800,  date_emission: '2026-01-28', date_echeance: '2026-02-28', idx: 4 },

    // BOULANGERIE MARTIN (Alimentaire, CA 180k) — montants ~2k-15k HT
    { client_id: martin,    num: '011', objet: 'Fournitures professionnelles', montant_ht: 4200,  date_emission: '2026-01-04', date_echeance: '2026-02-04', idx: 0 },
    { client_id: martin,    num: '012', objet: 'Matériel four industriel',     montant_ht: 14500, date_emission: '2026-01-09', date_echeance: '2026-02-09', idx: 1 },
    { client_id: martin,    num: '013', objet: 'Livraison farine premium x50', montant_ht: 2800,  date_emission: '2026-01-14', date_echeance: '2026-02-14', idx: 2 },
    { client_id: martin,    num: '014', objet: 'Révision chambre froide',      montant_ht: 1800,  date_emission: '2026-01-21', date_echeance: '2026-02-21', idx: 3 },
    { client_id: martin,    num: '015', objet: 'Installation vitrine réfrigérée', montant_ht: 9200, date_emission: '2026-01-27', date_echeance: '2026-01-20', idx: 17 }, // retard

    // SCI LES LILAS (Immobilier, CA 95k) — montants ~3k-20k HT
    { client_id: lilas,     num: '016', objet: 'Gestion locative immeuble',    montant_ht: 4800,  date_emission: '2026-01-03', date_echeance: '2026-02-03', idx: 0 },
    { client_id: lilas,     num: '017', objet: 'Syndic copropriété annuel',    montant_ht: 12000, date_emission: '2026-01-07', date_echeance: '2026-02-07', idx: 1 },
    { client_id: lilas,     num: '018', objet: 'Travaux parties communes',     montant_ht: 8500,  date_emission: '2026-01-13', date_echeance: '2026-02-13', idx: 2 },
    { client_id: lilas,     num: '019', objet: 'Diagnostic DPE appartements',  montant_ht: 3200,  date_emission: '2026-01-19', date_echeance: '2026-02-19', idx: 13 }, // attente
    { client_id: lilas,     num: '020', objet: 'Assurance multirisque immeuble', montant_ht: 6500, date_emission: '2026-01-26', date_echeance: '2026-02-26', idx: 14 }, // attente

    // TRANSPORT LECLERC (Transport, CA 620k) — montants ~15k-80k HT
    { client_id: leclerc,   num: '021', objet: 'Transports marchandises Lille-Paris', montant_ht: 42000, date_emission: '2026-01-02', date_echeance: '2026-02-02', idx: 0 },
    { client_id: leclerc,   num: '022', objet: 'Location flotte camions 3 semaines',  montant_ht: 68000, date_emission: '2026-01-06', date_echeance: '2026-02-06', idx: 1 },
    { client_id: leclerc,   num: '023', objet: 'Entretien véhicules flotte',          montant_ht: 18500, date_emission: '2026-01-11', date_echeance: '2026-02-11', idx: 2 },
    { client_id: leclerc,   num: '024', objet: 'Transport frigorifique international', montant_ht: 55000, date_emission: '2026-01-16', date_echeance: '2026-01-16', idx: 18 }, // retard +30j
    { client_id: leclerc,   num: '025', objet: 'Formation conducteurs SPL',           montant_ht: 12200, date_emission: '2026-01-23', date_echeance: '2026-02-23', idx: 4 },

    // CABINET MEDICAL DR PETIT (Santé, CA 210k) — montants ~3k-25k HT
    { client_id: medical,   num: '026', objet: 'Honoraires expertise médicale',   montant_ht: 8500,  date_emission: '2026-01-05', date_echeance: '2026-02-05', idx: 0 },
    { client_id: medical,   num: '027', objet: 'Consultation 35h — janvier',      montant_ht: 5600,  date_emission: '2026-01-10', date_echeance: '2026-02-10', idx: 1 },
    { client_id: medical,   num: '028', objet: 'Matériel médical (stéthoscopes)', montant_ht: 3200,  date_emission: '2026-01-15', date_echeance: '2026-02-15', idx: 2 },
    { client_id: medical,   num: '029', objet: 'Formation FMC hypertension',      montant_ht: 2100,  date_emission: '2026-01-20', date_echeance: '2026-02-20', idx: 13 }, // attente
    { client_id: medical,   num: '030', objet: 'Logiciel gestion cabinet médical', montant_ht: 4800, date_emission: '2026-01-27', date_echeance: '2026-02-27', idx: 14 }, // attente

    // DESIGN & CO (Communication, CA 145k) — montants ~2k-18k HT
    { client_id: design,    num: '031', objet: 'Création identité visuelle',     montant_ht: 12500, date_emission: '2026-01-04', date_echeance: '2026-02-04', idx: 0 },
    { client_id: design,    num: '032', objet: 'Refonte site web e-commerce',    montant_ht: 18000, date_emission: '2026-01-09', date_echeance: '2026-02-09', idx: 1 },
    { client_id: design,    num: '033', objet: 'Campagne réseaux sociaux Q1',    montant_ht: 6500,  date_emission: '2026-01-14', date_echeance: '2026-02-14', idx: 2 },
    { client_id: design,    num: '034', objet: 'Shooting photo produits',        montant_ht: 3800,  date_emission: '2026-01-21', date_echeance: '2026-02-21', idx: 13 }, // attente
    { client_id: design,    num: '035', objet: 'Maquettes packaging premium',    montant_ht: 4200,  date_emission: '2026-01-28', date_echeance: '2026-02-28', idx: 14 }, // attente

    // SA INDUSTRIE RENARD (Industrie, CA 1.2M) — montants ~30k-200k HT
    { client_id: renard,    num: '036', objet: 'Production pièces aluminium x1000', montant_ht: 185000, date_emission: '2026-01-03', date_echeance: '2026-02-03', idx: 0 },
    { client_id: renard,    num: '037', objet: 'Maintenance machines CNC',           montant_ht: 42000,  date_emission: '2026-01-08', date_echeance: '2026-02-08', idx: 1 },
    { client_id: renard,    num: '038', objet: 'Fournitures industrielles Q1',       montant_ht: 68000,  date_emission: '2026-01-13', date_echeance: '2026-02-13', idx: 2 },
    { client_id: renard,    num: '039', objet: 'Prestation ingénierie process',      montant_ht: 95000,  date_emission: '2026-01-20', date_echeance: '2026-01-20', idx: 19 }, // retard +30j
    { client_id: renard,    num: '040', objet: 'Certification ISO 9001 audit',       montant_ht: 28000,  date_emission: '2026-01-27', date_echeance: '2026-02-27', idx: 14 }, // attente
  ].map(f => {
    const stat = statuses(f.idx)
    const tva = Math.round(f.montant_ht * 0.20 * 100) / 100
    const ttc = f.montant_ht + tva
    return {
      user_id: userId,
      client_id: f.client_id,
      numero_facture: `FAC-2026-${f.num}`,
      objet: f.objet,
      montant_ht: f.montant_ht,
      tva,
      montant_ttc: ttc,
      date_emission: f.date_emission,
      date_echeance: f.date_echeance,
      statut_paiement: stat,
      montant_paye: stat === 'payee' ? ttc : stat === 'partiellement_payee' ? ttc * 0.5 : 0,
      date_dernier_paiement: stat === 'payee' ? f.date_emission : null,
    }
  })

  const { data: factures, error: factErr } = await supabase
    .from('factures_clients')
    .insert(factureRows)
    .select('id')

  if (factErr) err(`factures_clients: ${factErr.message}`)
  else log(`    ✓ ${factures?.length} factures créées`)

  // ── 4.4 Déclarations TVA (8, périodes différentes) ───────────────────────
  log('  4.4 Déclarations TVA (8 périodes)...')

  const tvaDeclarations = [
    // Jan 2026 — DUPONT BATIMENT (validée) — CA 450k/12 ≈ 37.5k/mois
    { debut: '2026-01-01', fin: '2026-01-31', ht: 37500,  coll: 7500,  ded: 3000, statut: 'validee',  notes: 'SARL DUPONT BATIMENT — BTP' },
    // Dec 2025 — TECH INNOV (validée)
    { debut: '2025-12-01', fin: '2025-12-31', ht: 23333,  coll: 4667,  ded: 1867, statut: 'validee',  notes: 'SAS TECH INNOV — Informatique' },
    // Nov 2025 — BOULANGERIE MARTIN (validée)
    { debut: '2025-11-01', fin: '2025-11-30', ht: 15000,  coll: 3000,  ded: 1200, statut: 'validee',  notes: 'EURL BOULANGERIE MARTIN — Alimentaire' },
    // Oct 2025 — SCI LES LILAS (validée)
    { debut: '2025-10-01', fin: '2025-10-31', ht: 7917,   coll: 1583,  ded: 633,  statut: 'validee',  notes: 'SCI LES LILAS — Immobilier' },
    // Sep 2025 — TRANSPORT LECLERC (validée)
    { debut: '2025-09-01', fin: '2025-09-30', ht: 51667,  coll: 10333, ded: 4133, statut: 'validee',  notes: 'SARL TRANSPORT LECLERC — Transport' },
    // Aug 2025 — CABINET MEDICAL DR PETIT (en attente / brouillon)
    { debut: '2025-08-01', fin: '2025-08-31', ht: 17500,  coll: 3500,  ded: 1400, statut: 'brouillon', notes: 'SAS CABINET MEDICAL DR PETIT — Santé' },
    // Jul 2025 — DESIGN & CO (en attente / brouillon)
    { debut: '2025-07-01', fin: '2025-07-31', ht: 12083,  coll: 2417,  ded: 967,  statut: 'brouillon', notes: 'EURL DESIGN & CO — Communication' },
    // Jun 2025 — INDUSTRIE RENARD (en attente / brouillon)
    { debut: '2025-06-01', fin: '2025-06-30', ht: 100000, coll: 20000, ded: 8000, statut: 'brouillon', notes: 'SA INDUSTRIE RENARD — Industrie' },
  ].map(d => ({
    user_id: userId,
    periode_debut: d.debut,
    periode_fin: d.fin,
    regime: 'reel_normal' as const,
    montant_ht: d.ht,
    tva_collectee: d.coll,
    tva_deductible: d.ded,
    tva_nette: d.coll - d.ded,
    ventes_tva_20: d.coll,
    achats_tva_20: d.ded,
    statut: d.statut,
    notes: d.notes,
    date_validation: d.statut === 'validee' ? new Date(d.fin).toISOString() : null,
  }))

  const { data: tvaData, error: tvaErr } = await supabase
    .from('declarations_tva')
    .insert(tvaDeclarations)
    .select('id')

  if (tvaErr) err(`declarations_tva: ${tvaErr.message}`)
  else log(`    ✓ ${tvaData?.length} déclarations TVA créées`)

  // ── 4.5 Comptes bancaires pour DUPONT et TECH INNOV ─────────────────────
  log('  4.5 Comptes bancaires + transactions bancaires...')

  const { data: comptes, error: comptesErr } = await supabase
    .from('comptes_bancaires')
    .insert([
      {
        user_id: userId,
        bank_name: 'BNP Paribas',
        account_name: 'Compte pro DUPONT BATIMENT',
        iban: 'FR7614508059418977815826012',
        bic: 'BNPAFRPP',
        current_balance: 85000,
        account_type: 'business',
      },
      {
        user_id: userId,
        bank_name: 'Société Générale',
        account_name: 'Compte pro TECH INNOV',
        iban: 'FR7630004000031234567890143',
        bic: 'SOGEFRPP',
        current_balance: 42000,
        account_type: 'business',
      },
    ])
    .select('id, bank_name')

  if (comptesErr || !comptes) {
    err(`comptes_bancaires: ${comptesErr?.message}`)
  } else {
    log(`    ✓ ${comptes.length} comptes créés`)

    const [compteDupont, comptetech] = comptes

    // ── Transactions DUPONT (15 bank import transactions) ─────────────────
    const txDupontBank = [
      { date: '2026-01-02', description: 'VIR RECU - MAISON DES ARCHITECTES SA', amount: 48000, type: 'income', category: 'sales', status: 'reconciled' },
      { date: '2026-01-04', description: 'PRLV FOURNISSEUR BETON MORTAR SAS', amount: -18500, type: 'expense', category: 'supplies', status: 'reconciled' },
      { date: '2026-01-06', description: 'VIR RECU - PROMOTEUR IMMOBILIER NOVA', amount: 32000, type: 'income', category: 'sales', status: 'reconciled' },
      { date: '2026-01-07', description: 'PRLV SALAIRES JANVIER 2026', amount: -22000, type: 'expense', category: 'salaries', status: 'reconciled' },
      { date: '2026-01-09', description: 'VIR RECU - VILLE DE PARIS TRAVAUX', amount: 12500, type: 'income', category: 'sales', status: 'reconciled' },
      { date: '2026-01-10', description: 'PRLV LOCATION ENGINS LEROY SA', amount: -8500, type: 'expense', category: 'other', status: 'reconciled' },
      { date: '2026-01-12', description: 'VIR RECU - COPROPRIETE LES CHENES', amount: 28000, type: 'income', category: 'sales', status: 'reconciled' },
      { date: '2026-01-14', description: 'FRAIS BANCAIRES JANVIER', amount: -185, type: 'expense', category: 'other', status: 'reconciled' },
      { date: '2026-01-15', description: 'PRLV ASSURANCE PRO ALLIANZ', amount: -2400, type: 'expense', category: 'insurance', status: 'reconciled' },
      { date: '2026-01-16', description: 'VIR RECU - SCI BELLEVILLE', amount: 15000, type: 'income', category: 'sales', status: 'reconciled' },
      // 5 unreconciled / pending
      { date: '2026-01-18', description: 'VIR RECU - INCONNU ENTERPRISE 75', amount: 11000, type: 'income', category: 'other', status: 'active' }, // anomalie > 10k sans justificatif
      { date: '2026-01-20', description: 'PRLV CARBURANT TOTAL ENERGIE', amount: -3200, type: 'expense', category: 'other', status: 'active' },
      { date: '2026-01-22', description: 'VIR RECU - SYNDIC PARIS 11', amount: 8900, type: 'income', category: 'sales', status: 'active' },
      { date: '2026-01-25', description: 'PRLV LOYER ATELIER BAGNOLET', amount: -4500, type: 'expense', category: 'rent', status: 'active' },
      { date: '2026-01-28', description: 'VIR RECU - HABITATION MODERNE SAS', amount: 19500, type: 'income', category: 'sales', status: 'active' },
    ].map(t => ({
      user_id: userId,
      bank_account_id: compteDupont.id,
      date: t.date,
      description: t.description,
      amount: Math.abs(t.amount),
      type: t.type,
      category: t.category,
      source: 'bank_import' as const,
      status: t.status,
      original_description: t.description,
    }))

    // ── Transactions TECH INNOV (15 bank import transactions) ──────────────
    const txTechBank = [
      { date: '2026-01-03', description: 'VIR RECU - STARTUP FINTECH EURO', amount: 28000, type: 'income', category: 'services', status: 'reconciled' },
      { date: '2026-01-05', description: 'PRLV AWS AMAZON WEB SERVICES', amount: -3200, type: 'expense', category: 'subscriptions', status: 'reconciled' },
      { date: '2026-01-07', description: 'VIR RECU - BANQUE NATIONALE AUDIT', amount: 8500, type: 'income', category: 'services', status: 'reconciled' },
      { date: '2026-01-08', description: 'PRLV SALAIRES JANVIER 2026', amount: -15500, type: 'expense', category: 'salaries', status: 'reconciled' },
      { date: '2026-01-10', description: 'VIR RECU - ASSURANCE MUTUELLE INFO', amount: 18000, type: 'income', category: 'services', status: 'reconciled' },
      { date: '2026-01-11', description: 'PRLV LOYER BUREAUX PART-DIEU', amount: -5800, type: 'expense', category: 'rent', status: 'reconciled' },
      { date: '2026-01-13', description: 'VIR RECU - UNIVERSITE CLAUDE BERNARD', amount: 5200, type: 'income', category: 'services', status: 'reconciled' },
      { date: '2026-01-14', description: 'FRAIS BANCAIRES + CARTE PRO', amount: -240, type: 'expense', category: 'other', status: 'reconciled' },
      { date: '2026-01-15', description: 'PRLV GITHUB ENTERPRISE ANNUEL', amount: -1800, type: 'expense', category: 'subscriptions', status: 'reconciled' },
      { date: '2026-01-17', description: 'VIR RECU - REGION AUVERGNE-RHONE SUB', amount: 7800, type: 'income', category: 'services', status: 'reconciled' },
      // 5 unreconciled
      { date: '2026-01-19', description: 'PRLV MICROSOFT 365 BUSINESS', amount: -580, type: 'expense', category: 'subscriptions', status: 'active' },
      { date: '2026-01-21', description: 'VIR RECU - PME DIGITALE 69', amount: 12500, type: 'income', category: 'services', status: 'active' }, // anomalie > 10k
      { date: '2026-01-23', description: 'PRLV MUTUELLE MALAKOFF HUMANIS', amount: -920, type: 'expense', category: 'insurance', status: 'active' },
      { date: '2026-01-25', description: 'VIR RECU - COLLECTIVITE TERRITORIALE', amount: 4800, type: 'income', category: 'services', status: 'active' },
      { date: '2026-01-28', description: 'PRLV COMPTABLE EXPERTISE SUD-EST', amount: -2200, type: 'expense', category: 'other', status: 'active' },
    ].map(t => ({
      user_id: userId,
      bank_account_id: comptetech.id,
      date: t.date,
      description: t.description,
      amount: Math.abs(t.amount),
      type: t.type,
      category: t.category,
      source: 'bank_import' as const,
      status: t.status,
      original_description: t.description,
    }))

    const { data: txData, error: txErr } = await supabase
      .from('transactions')
      .insert([...txDupontBank, ...txTechBank])
      .select('id, description, status, bank_account_id')

    if (txErr) {
      err(`transactions: ${txErr.message}`)
    } else {
      log(`    ✓ ${txData?.length} transactions bancaires créées`)

      // ── Rapprochements (pair reconciled transactions) ─────────────────────
      // For each reconciled bank transaction, create a matching manual entry + rapprochement
      const reconciled = txData?.filter(t => t.status === 'reconciled') ?? []

      // Create manual transactions to match against
      const manualTx = reconciled.map(bt => ({
        user_id: userId,
        bank_account_id: bt.bank_account_id,
        date: '2026-01-15', // approximate
        description: `Écriture manuelle — ${bt.description.substring(0, 40)}`,
        amount: 1000, // simplified
        type: 'income' as const,
        category: 'sales',
        source: 'manual' as const,
        status: 'reconciled',
      }))

      const { data: manualData, error: manualErr } = await supabase
        .from('transactions')
        .insert(manualTx)
        .select('id')

      if (manualErr) {
        err(`manual transactions: ${manualErr.message}`)
      } else {
        // Create rapprochements pairing bank + manual
        const rapprochements = reconciled.map((bt, i) => ({
          user_id: userId,
          transaction_id: manualData![i].id,
          bank_transaction_id: bt.id,
          match_score: 0.85 + Math.random() * 0.14,
          match_method: 'auto' as const,
          date_score: 0.90,
          amount_score: 0.85,
          description_score: 0.80,
          status: 'confirmed' as const,
          confirmed_at: new Date().toISOString(),
          confirmed_by_user: true,
        }))

        const { data: rapData, error: rapErr } = await supabase
          .from('rapprochements')
          .insert(rapprochements)
          .select('id')

        if (rapErr) err(`rapprochements: ${rapErr.message}`)
        else log(`    ✓ ${rapData?.length} rapprochements confirmés`)
      }
    }
  }

  // ── 4.6 Alertes (5) ──────────────────────────────────────────────────────
  log('  4.6 Alertes (5)...')

  const alertsData = [
    {
      user_id: userId,
      type: 'facture_impayee' as const,
      severite: 'critical' as const,
      titre: 'Facture FAC-2026-024 en retard +30 jours',
      description: 'SARL TRANSPORT LECLERC — Transport frigorifique international — 66 000 € TTC — Échéance 16/01/2026 dépassée',
      impact_financier: 66000,
      actions_suggerees: JSON.stringify(['Envoyer mise en demeure', 'Contacter le client', 'Transmettre au contentieux']),
      statut: 'nouvelle' as const,
    },
    {
      user_id: userId,
      type: 'facture_impayee' as const,
      severite: 'critical' as const,
      titre: 'Facture FAC-2026-039 en retard +30 jours',
      description: 'SA INDUSTRIE RENARD — Prestation ingénierie process — 114 000 € TTC — Échéance 20/01/2026 dépassée',
      impact_financier: 114000,
      actions_suggerees: JSON.stringify(['Envoyer relance formelle', 'Planifier réunion client', 'Évaluer provision créances douteuses']),
      statut: 'nouvelle' as const,
    },
    {
      user_id: userId,
      type: 'ecart_tva' as const,
      severite: 'warning' as const,
      titre: 'Déclaration TVA à soumettre avant le 15/03/2026',
      description: '3 déclarations TVA en statut brouillon pour les périodes juin, juillet et août 2025. TVA nette totale estimée : 23 533 €',
      impact_financier: 23533,
      actions_suggerees: JSON.stringify(['Valider les déclarations', 'Télédéclarer sur impots.gouv.fr', 'Payer avant le 15/03/2026']),
      statut: 'nouvelle' as const,
    },
    {
      user_id: userId,
      type: 'rapprochement_echoue' as const,
      severite: 'warning' as const,
      titre: 'Rapprochement non finalisé — SCI LES LILAS',
      description: '5 transactions bancaires non rapprochées depuis plus de 15 jours. Solde en suspens : 38 400 €',
      impact_financier: 38400,
      actions_suggerees: JSON.stringify(['Compléter le rapprochement bancaire', 'Identifier les transactions manquantes', 'Contacter la banque si nécessaire']),
      statut: 'nouvelle' as const,
    },
    {
      user_id: userId,
      type: 'seuil_depasse' as const,
      severite: 'info' as const,
      titre: 'Dossier incomplet — EURL DESIGN & CO',
      description: 'Les pièces justificatives de 2 factures (FAC-2026-034, FAC-2026-035) sont manquantes. Montant concerné : 9 600 € HT',
      impact_financier: 9600,
      actions_suggerees: JSON.stringify(['Relancer le client pour les justificatifs', 'Mettre à jour le dossier', 'Archiver les documents reçus']),
      statut: 'nouvelle' as const,
    },
  ]

  const { data: alertsRes, error: alertsErr } = await supabase
    .from('alerts')
    .insert(alertsData)
    .select('id')

  if (alertsErr) err(`alerts: ${alertsErr.message}`)
  else log(`    ✓ ${alertsRes?.length} alertes créées`)
}

// ─── Step 5: Verify ─────────────────────────────────────────────────────────

async function verify(userId: string) {
  log('\n✅ Étape 5 — Vérification des counts...')

  const tables = [
    'clients',
    'factures_clients',
    'declarations_tva',
    'transactions',
    'rapprochements',
    'comptes_bancaires',
    'alerts',
    'dossiers',
  ]

  const results: Record<string, number> = {}

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('user_id', userId)
    if (error) {
      log(`  ⚠ ${table}: ${error.message}`)
    } else {
      results[table] = data?.length ?? 0
      log(`  ${table}: ${results[table]}`)
    }
  }

  log('\n📊 Récapitulatif :')
  log(`  clients         : ${results['clients']} (attendu: 8)`)
  log(`  factures_clients: ${results['factures_clients']} (attendu: 40)`)
  log(`  declarations_tva: ${results['declarations_tva']} (attendu: 8)`)
  log(`  transactions    : ${results['transactions']} (attendu: ~50)`)
  log(`  rapprochements  : ${results['rapprochements']} (attendu: ~20)`)
  log(`  alertes         : ${results['alerts']} (attendu: 5)`)
  log(`  dossiers        : ${results['dossiers']} (attendu: 1)`)

  return results
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  log('🚀 ================================================================')
  log('🚀  Seed Cabinet Moreau — harounchikh71@gmail.com')
  log('🚀 ================================================================')

  try {
    const userId = await getUserId()
    await cleanData(userId)
    await updateProfile(userId)
    await insertData(userId)
    const counts = await verify(userId)

    log('\n🎉 Seed terminé avec succès!')
    log(`   ✅ ${counts['clients']} clients`)
    log(`   ✅ ${counts['factures_clients']} factures`)
    log(`   ✅ ${counts['declarations_tva']} déclarations TVA`)
    log(`   ✅ ${counts['transactions']} transactions`)
    log(`   ✅ ${counts['rapprochements']} rapprochements`)
    log(`   ✅ ${counts['alerts']} alertes`)

  } catch (e) {
    err(`Erreur fatale: ${e}`)
    process.exit(1)
  }
}

main()
