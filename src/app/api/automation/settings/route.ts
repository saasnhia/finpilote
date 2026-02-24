import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/automation/settings
 * Récupère les préférences d'automatisation de l'utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from('automation_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    // Return defaults if no settings row yet
    const defaults = {
      categorization_auto_apply: false,
      categorization_min_confidence: 85,
      auto_matching_enabled: true,
      auto_match_threshold: 85,
      suggest_threshold: 50,
      notify_on_auto_action: true,
    }

    return NextResponse.json({ settings: settings ?? defaults })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * PUT /api/automation/settings
 * Met à jour les préférences d'automatisation
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json() as {
      categorization_auto_apply?: boolean
      categorization_min_confidence?: number
      auto_matching_enabled?: boolean
      auto_match_threshold?: number
      suggest_threshold?: number
      notify_on_auto_action?: boolean
    }

    // Validate thresholds
    if (body.auto_match_threshold !== undefined) {
      if (body.auto_match_threshold < 50 || body.auto_match_threshold > 100) {
        return NextResponse.json({ error: 'auto_match_threshold doit être entre 50 et 100' }, { status: 400 })
      }
    }
    if (body.suggest_threshold !== undefined) {
      if (body.suggest_threshold < 0 || body.suggest_threshold > 100) {
        return NextResponse.json({ error: 'suggest_threshold doit être entre 0 et 100' }, { status: 400 })
      }
    }

    const { data: settings, error } = await supabase
      .from('automation_settings')
      .upsert(
        { user_id: user.id, ...body },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
