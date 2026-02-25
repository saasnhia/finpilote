import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseFEC, fecEntryToTransactionType, fecDateToISO, mapJournalToCategory } from '@/lib/parsers/fec-parser'
import { parseExcelBatch } from '@/lib/parsers/excel-batch-parser'
import { logAutomation } from '@/lib/automation/log'
import type { ImportType } from '../detect/route'

/**
 * POST /api/import/process
 * Traite un fichier fec_import ou excel_batch.
 * Accepte FormData avec : file (File) + detected_type (string)
 *
 * - fec_import  → parseFEC → transactions (comptes 6xx/7xx uniquement)
 * - excel_batch → parseExcelBatch → factures
 *
 * Écrit dans import_history et appelle logAutomation('import_processed').
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const detectedType = (formData.get('detected_type') as string | null) ?? 'unknown'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const importType = detectedType as ImportType
    if (importType !== 'fec_import' && importType !== 'excel_batch') {
      return NextResponse.json(
        { error: `Type non traitable ici: ${importType}. Utilisez les routes dédiées pour facture_ocr et releve_bancaire.` },
        { status: 400 }
      )
    }

    // ── Create import_history record ────────────────────────────────
    const { data: historyRow, error: historyCreateError } = await supabase
      .from('import_history')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        detected_type: importType,
        status: 'processing',
      })
      .select('id')
      .single()

    if (historyCreateError || !historyRow) {
      return NextResponse.json({ error: 'Impossible de créer l\'entrée d\'historique' }, { status: 500 })
    }

    const importId = historyRow.id
    let processed_count = 0
    let error_count = 0
    const errors: string[] = []
    let result_summary: Record<string, unknown> = {}

    // ── FEC import ──────────────────────────────────────────────────
    if (importType === 'fec_import') {
      const content = await file.text()
      const parsed = parseFEC(content)

      if (parsed.errors.length > 0) {
        errors.push(...parsed.errors)
      }

      // Filter to charge/produit accounts only
      const importableEntries = parsed.entries.filter(e =>
        fecEntryToTransactionType(e.CompteNum) !== null
      )

      if (importableEntries.length === 0 && errors.length > 0) {
        await supabase.from('import_history').update({
          status: 'error',
          error_count: errors.length,
          errors,
          completed_at: new Date().toISOString(),
        }).eq('id', importId)
        return NextResponse.json({ error: errors[0], details: errors }, { status: 422 })
      }

      // Batch insert transactions
      const txRows = importableEntries.map(entry => {
        const txType = fecEntryToTransactionType(entry.CompteNum)!
        const amount = txType === 'expense' ? entry.Debit || entry.Credit : entry.Credit || entry.Debit
        return {
          user_id: user.id,
          date: fecDateToISO(entry.EcritureDate),
          description: entry.EcritureLib || `${entry.JournalCode} — ${entry.CompteNum}`,
          amount: Math.abs(amount),
          type: txType,
          category: mapJournalToCategory(entry.JournalCode),
          is_fixed: false,
          source: 'bank_import' as const,
          status: 'pending' as const,
          original_description: `FEC:${entry.JournalCode}/${entry.EcritureNum}`,
          import_batch_id: importId,
        }
      })

      // Insert in batches of 100
      const BATCH_SIZE = 100
      for (let i = 0; i < txRows.length; i += BATCH_SIZE) {
        const batch = txRows.slice(i, i + BATCH_SIZE)
        const { data: inserted, error: insertError } = await supabase
          .from('transactions')
          .insert(batch)
          .select('id')

        if (insertError) {
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`)
          error_count += batch.length
        } else {
          processed_count += inserted?.length ?? batch.length
        }
      }

      result_summary = {
        total_entries: parsed.total_entries,
        importable_entries: importableEntries.length,
        date_range: parsed.date_range,
        debit_total: parsed.debit_total,
        credit_total: parsed.credit_total,
        separator: parsed.detected_separator,
      }
    }

    // ── Excel batch ─────────────────────────────────────────────────
    if (importType === 'excel_batch') {
      const buffer = Buffer.from(await file.arrayBuffer())
      const parsed = parseExcelBatch(buffer)

      if (parsed.errors.length > 0) {
        errors.push(...parsed.errors)
      }

      if (parsed.rows.length === 0) {
        await supabase.from('import_history').update({
          status: 'error',
          error_count: errors.length,
          errors,
          completed_at: new Date().toISOString(),
        }).eq('id', importId)
        return NextResponse.json(
          { error: 'Aucune ligne valide dans le fichier', details: errors },
          { status: 422 }
        )
      }

      // Insert factures
      const factureRows = parsed.rows.map(row => ({
        user_id: user.id,
        fichier_url: null,
        fournisseur: row.fournisseur,
        montant_ht: row.montant_ht,
        montant_ttc: row.montant_ttc,
        montant_tva: row.montant_tva,
        date_facture: row.date_facture,
        numero_facture: row.numero_facture,
        compte_comptable: row.compte_comptable,
        code_tva: row.code_tva,
        statut: 'validée',
        ocr_raw_text: null,
        ocr_confidence: null,
      }))

      const BATCH_SIZE = 100
      for (let i = 0; i < factureRows.length; i += BATCH_SIZE) {
        const batch = factureRows.slice(i, i + BATCH_SIZE)
        const { data: inserted, error: insertError } = await supabase
          .from('factures')
          .insert(batch)
          .select('id')

        if (insertError) {
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`)
          error_count += batch.length
        } else {
          processed_count += inserted?.length ?? batch.length
        }
      }

      result_summary = {
        valid_rows: parsed.valid_count,
        skipped_rows: parsed.skipped_count,
        headers_detected: parsed.headers_detected,
      }
    }

    // ── Update import_history ───────────────────────────────────────
    const finalStatus = processed_count > 0 ? 'completed' : 'error'
    await supabase.from('import_history').update({
      status: finalStatus,
      processed_count,
      error_count,
      errors,
      result_summary,
      completed_at: new Date().toISOString(),
    }).eq('id', importId)

    // ── Log automation action ───────────────────────────────────────
    await logAutomation({
      userId: user.id,
      actionType: 'import_processed',
      entityType: 'facture',
      entityId: importId,
      metadata: {
        import_type: importType,
        file_name: file.name,
        processed_count,
        error_count,
        ...result_summary,
      },
      isReversible: false,
    })

    return NextResponse.json({
      success: true,
      import_id: importId,
      processed_count,
      error_count,
      errors: errors.slice(0, 10), // cap at 10 for response size
      result_summary,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
