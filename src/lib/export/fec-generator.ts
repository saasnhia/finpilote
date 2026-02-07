import type { Transaction, FECEntry, FECGenerationResult } from '@/types'

/**
 * Mapping des catégories FinPilote → comptes PCG
 */
const CATEGORY_TO_PCG: Record<string, { num: string; lib: string }> = {
  // Charges
  rent: { num: '613100', lib: 'Locations immobilières' },
  salaries: { num: '641100', lib: 'Rémunérations du personnel' },
  insurance: { num: '616100', lib: 'Primes d\'assurances' },
  subscriptions: { num: '613500', lib: 'Locations mobilières' },
  loan_payments: { num: '661100', lib: 'Intérêts des emprunts' },
  supplies: { num: '606100', lib: 'Fournitures non stockables' },
  marketing: { num: '623100', lib: 'Publicité, publications' },
  utilities: { num: '606400', lib: 'Fournitures administratives' },
  // Produits
  sales: { num: '707100', lib: 'Ventes de marchandises' },
  services: { num: '706100', lib: 'Prestations de services' },
  // Par défaut
  other: { num: '658000', lib: 'Charges diverses de gestion' },
}

const JOURNAL_CODES: Record<string, { code: string; lib: string }> = {
  income: { code: 'VE', lib: 'Journal de Ventes' },
  expense: { code: 'AC', lib: 'Journal d\'Achats' },
}

/**
 * Formate une date au format YYYYMMDD (norme FEC)
 */
function formatFECDate(dateStr: string): string {
  return dateStr.replace(/-/g, '').slice(0, 8)
}

/**
 * Formate un montant au format FEC (virgule décimale, 2 décimales)
 */
function formatFECAmount(amount: number): string {
  return Math.abs(amount).toFixed(2).replace('.', ',')
}

/**
 * Génère un numéro d'écriture séquentiel
 */
function generateEcritureNum(index: number): string {
  return String(index + 1).padStart(6, '0')
}

/**
 * Génère le fichier FEC à partir des transactions
 * Conforme au format DGFiP 2026
 */
export function generateFEC(
  transactions: Transaction[],
  year: number,
  siren: string = '000000000'
): FECGenerationResult {
  const entries: FECEntry[] = []
  const warnings: string[] = []
  let totalDebit = 0
  let totalCredit = 0

  // Filter transactions for the fiscal year
  const yearStr = String(year)
  const yearTransactions = transactions
    .filter(t => t.date.startsWith(yearStr))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (yearTransactions.length === 0) {
    warnings.push(`Aucune transaction trouvée pour l'année ${year}`)
  }

  let ecritureIndex = 0

  for (const tx of yearTransactions) {
    const journal = JOURNAL_CODES[tx.type] || JOURNAL_CODES.expense
    const pcg = CATEGORY_TO_PCG[tx.category] || CATEGORY_TO_PCG.other
    const ecritureNum = generateEcritureNum(ecritureIndex)
    const ecritureDate = formatFECDate(tx.date)
    const amount = Math.abs(tx.amount)
    const amountStr = formatFECAmount(amount)

    // Validate
    if (!tx.date || tx.date.length < 10) {
      warnings.push(`Transaction ${tx.id}: date invalide (${tx.date})`)
      continue
    }

    if (amount === 0) {
      warnings.push(`Transaction ${tx.id}: montant nul ignoré`)
      continue
    }

    // Ligne 1: Compte de charge/produit
    const entry1: FECEntry = {
      JournalCode: journal.code,
      JournalLib: journal.lib,
      EcritureNum: ecritureNum,
      EcritureDate: ecritureDate,
      CompteNum: pcg.num,
      CompteLib: pcg.lib,
      CompAuxNum: '',
      CompAuxLib: '',
      PieceRef: tx.import_batch_id || tx.id.slice(0, 8),
      PieceDate: ecritureDate,
      EcritureLib: tx.description.slice(0, 200),
      Debit: tx.type === 'expense' ? amountStr : '0,00',
      Credit: tx.type === 'income' ? amountStr : '0,00',
      EcritureLet: '',
      DateLet: '',
      ValidDate: ecritureDate,
      Montantdevise: '',
      Idevise: 'EUR',
    }

    // Ligne 2: Contrepartie (compte de trésorerie)
    const entry2: FECEntry = {
      JournalCode: journal.code,
      JournalLib: journal.lib,
      EcritureNum: ecritureNum,
      EcritureDate: ecritureDate,
      CompteNum: '512000',
      CompteLib: 'Banque',
      CompAuxNum: '',
      CompAuxLib: '',
      PieceRef: tx.import_batch_id || tx.id.slice(0, 8),
      PieceDate: ecritureDate,
      EcritureLib: tx.description.slice(0, 200),
      Debit: tx.type === 'income' ? amountStr : '0,00',
      Credit: tx.type === 'expense' ? amountStr : '0,00',
      EcritureLet: '',
      DateLet: '',
      ValidDate: ecritureDate,
      Montantdevise: '',
      Idevise: 'EUR',
    }

    entries.push(entry1, entry2)

    if (tx.type === 'expense') {
      totalDebit += amount
      totalCredit += amount
    } else {
      totalDebit += amount
      totalCredit += amount
    }

    ecritureIndex++

    // Add TVA entries if applicable
    if (tx.tva_taux && tx.tva_taux > 0) {
      const tvaNum = generateEcritureNum(ecritureIndex)
      const ht = amount / (1 + tx.tva_taux / 100)
      const tva = amount - ht

      if (tva > 0.01) {
        const tvaEntry: FECEntry = {
          JournalCode: journal.code,
          JournalLib: journal.lib,
          EcritureNum: tvaNum,
          EcritureDate: ecritureDate,
          CompteNum: tx.type === 'income' ? '445710' : '445660',
          CompteLib: tx.type === 'income' ? 'TVA collectée' : 'TVA déductible',
          CompAuxNum: '',
          CompAuxLib: '',
          PieceRef: tx.import_batch_id || tx.id.slice(0, 8),
          PieceDate: ecritureDate,
          EcritureLib: `TVA ${tx.tva_taux}% - ${tx.description.slice(0, 150)}`,
          Debit: tx.type === 'expense' ? formatFECAmount(tva) : '0,00',
          Credit: tx.type === 'income' ? formatFECAmount(tva) : '0,00',
          EcritureLet: '',
          DateLet: '',
          ValidDate: ecritureDate,
          Montantdevise: '',
          Idevise: 'EUR',
        }

        entries.push(tvaEntry)
        ecritureIndex++
      }
    }
  }

  // Validate FEC balance
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    warnings.push(
      `Écart d'équilibre détecté: Débit=${totalDebit.toFixed(2)}, Crédit=${totalCredit.toFixed(2)}`
    )
  }

  // Generate filename
  const dateCloture = `${year}1231`
  const filename = `${siren}FEC${dateCloture}.txt`

  return {
    entries,
    filename,
    total_entries: entries.length,
    total_debit: totalDebit,
    total_credit: totalCredit,
    warnings,
  }
}

/**
 * Convertit les entrées FEC en texte tabulé (format DGFiP)
 */
export function fecToText(entries: FECEntry[]): string {
  const headers = [
    'JournalCode',
    'JournalLib',
    'EcritureNum',
    'EcritureDate',
    'CompteNum',
    'CompteLib',
    'CompAuxNum',
    'CompAuxLib',
    'PieceRef',
    'PieceDate',
    'EcritureLib',
    'Debit',
    'Credit',
    'EcritureLet',
    'DateLet',
    'ValidDate',
    'Montantdevise',
    'Idevise',
  ]

  const lines = [headers.join('\t')]

  for (const entry of entries) {
    const row = headers.map(h => (entry as any)[h] || '')
    lines.push(row.join('\t'))
  }

  return lines.join('\n')
}

/**
 * Convertit les entrées FEC en CSV
 */
export function fecToCSV(entries: FECEntry[]): string {
  const headers = [
    'JournalCode',
    'JournalLib',
    'EcritureNum',
    'EcritureDate',
    'CompteNum',
    'CompteLib',
    'CompAuxNum',
    'CompAuxLib',
    'PieceRef',
    'PieceDate',
    'EcritureLib',
    'Debit',
    'Credit',
    'EcritureLet',
    'DateLet',
    'ValidDate',
    'Montantdevise',
    'Idevise',
  ]

  const lines = [headers.join(';')]

  for (const entry of entries) {
    const row = headers.map(h => {
      const val = (entry as any)[h] || ''
      // Escape semicolons and quotes
      if (val.includes(';') || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    })
    lines.push(row.join(';'))
  }

  return lines.join('\n')
}
