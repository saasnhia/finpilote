import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/rapprochement/anomalies
 * Liste les anomalies détectées
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(req.url)
    const statut = searchParams.get('statut') // 'ouverte' | 'resolue' | 'ignoree'
    const severite = searchParams.get('severite') // 'critical' | 'warning' | 'info'

    let query = supabase
      .from('anomalies_detectees')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (statut) {
      query = query.eq('statut', statut)
    }
    if (severite) {
      query = query.eq('severite', severite)
    }

    const { data: anomalies, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching anomalies:', fetchError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des anomalies' },
        { status: 500 }
      )
    }

    // Stats
    const all = anomalies || []
    const stats = {
      total: all.length,
      ouvertes: all.filter(a => a.statut === 'ouverte').length,
      critical: all.filter(a => a.severite === 'critical' && a.statut === 'ouverte').length,
      warning: all.filter(a => a.severite === 'warning' && a.statut === 'ouverte').length,
      info: all.filter(a => a.severite === 'info' && a.statut === 'ouverte').length,
    }

    return NextResponse.json({
      success: true,
      anomalies: all,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching anomalies:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/rapprochement/anomalies
 * Met à jour le statut d'une anomalie (résoudre / ignorer)
 */
export async function PUT(req: NextRequest) {
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
    const { anomalie_id, statut, notes } = body as {
      anomalie_id: string
      statut: 'resolue' | 'ignoree'
      notes?: string
    }

    if (!anomalie_id || !statut) {
      return NextResponse.json(
        { error: 'Paramètres manquants: anomalie_id, statut' },
        { status: 400 }
      )
    }

    if (!['resolue', 'ignoree'].includes(statut)) {
      return NextResponse.json(
        { error: 'Statut invalide. Valeurs acceptées: resolue, ignoree' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      statut,
      resolved_at: new Date().toISOString(),
    }
    if (notes) {
      updateData.notes = notes
    }

    const { error: updateError } = await supabase
      .from('anomalies_detectees')
      .update(updateData)
      .eq('id', anomalie_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating anomaly:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'anomalie' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Anomalie ${statut === 'resolue' ? 'résolue' : 'ignorée'}`,
    })
  } catch (error: any) {
    console.error('Error updating anomaly:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne: ' + error.message },
      { status: 500 }
    )
  }
}
