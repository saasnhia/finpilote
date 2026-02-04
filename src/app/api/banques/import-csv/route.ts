import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseBankCSV, validateCSVFile } from '@/lib/parsers/bank-csv-parser'
import type { BankImportResponse } from '@/types'

/**
 * POST /api/banques/import-csv
 * Parse and preview CSV file before importing
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateCSVFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Read file content
    const csvContent = await file.text()

    // Parse CSV
    const preview = await parseBankCSV(csvContent, file.name)

    // Check if format was detected
    if (preview.detected_format === 'unknown') {
      return NextResponse.json({
        success: false,
        error: 'Format de banque non reconnu',
        preview,
      } as BankImportResponse)
    }

    // Return preview
    return NextResponse.json({
      success: true,
      preview,
    } as BankImportResponse)
  } catch (error: any) {
    console.error('Error parsing CSV:', error)
    return NextResponse.json(
      { error: 'Erreur lors du parsing du CSV: ' + error.message },
      { status: 500 }
    )
  }
}
