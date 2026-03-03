import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email-sender'
import { generateWelcomeEmail } from '@/emails/WelcomeEmail'

const EXTRA_FIELDS = [
  'raison_sociale',
  'forme_juridique',
  'siret',
  'tva_numero',
  'regime_tva',
  'adresse_siege',
  'code_ape',
  'nb_dossiers_cabinet',
  'prenom',
  'nom',
] as const

type ExtraField = typeof EXTRA_FIELDS[number]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body: unknown = await request.json()
  if (
    typeof body !== 'object' ||
    body === null ||
    !('profile_type' in body) ||
    (body.profile_type !== 'cabinet' && body.profile_type !== 'entreprise')
  ) {
    return NextResponse.json(
      { error: 'profile_type doit être "cabinet" ou "entreprise"' },
      { status: 400 }
    )
  }

  const b = body as Record<string, unknown>

  const updates: Record<string, unknown> = {
    profile_type: b.profile_type,
    onboarding_completed: true,
    onboarding_step: 4,
  }

  for (const field of EXTRA_FIELDS) {
    if (field in b && b[field] !== undefined && b[field] !== '') {
      updates[field as ExtraField] = b[field]
    }
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Envoyer l'email de bienvenue (fire-and-forget)
  if (user.email) {
    const { subject, html, text } = generateWelcomeEmail({
      prenom: typeof b.prenom === 'string' ? b.prenom : undefined,
      email: user.email,
    })
    void sendEmail({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@finpilote.app',
      to: [user.email],
      subject,
      html,
      text,
    })
  }

  return NextResponse.json({ success: true, profile_type: b.profile_type })
}
