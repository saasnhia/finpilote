import type { SupplierHistory } from './matching-types'

/**
 * Normalise un nom de fournisseur pour le matching historique.
 */
function normalizeSupplier(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(sas|sarl|eurl|sa|srl|sci|et\s+cie|inc|ltd|gmbh)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrait les patterns utiles d'une description de transaction bancaire.
 * Ex: "VIR SEPA DURAND PEINTURE REF 2026-003" -> ["durand peinture"]
 */
function extractTransactionPattern(description: string): string {
  return description
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // Remove common banking prefixes
    .replace(/^(vir|virement|prlv|prelevement|carte|cb|paiement|cheque|chq)\s*(sepa|europeen)?\s*/i, '')
    // Remove dates and reference numbers
    .replace(/\b(ref|reference|n°|num|facture|fact)\s*[:.]?\s*\S+/gi, '')
    .replace(/\b\d{2}[/-]\d{2}[/-]\d{2,4}\b/g, '')
    // Clean up
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrait un pattern IBAN depuis une description de transaction.
 * Retourne les 8 premiers caracteres de l'IBAN s'il est trouve.
 */
function extractIBANPattern(description: string): string | null {
  const ibanMatch = description.match(/\b([A-Z]{2}\d{2}[A-Z0-9]{4})/i)
  return ibanMatch ? ibanMatch[1].toUpperCase() : null
}

/**
 * Met a jour l'historique fournisseur apres un rapprochement valide.
 * Retourne un objet SupplierHistory mis a jour ou nouveau.
 */
export function updateSupplierHistory(
  existingHistories: SupplierHistory[],
  supplierName: string,
  transactionDescription: string,
  transactionAmount: number
): SupplierHistory {
  const normalized = normalizeSupplier(supplierName)
  const pattern = extractTransactionPattern(transactionDescription)
  const iban = extractIBANPattern(transactionDescription)

  // Find existing history
  const existing = existingHistories.find(h => h.supplier_normalized === normalized)

  if (existing) {
    // Update existing
    const patterns = new Set(existing.transaction_patterns)
    if (pattern && pattern.length >= 3) patterns.add(pattern)

    const ibans = new Set(existing.iban_patterns)
    if (iban) ibans.add(iban)

    const newCount = existing.match_count + 1
    const newAvg = (existing.avg_amount * existing.match_count + Math.abs(transactionAmount)) / newCount

    return {
      ...existing,
      transaction_patterns: Array.from(patterns).slice(0, 20), // Keep max 20 patterns
      iban_patterns: Array.from(ibans).slice(0, 10),
      avg_amount: Math.round(newAvg * 100) / 100,
      match_count: newCount,
      last_matched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // Create new history entry
  const patterns: string[] = []
  if (pattern && pattern.length >= 3) patterns.push(pattern)

  const ibans: string[] = []
  if (iban) ibans.push(iban)

  return {
    id: '', // Will be set by DB
    user_id: '', // Will be set by caller
    supplier_name: supplierName,
    supplier_normalized: normalized,
    transaction_patterns: patterns,
    iban_patterns: ibans,
    avg_amount: Math.abs(transactionAmount),
    match_count: 1,
    last_matched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Charge l'historique fournisseur depuis les donnees Supabase.
 * Compatible avec le format JSON stocke en base.
 */
export function parseSupplierHistories(rows: any[]): SupplierHistory[] {
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    supplier_name: row.supplier_name,
    supplier_normalized: row.supplier_normalized,
    transaction_patterns: Array.isArray(row.transaction_patterns)
      ? row.transaction_patterns
      : JSON.parse(row.transaction_patterns || '[]'),
    iban_patterns: Array.isArray(row.iban_patterns)
      ? row.iban_patterns
      : JSON.parse(row.iban_patterns || '[]'),
    avg_amount: row.avg_amount || 0,
    match_count: row.match_count || 0,
    last_matched_at: row.last_matched_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}
