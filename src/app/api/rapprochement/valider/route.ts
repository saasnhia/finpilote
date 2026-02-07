import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/rapprochement/valider
 * Valide ou rejette un rapprochement
 *
 * Body: { rapprochement_id: string, action: 'valider' | 'rejeter' }
 *
 * POST /api/rapprochement/valider (manual match)
 * Body: { facture_id: string, transaction_id: string, action: 'creer' }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body as {
      action: 'valider' | 'rejeter' | 'creer'
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Paramètre manquant: action' },
        { status: 400 }
      )
    }

    // Manual match creation
    if (action === 'creer') {
      const { facture_id, transaction_id } = body as {
        facture_id: string
        transaction_id: string
      }

      if (!facture_id || !transaction_id) {
        return NextResponse.json(
          { error: 'Paramètres manquants: facture_id, transaction_id' },
          { status: 400 }
        )
      }

      // Get facture amount for the montant field
      const { data: facture } = await supabase
        .from('factures')
        .select('montant_ttc')
        .eq('id', facture_id)
        .eq('user_id', user.id)
        .single()

      const { error: insertError } = await supabase
        .from('rapprochements_factures')
        .insert({
          user_id: user.id,
          facture_id,
          transaction_id,
          montant: facture?.montant_ttc || 0,
          type: 'manuel',
          statut: 'valide',
          confidence_score: 100,
          validated_by_user: true,
          validated_at: new Date().toISOString(),
        })

      if (insertError) {
        // Check for unique constraint violation
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'Ce rapprochement existe déjà' },
            { status: 409 }
          )
        }
        console.error('Error creating manual match:', insertError)
        return NextResponse.json(
          { error: 'Erreur lors de la création du rapprochement' },
          { status: 500 }
        )
      }

      // Update transaction status to reconciled
      await supabase
        .from('transactions')
        .update({ status: 'reconciled' })
        .eq('id', transaction_id)
        .eq('user_id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Rapprochement manuel créé',
      })
    }

    // Validate or reject existing match
    const { rapprochement_id } = body as { rapprochement_id: string }

    if (!rapprochement_id) {
      return NextResponse.json(
        { error: 'Paramètre manquant: rapprochement_id' },
        { status: 400 }
      )
    }

    if (action === 'valider') {
      const { data: rapprochement, error: updateError } = await supabase
        .from('rapprochements_factures')
        .update({
          statut: 'valide',
          validated_by_user: true,
          validated_at: new Date().toISOString(),
        })
        .eq('id', rapprochement_id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error validating match:', updateError)
        return NextResponse.json(
          { error: 'Erreur lors de la validation' },
          { status: 500 }
        )
      }

      // Update transaction status to reconciled
      if (rapprochement) {
        await supabase
          .from('transactions')
          .update({ status: 'reconciled' })
          .eq('id', rapprochement.transaction_id)
          .eq('user_id', user.id)
      }

      return NextResponse.json({
        success: true,
        message: 'Rapprochement validé',
      })
    }

    if (action === 'rejeter') {
      const { error: updateError } = await supabase
        .from('rapprochements_factures')
        .update({
          statut: 'rejete',
          validated_by_user: true,
          validated_at: new Date().toISOString(),
        })
        .eq('id', rapprochement_id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error rejecting match:', updateError)
        return NextResponse.json(
          { error: 'Erreur lors du rejet' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Rapprochement rejeté',
      })
    }

    return NextResponse.json(
      { error: 'Action invalide: ' + action },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in validation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
