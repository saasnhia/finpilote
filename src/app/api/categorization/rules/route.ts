import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeFournisseur, PCG_COMPTES } from '@/lib/categorization/matcher'

/**
 * GET /api/categorization/rules
 * Liste toutes les règles de catégorisation de l'utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: rules, error } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('match_count', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json({ rules: rules ?? [] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * POST /api/categorization/rules
 * Crée une nouvelle règle de catégorisation
 * Body: { fournisseur_display, compte_comptable, code_tva?, categorie? }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json() as {
      fournisseur_display: string
      compte_comptable: string
      code_tva?: string
      categorie?: string
    }

    const { fournisseur_display, compte_comptable, code_tva, categorie } = body

    if (!fournisseur_display || !compte_comptable) {
      return NextResponse.json(
        { error: 'Paramètres manquants: fournisseur_display, compte_comptable' },
        { status: 400 }
      )
    }

    const fournisseur_pattern = normalizeFournisseur(fournisseur_display)
    if (!fournisseur_pattern) {
      return NextResponse.json(
        { error: 'Nom de fournisseur invalide' },
        { status: 400 }
      )
    }

    const compte_label = PCG_COMPTES[compte_comptable] ?? null

    const { data: rule, error: insertError } = await supabase
      .from('categorization_rules')
      .insert({
        user_id: user.id,
        fournisseur_pattern,
        fournisseur_display,
        compte_comptable,
        compte_label,
        code_tva: code_tva ?? 'TVA20',
        categorie: categorie ?? null,
        is_active: true,
        match_count: 0,
        confidence: 100,
        source: 'manual',
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Une règle existe déjà pour ce fournisseur' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
