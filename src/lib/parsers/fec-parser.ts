// ============================================================
// Parseur FEC (Fichier des Écritures Comptables)
// Format DGFiP — norme NF Z 69-013
// ============================================================

export interface FECEntry {
  JournalCode: string
  JournalLib: string
  EcritureNum: string
  EcritureDate: string  // YYYYMMDD
  CompteNum: string
  CompteLib: string
  CompAuxNum: string
  CompAuxLib: string
  PieceRef: string
  PieceDate: string
  EcritureLib: string
  Debit: number
  Credit: number
}

export interface FECParseResult {
  entries: FECEntry[]
  total_entries: number
  debit_total: number
  credit_total: number
  date_range: { min: string; max: string } | null
  errors: string[]
  detected_separator: '\t' | ';'
}

// FEC fields in standard order
const FEC_FIELDS = [
  'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
  'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
  'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
  'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
] as const

/**
 * Détecte le séparateur du fichier FEC (tab ou point-virgule)
 */
function detectSeparator(firstLine: string): '\t' | ';' {
  const tabCount = (firstLine.match(/\t/g) ?? []).length
  const semiCount = (firstLine.match(/;/g) ?? []).length
  return tabCount >= semiCount ? '\t' : ';'
}

/**
 * Parse un montant FEC (virgule décimale ou point, peut être vide)
 */
function parseFECAmount(val: string): number {
  if (!val || val.trim() === '') return 0
  const cleaned = val.replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : Math.round(n * 100) / 100
}

/**
 * Convertit une date FEC (YYYYMMDD) en ISO (YYYY-MM-DD)
 */
export function fecDateToISO(d: string): string {
  if (!d || d.length !== 8) return new Date().toISOString().split('T')[0]
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

/**
 * Parse un buffer FEC et retourne les écritures structurées.
 */
export function parseFEC(content: string): FECParseResult {
  const errors: string[] = []
  const entries: FECEntry[] = []

  const lines = content.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) {
    return {
      entries: [],
      total_entries: 0,
      debit_total: 0,
      credit_total: 0,
      date_range: null,
      errors: ['Fichier FEC vide ou insuffisant'],
      detected_separator: '\t',
    }
  }

  const separator = detectSeparator(lines[0])

  // Validate header
  const headerFields = lines[0].split(separator).map(h => h.trim())
  const hasJournalCode = headerFields[0]?.toLowerCase().includes('journalcode') ||
    headerFields[0]?.toLowerCase().includes('journal')

  if (!hasJournalCode) {
    errors.push('En-tête FEC non reconnu. Vérifiez que JournalCode est la première colonne.')
  }

  // Parse data lines
  let debit_total = 0
  let credit_total = 0
  const dates: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(separator)
    if (parts.length < 13) {
      errors.push(`Ligne ${i + 1}: nombre de colonnes insuffisant (${parts.length}/13)`)
      continue
    }

    const debit = parseFECAmount(parts[11])
    const credit = parseFECAmount(parts[12])
    const ecritureDate = parts[3]?.trim() ?? ''

    const entry: FECEntry = {
      JournalCode: parts[0]?.trim() ?? '',
      JournalLib:  parts[1]?.trim() ?? '',
      EcritureNum: parts[2]?.trim() ?? '',
      EcritureDate: ecritureDate,
      CompteNum:   parts[4]?.trim() ?? '',
      CompteLib:   parts[5]?.trim() ?? '',
      CompAuxNum:  parts[6]?.trim() ?? '',
      CompAuxLib:  parts[7]?.trim() ?? '',
      PieceRef:    parts[8]?.trim() ?? '',
      PieceDate:   parts[9]?.trim() ?? '',
      EcritureLib: parts[10]?.trim() ?? '',
      Debit: debit,
      Credit: credit,
    }

    entries.push(entry)
    debit_total += debit
    credit_total += credit
    if (ecritureDate.length === 8) dates.push(ecritureDate)
  }

  const date_range = dates.length > 0
    ? { min: fecDateToISO(dates.sort()[0]), max: fecDateToISO(dates.sort()[dates.length - 1]) }
    : null

  return {
    entries,
    total_entries: entries.length,
    debit_total: Math.round(debit_total * 100) / 100,
    credit_total: Math.round(credit_total * 100) / 100,
    date_range,
    errors,
    detected_separator: separator,
  }
}

/**
 * Détermine si un compte FEC est importable comme transaction.
 * Retourne le type de transaction si applicable, null sinon.
 */
export function fecEntryToTransactionType(compteNum: string): 'expense' | 'income' | null {
  const prefix = compteNum.trim().substring(0, 1)
  if (prefix === '6') return 'expense'    // Comptes de charges
  if (prefix === '7') return 'income'     // Comptes de produits
  return null  // Bilan, tiers, etc. → ignoré
}

/**
 * Mappe un code journal FEC vers une catégorie FinSoft
 */
export function mapJournalToCategory(journalCode: string): string {
  const code = journalCode.toUpperCase().trim()
  const map: Record<string, string> = {
    'VE': 'sales',
    'VT': 'sales',
    'AC': 'supplies',
    'HA': 'supplies',
    'BQ': 'other',
    'CA': 'other',
    'OD': 'other',
    'AN': 'other',
  }
  return map[code] ?? 'other'
}
