import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFEC, fecToText, fecToCSV } from '@/lib/export/fec-generator'
import type { Transaction } from '@/types'

/**
 * GET /api/export/fec?year=2026&format=txt
 * Génère et télécharge le fichier FEC
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const yearStr = searchParams.get('year') || String(new Date().getFullYear())
    const format = searchParams.get('format') || 'txt'
    const year = parseInt(yearStr)

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Année invalide' }, { status: 400 })
    }

    if (!['txt', 'csv'].includes(format)) {
      return NextResponse.json({ error: 'Format invalide. Utilisez txt ou csv' }, { status: 400 })
    }

    // Fetch all transactions for the year
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (fetchError) {
      return NextResponse.json({ error: 'Erreur récupération transactions' }, { status: 500 })
    }

    // Generate FEC
    const result = generateFEC(
      (transactions || []) as Transaction[],
      year
    )

    // Return as preview JSON (for the modal)
    if (searchParams.get('preview') === 'true') {
      return NextResponse.json({
        success: true,
        filename: result.filename,
        total_entries: result.total_entries,
        total_debit: result.total_debit,
        total_credit: result.total_credit,
        warnings: result.warnings,
        transaction_count: (transactions || []).length,
      })
    }

    // Return as downloadable file
    const content = format === 'csv'
      ? fecToCSV(result.entries)
      : fecToText(result.entries)

    const ext = format === 'csv' ? '.csv' : '.txt'
    const filename = result.filename.replace('.txt', ext)
    const contentType = format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'text/plain; charset=utf-8'

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 })
  }
}
