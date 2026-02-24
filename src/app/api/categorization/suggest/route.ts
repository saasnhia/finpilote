import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestCategorization } from '@/lib/categorization/matcher'
import type { CategorizationRule } from '@/lib/categorization/matcher'

/**
 * POST /api/categorization/suggest
 * Retourne la meilleure suggestion de catégorisation pour un fournisseur
 * Body: { fournisseur: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json() as { fournisseur?: string }
    const { fournisseur } = body

    if (!fournisseur) {
      return NextResponse.json(
        { error: 'Paramètre manquant: fournisseur' },
        { status: 400 }
      )
    }

    // Load active rules for this user
    const { data: rulesData, error: rulesError } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (rulesError) {
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    const rules = (rulesData ?? []) as CategorizationRule[]
    const suggestion = suggestCategorization(fournisseur, rules)

    return NextResponse.json({ suggestion })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
