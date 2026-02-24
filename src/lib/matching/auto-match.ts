/**
 * Rapprochement automatique natif — déclenché après import bancaire.
 *
 * Appelé directement par confirm-import sans passer par l'API HTTP.
 * Utilise le client Supabase authentifié de la requête (RLS respecté).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { matchInvoicesWithTransactions } from './invoice-matcher'
import { detectAnomalies } from './anomaly-detector'
import { parseSupplierHistories, updateSupplierHistory } from './learning-engine'
import { DEFAULT_MATCHING_CONFIG } from './matching-types'
import type { Transaction, Facture } from '@/types'
import type { SupplierHistory } from './matching-types'

export interface AutoMatchResult {
  auto_matched: number
  suggestions: number
  anomalies: number
}

/**
 * Lance le rapprochement factures <-> transactions pour un utilisateur.
 * Sauvegarde les résultats en base. Silencieux en cas d'erreur.
 */
export async function runAutoMatchForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<AutoMatchResult> {
  // 1. Charger transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  // 2. Charger factures non rapprochées
  const { data: factures } = await supabase
    .from('factures')
    .select('*')
    .eq('user_id', userId)
    .in('statut', ['en_attente', 'validee'])
    .order('date_facture', { ascending: false })

  if (!transactions?.length || !factures?.length) {
    return { auto_matched: 0, suggestions: 0, anomalies: 0 }
  }

  // 3. Charger historique fournisseurs
  let supplierHistories: SupplierHistory[] = []
  const { data: historyRows } = await supabase
    .from('supplier_histories')
    .select('*')
    .eq('user_id', userId)
  if (historyRows?.length) supplierHistories = parseSupplierHistories(historyRows)

  // 4. Lancer le matching
  const matchResult = matchInvoicesWithTransactions(
    factures as Facture[],
    transactions as Transaction[],
    DEFAULT_MATCHING_CONFIG,
    supplierHistories
  )

  // 5. Sauvegarder résultats
  const autoInserts = matchResult.auto_matched.map(m => ({
    user_id: userId,
    facture_id: m.facture.id,
    transaction_id: m.transaction.id,
    montant: m.facture.montant_ttc || m.transaction.amount,
    type: 'auto' as const,
    statut: 'valide' as const,
    confidence_score: m.confidence,
    date_score: m.score.date,
    amount_score: m.score.amount,
    description_score: m.score.description,
    validated_by_user: false,
  }))

  const suggestionInserts = matchResult.suggestions.map(m => ({
    user_id: userId,
    facture_id: m.facture.id,
    transaction_id: m.transaction.id,
    montant: m.facture.montant_ttc || m.transaction.amount,
    type: 'suggestion' as const,
    statut: 'suggestion' as const,
    confidence_score: m.confidence,
    date_score: m.score.date,
    amount_score: m.score.amount,
    description_score: m.score.description,
    validated_by_user: false,
  }))

  const allInserts = [...autoInserts, ...suggestionInserts]

  if (allInserts.length > 0) {
    await supabase
      .from('rapprochements_factures')
      .delete()
      .eq('user_id', userId)
      .eq('validated_by_user', false)

    await supabase.from('rapprochements_factures').insert(allInserts)
  }

  // 6. Mettre à jour l'historique fournisseurs
  for (const m of matchResult.auto_matched) {
    if (m.facture.fournisseur) {
      const updated = updateSupplierHistory(
        supplierHistories,
        m.facture.fournisseur,
        m.transaction.description,
        m.transaction.amount
      )
      if (updated.id) {
        await supabase
          .from('supplier_histories')
          .update({
            transaction_patterns: updated.transaction_patterns,
            iban_patterns: updated.iban_patterns,
            avg_amount: updated.avg_amount,
            match_count: updated.match_count,
            last_matched_at: updated.last_matched_at,
            updated_at: updated.updated_at,
          })
          .eq('id', updated.id)
      } else {
        await supabase.from('supplier_histories').insert({
          user_id: userId,
          supplier_name: updated.supplier_name,
          supplier_normalized: updated.supplier_normalized,
          transaction_patterns: updated.transaction_patterns,
          iban_patterns: updated.iban_patterns,
          avg_amount: updated.avg_amount,
          match_count: updated.match_count,
          last_matched_at: updated.last_matched_at,
        })
      }
    }
  }

  // 7. Détecter anomalies
  const matchedPairs = [
    ...matchResult.auto_matched.map(m => ({ facture_id: m.facture.id, transaction_id: m.transaction.id })),
    ...matchResult.suggestions.map(m => ({ facture_id: m.facture.id, transaction_id: m.transaction.id })),
  ]
  const anomalyResult = detectAnomalies(
    transactions as Transaction[],
    factures as Facture[],
    matchedPairs,
    DEFAULT_MATCHING_CONFIG
  )

  if (anomalyResult.anomalies.length > 0) {
    await supabase
      .from('anomalies_detectees')
      .delete()
      .eq('user_id', userId)
      .eq('statut', 'ouverte')

    await supabase.from('anomalies_detectees').insert(
      anomalyResult.anomalies.map(a => ({
        user_id: userId,
        type: a.type,
        severite: a.severite,
        description: a.description,
        transaction_id: a.transaction_id || null,
        facture_id: a.facture_id || null,
        montant: a.montant || null,
        montant_attendu: a.montant_attendu || null,
        ecart: a.ecart || null,
        statut: 'ouverte' as const,
      }))
    )
  }

  return {
    auto_matched: matchResult.auto_matched.length,
    suggestions: matchResult.suggestions.length,
    anomalies: anomalyResult.anomalies.length,
  }
}
