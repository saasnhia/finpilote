// ============================================================
// Parseur Excel batch — import en masse de factures
// Format attendu : colonnes Fournisseur, Montant HT, Date, etc.
// ============================================================

import * as XLSX from 'xlsx'

export interface ExcelFactureRow {
  fournisseur: string
  montant_ht: number | null
  montant_ttc: number | null
  montant_tva: number | null
  date_facture: string | null       // ISO YYYY-MM-DD
  numero_facture: string | null
  compte_comptable: string | null
  code_tva: string | null
}

export interface ExcelBatchParseResult {
  rows: ExcelFactureRow[]
  valid_count: number
  skipped_count: number
  errors: string[]
  headers_detected: string[]
}

// Column name aliases (case-insensitive)
const COLUMN_ALIASES: Record<string, string[]> = {
  fournisseur:     ['fournisseur', 'supplier', 'vendeur', 'prestataire', 'nom'],
  montant_ht:      ['montant ht', 'montant_ht', 'ht', 'montant hors taxe', 'prix ht', 'total ht'],
  montant_ttc:     ['montant ttc', 'montant_ttc', 'ttc', 'total ttc', 'prix ttc', 'montant'],
  montant_tva:     ['tva', 'montant tva', 'montant_tva', 'taxe'],
  date_facture:    ['date', 'date facture', 'date_facture', 'date émission', 'date emission'],
  numero_facture:  ['numéro', 'numero', 'n°', 'référence', 'ref', 'facture n°', 'numero facture', 'num facture'],
  compte_comptable:['compte', 'compte pcg', 'compte_comptable', 'pcg', 'compte comptable'],
  code_tva:        ['code tva', 'code_tva', 'taux tva', 'taux'],
}

function findColumn(headers: string[], field: string): number {
  const aliases = COLUMN_ALIASES[field] ?? [field]
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().trim()
    if (aliases.some(a => h === a || h.includes(a))) return i
  }
  return -1
}

function normalizeDateCell(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null

  // Excel serial date number
  if (typeof raw === 'number') {
    const date = XLSX.SSF.parse_date_code(raw)
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    }
  }

  const s = String(raw).trim()

  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // MM/YYYY → first day of month
  const my = s.match(/^(\d{1,2})[\/\-.](\d{4})$/)
  if (my) return `${my[2]}-${my[1].padStart(2, '0')}-01`

  return null
}

function parseAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw === 'number') return Math.round(raw * 100) / 100
  const cleaned = String(raw).replace(/[\s€]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : Math.round(n * 100) / 100
}

/**
 * Parse un buffer Excel et retourne les lignes de factures structurées.
 */
export function parseExcelBatch(buffer: Buffer): ExcelBatchParseResult {
  const errors: string[] = []
  const rows: ExcelFactureRow[] = []
  let skipped_count = 0

  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rows: [], valid_count: 0, skipped_count: 0, errors: ['Aucune feuille trouvée dans le fichier Excel'], headers_detected: [] }
  }

  const sheet = workbook.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

  if (raw.length < 2) {
    return { rows: [], valid_count: 0, skipped_count: 0, errors: ['Feuille vide ou sans données'], headers_detected: [] }
  }

  // First row = headers
  const headers = (raw[0] as unknown[]).map(h => String(h ?? ''))

  // Map column indices
  const colIdx: Record<string, number> = {}
  for (const field of Object.keys(COLUMN_ALIASES)) {
    colIdx[field] = findColumn(headers, field)
  }

  if (colIdx.fournisseur === -1 && colIdx.montant_ht === -1 && colIdx.montant_ttc === -1) {
    errors.push('Colonnes obligatoires introuvables. Assurez-vous que le fichier contient Fournisseur et Montant HT ou Montant TTC.')
    return { rows: [], valid_count: 0, skipped_count: raw.length - 1, errors, headers_detected: headers }
  }

  // Parse data rows
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i] as unknown[]

    const fournisseur = colIdx.fournisseur >= 0 ? String(row[colIdx.fournisseur] ?? '').trim() : ''
    if (!fournisseur) {
      skipped_count++
      continue
    }

    const montant_ht = colIdx.montant_ht >= 0 ? parseAmount(row[colIdx.montant_ht]) : null
    const montant_ttc = colIdx.montant_ttc >= 0 ? parseAmount(row[colIdx.montant_ttc]) : null
    const montant_tva = colIdx.montant_tva >= 0 ? parseAmount(row[colIdx.montant_tva]) : null

    // Need at least one amount
    if (montant_ht === null && montant_ttc === null) {
      errors.push(`Ligne ${i + 1}: aucun montant trouvé pour "${fournisseur}" — ligne ignorée`)
      skipped_count++
      continue
    }

    rows.push({
      fournisseur,
      montant_ht,
      montant_ttc,
      montant_tva,
      date_facture: colIdx.date_facture >= 0 ? normalizeDateCell(row[colIdx.date_facture]) : null,
      numero_facture: colIdx.numero_facture >= 0 ? String(row[colIdx.numero_facture] ?? '').trim() || null : null,
      compte_comptable: colIdx.compte_comptable >= 0 ? String(row[colIdx.compte_comptable] ?? '').trim() || null : null,
      code_tva: colIdx.code_tva >= 0 ? String(row[colIdx.code_tva] ?? '').trim() || null : null,
    })
  }

  return {
    rows,
    valid_count: rows.length,
    skipped_count,
    errors,
    headers_detected: headers,
  }
}
