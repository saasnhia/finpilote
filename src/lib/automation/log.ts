// ============================================================
// Automation Log Helper
// Logs every automatic action to the automation_log table
// ============================================================
import { createClient } from '@/lib/supabase/server'

export type AutomationActionType =
  | 'auto_match'
  | 'match_suggested'
  | 'rule_applied'
  | 'rule_learned'
  | 'import_processed'
  | 'categorization_applied'
  | 'categorization_suggested'

export type AutomationEntityType =
  | 'facture'
  | 'transaction'
  | 'rapprochement'
  | 'rule'

export interface LogAutomationParams {
  userId: string
  actionType: AutomationActionType
  entityType: AutomationEntityType
  entityId?: string
  ruleId?: string
  metadata?: Record<string, unknown>
  isReversible?: boolean
}

/**
 * Insère un enregistrement dans automation_log.
 * Fire-and-forget : les erreurs sont loguées mais ne bloquent pas l'opération principale.
 */
export async function logAutomation(params: LogAutomationParams): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('automation_log').insert({
      user_id: params.userId,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      rule_id: params.ruleId ?? null,
      metadata: params.metadata ?? {},
      is_reversible: params.isReversible ?? true,
      is_reversed: false,
    })
    if (error) {
      console.error('[automation_log] Insert error:', error.message)
    }
  } catch (err) {
    console.error('[automation_log] Unexpected error:', err)
  }
}

/**
 * Marque un log comme annulé (is_reversed = true).
 */
export async function reverseAutomationLog(logId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('automation_log')
      .update({ is_reversed: true, reversed_at: new Date().toISOString() })
      .eq('id', logId)
      .eq('user_id', userId)
      .eq('is_reversible', true)
      .eq('is_reversed', false)

    if (error) {
      console.error('[automation_log] Reverse error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[automation_log] Unexpected error during reverse:', err)
    return false
  }
}
