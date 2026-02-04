import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { smartCategorize, shouldAutoApply } from '@/lib/categorization/smart-categorizer'
import type { CategorizationResponse, CustomCategoryPattern, Transaction } from '@/types'

/**
 * POST /api/transactions/auto-categorize
 * Auto-categorize transactions using smart categorizer
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

    // Parse request body (optional: can specify transaction IDs to categorize)
    const body = await req.json().catch(() => ({}))
    const { transaction_ids } = body as { transaction_ids?: string[] }

    // Fetch custom patterns for this user
    const { data: customPatterns } = await supabase
      .from('categories_personnalisees')
      .select('*')
      .eq('user_id', user.id)
      .order('usage_count', { ascending: false })

    // Fetch transactions to categorize
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)

    // Filter by specific IDs if provided, otherwise get all uncategorized
    if (transaction_ids && transaction_ids.length > 0) {
      query = query.in('id', transaction_ids)
    } else {
      // Get transactions that need categorization
      query = query.or('category_confirmed.eq.false,confidence_score.lt.0.7')
    }

    const { data: transactions, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des transactions' },
        { status: 500 }
      )
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        success: true,
        processed_count: 0,
        auto_categorized_count: 0,
        manual_review_count: 0,
      } as CategorizationResponse)
    }

    let autoCategorizedCount = 0
    let manualReviewCount = 0

    // Categorize each transaction
    for (const transaction of transactions as Transaction[]) {
      const suggestions = await smartCategorize(
        transaction.description,
        transaction.amount,
        transaction.type,
        (customPatterns || []) as CustomCategoryPattern[]
      )

      if (suggestions.length === 0) continue

      const topSuggestion = suggestions[0]

      // Auto-apply if confidence is high enough
      if (shouldAutoApply(topSuggestion)) {
        await supabase
          .from('transactions')
          .update({
            category: topSuggestion.category,
            suggested_category: topSuggestion.category,
            confidence_score: topSuggestion.confidence,
            category_confirmed: true,
          })
          .eq('id', transaction.id)

        autoCategorizedCount++

        // Update custom pattern usage if it was the source
        if (topSuggestion.source === 'custom_pattern') {
          const pattern = (customPatterns || []).find(
            p => p.category === topSuggestion.category
          )
          if (pattern) {
            await supabase
              .from('categories_personnalisees')
              .update({
                usage_count: pattern.usage_count + 1,
                last_used_at: new Date().toISOString(),
              })
              .eq('id', pattern.id)
          }
        }
      } else {
        // Store suggestion for manual review
        await supabase
          .from('transactions')
          .update({
            suggested_category: topSuggestion.category,
            confidence_score: topSuggestion.confidence,
            category_confirmed: false,
          })
          .eq('id', transaction.id)

        manualReviewCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed_count: transactions.length,
      auto_categorized_count: autoCategorizedCount,
      manual_review_count: manualReviewCount,
    } as CategorizationResponse)
  } catch (error: any) {
    console.error('Error auto-categorizing:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
