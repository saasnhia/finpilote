import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/automation/reverse/[id]
 * Annule une action automatique réversible.
 *
 * Rollback selon action_type :
 * - categorization_applied → remet compte_comptable + code_tva à null sur la facture
 * - auto_match            → supprime le rapprochement (remet statut suggestion)
 * - rule_learned          → désactive la règle (ne supprime pas, pour audit)
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch the log entry
    const { data: logEntry, error: fetchError } = await supabase
      .from('automation_log')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !logEntry) {
      return NextResponse.json({ error: 'Action introuvable' }, { status: 404 })
    }

    if (!logEntry.is_reversible) {
      return NextResponse.json({ error: 'Cette action n\'est pas réversible' }, { status: 400 })
    }

    if (logEntry.is_reversed) {
      return NextResponse.json({ error: 'Action déjà annulée' }, { status: 409 })
    }

    // Perform rollback based on action type
    const actionType = logEntry.action_type as string
    const meta = (logEntry.metadata ?? {}) as Record<string, unknown>

    switch (actionType) {
      case 'categorization_applied': {
        if (logEntry.entity_id) {
          await supabase
            .from('factures')
            .update({ compte_comptable: null, code_tva: null })
            .eq('id', logEntry.entity_id)
            .eq('user_id', user.id)
        }
        break
      }

      case 'auto_match': {
        // Remove the rapprochement for this transaction
        if (logEntry.entity_id && meta.facture_id) {
          await supabase
            .from('rapprochements_factures')
            .delete()
            .eq('user_id', user.id)
            .eq('transaction_id', logEntry.entity_id)
            .eq('facture_id', meta.facture_id as string)
            .eq('type', 'auto')

          // Reset transaction status
          await supabase
            .from('transactions')
            .update({ status: 'pending' })
            .eq('id', logEntry.entity_id)
            .eq('user_id', user.id)
        }
        break
      }

      case 'rule_learned': {
        // Deactivate the rule rather than deleting it
        if (logEntry.rule_id) {
          await supabase
            .from('categorization_rules')
            .update({ is_active: false })
            .eq('id', logEntry.rule_id)
            .eq('user_id', user.id)
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Rollback non implémenté pour action: ${actionType}` },
          { status: 422 }
        )
    }

    // Mark log as reversed
    await supabase
      .from('automation_log')
      .update({ is_reversed: true, reversed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      message: 'Action annulée avec succès',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
