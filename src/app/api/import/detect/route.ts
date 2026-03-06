import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/utils/rate-limit'

export type ImportType =
  | 'facture_ocr'
  | 'releve_bancaire'
  | 'fec_import'
  | 'excel_batch'
  | 'unknown'

export interface DetectResult {
  type: ImportType
  confidence: number  // 0-100
  preview: {
    label: string
    description: string
    icon: string
    action: 'process_here' | 'redirect'
    redirect_to?: string
  }
}

// Bank CSV header signatures
const BANK_SIGNATURES = [
  { cols: ['date', 'libellé', 'débit', 'crédit'], name: 'BNP Paribas' },
  { cols: ['date opération', 'libellé', 'montant'], name: 'Société Générale' },
  { cols: ['date', 'date valeur', 'débit euros', 'crédit euros'], name: 'Crédit Agricole' },
  { cols: ['date', 'libelle', 'debit', 'credit'], name: 'Banque' },
  { cols: ['date', 'montant', 'libelle'], name: 'Banque' },
  { cols: ['amount', 'date', 'description'], name: 'Bank' },
]

const FEC_SIGNATURES = [
  'journalcode', 'journal_code', 'ecrituredate', 'ecriture_date', 'journalcode;',
]

const EXCEL_BATCH_SIGNATURES = [
  'fournisseur', 'montant ht', 'montant_ht', 'supplier',
]

/**
 * POST /api/import/detect
 * Lit les premières lignes d'un fichier et détermine son type.
 * Accepte FormData avec un champ "file".
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!rateLimit(`import-detect:${user.id}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    const ext = fileName.split('.').pop() ?? ''
    const fileSize = file.size

    // ── 1. Extension-based fast detection ──────────────────────

    // Images / PDFs → facture OCR
    if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(ext)) {
      return NextResponse.json({
        type: 'facture_ocr',
        confidence: 95,
        preview: {
          label: 'Facture (PDF/Image)',
          description: 'Le fichier sera analysé par OCR pour extraire les données de facturation.',
          icon: '🧾',
          action: 'redirect',
          redirect_to: '/factures',
        },
      } satisfies DetectResult)
    }

    // .fec extension → FEC import
    if (ext === 'fec') {
      return NextResponse.json({
        type: 'fec_import',
        confidence: 99,
        preview: {
          label: 'Fichier FEC',
          description: 'Fichier des Écritures Comptables — les écritures seront importées comme transactions.',
          icon: '📊',
          action: 'process_here',
        },
      } satisfies DetectResult)
    }

    // Word documents → facture OCR
    if (['doc', 'docx'].includes(ext)) {
      return NextResponse.json({
        type: 'facture_ocr',
        confidence: 80,
        preview: {
          label: 'Document Word',
          description: 'Le fichier sera analysé pour extraire les données de facturation.',
          icon: '📝',
          action: 'redirect',
          redirect_to: '/factures',
        },
      } satisfies DetectResult)
    }

    // ── 2. Content inspection for text files ───────────────────

    // Read first 4KB as text
    const slice = file.slice(0, 4096)
    const textContent = await slice.text().catch(() => '')
    const firstLine = textContent.split(/\r?\n/)[0].toLowerCase().trim()
    const headerTokens = firstLine.split(/[;\t,]/).map(t => t.trim().replace(/['"]/g, ''))

    // Excel files → check content type (need full parse → assume excel_batch for .xlsx)
    if (['xlsx', 'xls'].includes(ext)) {
      // Check header via full parse would require reading the whole file.
      // Heuristic: if filename contains "releve" / "statement" → bank, else batch
      const isBankish = /relev[eé]|statement|bank|bnp|sg|ca\b/.test(fileName)
      if (isBankish) {
        return NextResponse.json({
          type: 'releve_bancaire',
          confidence: 70,
          preview: {
            label: 'Relevé bancaire (Excel)',
            description: 'Ce fichier ressemble à un relevé bancaire. Ouvrez la page Import Relevé pour le traitement complet.',
            icon: '🏦',
            action: 'redirect',
            redirect_to: '/import-releve',
          },
        } satisfies DetectResult)
      }
      return NextResponse.json({
        type: 'excel_batch',
        confidence: 80,
        preview: {
          label: 'Liste de factures (Excel)',
          description: 'Import en masse de factures depuis un tableau Excel.',
          icon: '📋',
          action: 'process_here',
        },
      } satisfies DetectResult)
    }

    // CSV / OFX / QIF → inspect headers
    if (['csv', 'txt', 'ofx', 'qif'].includes(ext) || textContent.length > 0) {
      // FEC detection
      const isFEC = FEC_SIGNATURES.some(sig =>
        firstLine.includes(sig) || headerTokens.some(t => t.includes(sig.split(';')[0]))
      )
      if (isFEC) {
        return NextResponse.json({
          type: 'fec_import',
          confidence: 95,
          preview: {
            label: 'Fichier FEC (CSV)',
            description: `Fichier des Écritures Comptables — ${textContent.split('\n').length - 1} écritures détectées.`,
            icon: '📊',
            action: 'process_here',
          },
        } satisfies DetectResult)
      }

      // Excel batch detection
      const hasExcelCols = EXCEL_BATCH_SIGNATURES.some(sig =>
        headerTokens.some(t => t.includes(sig))
      )
      if (hasExcelCols) {
        return NextResponse.json({
          type: 'excel_batch',
          confidence: 85,
          preview: {
            label: 'Liste de factures (CSV)',
            description: 'Import en masse de factures depuis un fichier CSV.',
            icon: '📋',
            action: 'process_here',
          },
        } satisfies DetectResult)
      }

      // Bank CSV detection
      const matchedBank = BANK_SIGNATURES.find(sig =>
        sig.cols.filter(col => headerTokens.some(t => t.includes(col))).length >= 2
      )
      if (matchedBank) {
        return NextResponse.json({
          type: 'releve_bancaire',
          confidence: 90,
          preview: {
            label: `Relevé bancaire — ${matchedBank.name}`,
            description: 'Le fichier sera importé dans vos transactions bancaires.',
            icon: '🏦',
            action: 'redirect',
            redirect_to: '/import-releve',
          },
        } satisfies DetectResult)
      }

      // OFX/QIF are always bank files
      if (['ofx', 'qif'].includes(ext)) {
        return NextResponse.json({
          type: 'releve_bancaire',
          confidence: 90,
          preview: {
            label: 'Relevé bancaire (OFX/QIF)',
            description: 'Format bancaire standard détecté.',
            icon: '🏦',
            action: 'redirect',
            redirect_to: '/import-releve',
          },
        } satisfies DetectResult)
      }

      // Fallback for CSV — could be anything
      if (fileSize < 50000 && ext === 'csv') {
        return NextResponse.json({
          type: 'releve_bancaire',
          confidence: 55,
          preview: {
            label: 'Fichier CSV',
            description: 'Type incertain — pourrait être un relevé bancaire. Vérifiez les colonnes.',
            icon: '📄',
            action: 'redirect',
            redirect_to: '/import-releve',
          },
        } satisfies DetectResult)
      }
    }

    // ── 3. Unknown ──────────────────────────────────────────────
    return NextResponse.json({
      type: 'unknown',
      confidence: 0,
      preview: {
        label: 'Type non reconnu',
        description: 'Le format de ce fichier n\'est pas pris en charge. Formats acceptés : PDF, Excel, CSV, FEC, JPG/PNG.',
        icon: '❓',
        action: 'redirect',
        redirect_to: '/factures',
      },
    } satisfies DetectResult)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
