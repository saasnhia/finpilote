import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTVAPeriod, validatePeriode } from '@/lib/tva/tva-calculator'
import { generateCA3Form, generateLignesCA3 } from '@/lib/tva/ca3-generator'
import type { TVAGenerateCA3Response, Transaction } from '@/types'

/**
 * POST /api/tva/generate-ca3
 * Génère une déclaration CA3 complète avec lignes
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

    // Parse request body
    const body = await req.json()
    const { periode_debut, periode_fin, regime, notes } = body as {
      periode_debut: string
      periode_fin: string
      regime?: 'reel_normal' | 'reel_simplifie' | 'franchise'
      notes?: string
    }

    if (!periode_debut || !periode_fin) {
      return NextResponse.json(
        { error: 'Paramètres manquants: periode_debut, periode_fin' },
        { status: 400 }
      )
    }

    // Validate period
    const validation = validatePeriode(periode_debut, periode_fin)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if declaration already exists for this period
    const { data: existing } = await supabase
      .from('declarations_tva')
      .select('id')
      .eq('user_id', user.id)
      .eq('periode_debut', periode_debut)
      .eq('periode_fin', periode_fin)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Une déclaration existe déjà pour cette période' },
        { status: 409 }
      )
    }

    // Fetch transactions for the period
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', periode_debut)
      .lte('date', periode_fin)
      .order('date', { ascending: true })

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des transactions' },
        { status: 500 }
      )
    }

    // Calculate TVA
    const result = calculateTVAPeriod(
      (transactions || []) as Transaction[],
      periode_debut,
      periode_fin
    )

    // Generate CA3 form
    const ca3Form = generateCA3Form(result)

    // Insert declaration
    const { data: declaration, error: insertError } = await supabase
      .from('declarations_tva')
      .insert({
        user_id: user.id,
        periode_debut,
        periode_fin,
        regime: regime || 'reel_normal',
        montant_ht: result.ventes.total_ht,
        tva_collectee: result.ventes.tva_collectee,
        tva_deductible: result.achats.tva_deductible,
        tva_nette: result.tva_nette,
        ventes_tva_20: result.ventes.par_taux.taux_20.tva,
        ventes_tva_10: result.ventes.par_taux.taux_10.tva,
        ventes_tva_55: result.ventes.par_taux.taux_55.tva,
        ventes_tva_21: result.ventes.par_taux.taux_21.tva,
        achats_tva_20: result.achats.par_taux.taux_20.tva,
        achats_tva_10: result.achats.par_taux.taux_10.tva,
        achats_tva_55: result.achats.par_taux.taux_55.tva,
        achats_tva_21: result.achats.par_taux.taux_21.tva,
        statut: 'brouillon',
        notes: notes || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting declaration:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la déclaration' },
        { status: 500 }
      )
    }

    // Generate and insert CA3 lines
    const lignesData = generateLignesCA3(result, ca3Form)
    const lignesWithDeclarationId = lignesData.map(ligne => ({
      ...ligne,
      declaration_id: declaration.id,
    }))

    const { data: lignes, error: lignesError } = await supabase
      .from('lignes_ca3')
      .insert(lignesWithDeclarationId)
      .select()

    if (lignesError) {
      console.error('Error inserting CA3 lines:', lignesError)
      // Rollback: delete the declaration
      await supabase.from('declarations_tva').delete().eq('id', declaration.id)
      return NextResponse.json(
        { error: 'Erreur lors de la création des lignes CA3' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      declaration,
      lignes,
    } as TVAGenerateCA3Response)
  } catch (error: any) {
    console.error('Error generating CA3:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
