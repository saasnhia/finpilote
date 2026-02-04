import Papa from 'papaparse'
import type { BankImportPreview, BankTransaction } from '@/types'

// Format detection signatures
const FORMAT_SIGNATURES = {
  bnp: ['Date', 'Libellé', 'Débit', 'Crédit'],
  societe_generale: ['Date opération', 'Libellé', 'Montant'],
  credit_agricole: ['Date', 'Date valeur', 'Débit Euros', 'Crédit Euros'],
}

type BankFormat = 'bnp' | 'societe_generale' | 'credit_agricole' | 'unknown'

interface ParsedCSVRow {
  [key: string]: string
}

/**
 * Detect bank format from CSV headers
 */
function detectBankFormat(headers: string[]): BankFormat {
  // Normalize headers (trim, lowercase)
  const normalizedHeaders = headers.map(h => h.trim())

  // Check BNP Paribas format
  if (FORMAT_SIGNATURES.bnp.every(sig =>
    normalizedHeaders.some(h => h.includes(sig))
  )) {
    return 'bnp'
  }

  // Check Société Générale format
  if (FORMAT_SIGNATURES.societe_generale.every(sig =>
    normalizedHeaders.some(h => h.includes(sig))
  )) {
    return 'societe_generale'
  }

  // Check Crédit Agricole format
  if (FORMAT_SIGNATURES.credit_agricole.every(sig =>
    normalizedHeaders.some(h => h.includes(sig))
  )) {
    return 'credit_agricole'
  }

  return 'unknown'
}

/**
 * Normalize French date to ISO format (YYYY-MM-DD)
 */
function normalizeDate(dateStr: string): string {
  // Handle common French formats: DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.split(/[\/\-]/)
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return dateStr
}

/**
 * Parse amount string to number (handle French format: "1 234,56")
 */
function parseAmount(amountStr: string): number {
  // Remove spaces and replace comma with dot
  const normalized = amountStr.trim().replace(/\s/g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

/**
 * Parse BNP Paribas CSV format
 */
function parseBNP(rows: ParsedCSVRow[]): BankTransaction[] {
  return rows
    .filter(row => row['Date'] && (row['Débit'] || row['Crédit']))
    .map(row => {
      const debit = parseAmount(row['Débit'] || '0')
      const credit = parseAmount(row['Crédit'] || '0')
      const amount = credit > 0 ? credit : -Math.abs(debit)

      return {
        date: normalizeDate(row['Date']),
        description: row['Libellé'] || '',
        amount: Math.abs(amount),
        type: amount >= 0 ? 'income' as const : 'expense' as const,
        balance_after: row['Solde'] ? parseAmount(row['Solde']) : undefined,
      }
    })
}

/**
 * Parse Société Générale CSV format
 */
function parseSocieteGenerale(rows: ParsedCSVRow[]): BankTransaction[] {
  return rows
    .filter(row => row['Date opération'] && row['Montant'])
    .map(row => {
      const amount = parseAmount(row['Montant'])

      return {
        date: normalizeDate(row['Date opération']),
        description: row['Libellé'] || '',
        amount: Math.abs(amount),
        type: amount >= 0 ? 'income' as const : 'expense' as const,
        balance_after: row['Solde'] ? parseAmount(row['Solde']) : undefined,
      }
    })
}

/**
 * Parse Crédit Agricole CSV format
 */
function parseCreditAgricole(rows: ParsedCSVRow[]): BankTransaction[] {
  return rows
    .filter(row => row['Date'] && (row['Débit Euros'] || row['Crédit Euros']))
    .map(row => {
      const debit = parseAmount(row['Débit Euros'] || '0')
      const credit = parseAmount(row['Crédit Euros'] || '0')
      const amount = credit > 0 ? credit : -Math.abs(debit)

      return {
        date: normalizeDate(row['Date']),
        description: row['Libellé'] || '',
        amount: Math.abs(amount),
        type: amount >= 0 ? 'income' as const : 'expense' as const,
        balance_after: row['Solde'] ? parseAmount(row['Solde']) : undefined,
      }
    })
}

/**
 * Main CSV parser function
 */
export async function parseBankCSV(
  csvContent: string,
  fileName: string
): Promise<BankImportPreview> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const headers = results.meta.fields || []
          const rows = results.data as ParsedCSVRow[]

          // Detect bank format
          const detectedFormat = detectBankFormat(headers)
          const warnings: string[] = []

          // Parse transactions based on detected format
          let transactions: BankTransaction[] = []

          switch (detectedFormat) {
            case 'bnp':
              transactions = parseBNP(rows)
              break
            case 'societe_generale':
              transactions = parseSocieteGenerale(rows)
              break
            case 'credit_agricole':
              transactions = parseCreditAgricole(rows)
              break
            default:
              warnings.push('Format de banque non reconnu. Vérifiez le fichier CSV.')
              resolve({
                file_name: fileName,
                bank_name: 'Inconnu',
                detected_format: 'unknown',
                total_transactions: 0,
                date_range: { start: '', end: '' },
                transactions: [],
                warnings,
              })
              return
          }

          // Add warning if no transactions parsed
          if (transactions.length === 0) {
            warnings.push('Aucune transaction trouvée dans le fichier.')
          }

          // Calculate date range
          const dates = transactions.map(t => t.date).sort()
          const dateRange = {
            start: dates[0] || '',
            end: dates[dates.length - 1] || '',
          }

          // Get bank name
          const bankNames = {
            bnp: 'BNP Paribas',
            societe_generale: 'Société Générale',
            credit_agricole: 'Crédit Agricole',
            unknown: 'Inconnu',
          }

          resolve({
            file_name: fileName,
            bank_name: bankNames[detectedFormat],
            detected_format: detectedFormat,
            total_transactions: transactions.length,
            date_range: dateRange,
            transactions,
            warnings,
          })
        } catch (error: any) {
          reject(new Error(`Erreur lors du parsing CSV: ${error.message}`))
        }
      },
      error: (error: any) => {
        reject(new Error(`Erreur Papa Parse: ${error.message}`))
      },
    })
  })
}

/**
 * Validate CSV file before parsing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'Le fichier doit être au format CSV' }
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Fichier trop volumineux (max 5MB)' }
  }

  return { valid: true }
}
