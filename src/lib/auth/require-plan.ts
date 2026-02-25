import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Plan, Feature } from './check-plan'
import { hasFeature, getFeatureLabel, getRequiredPlan, getPlanLabel } from './check-plan'

interface AuthResult {
  userId: string
  plan: Plan
}

/**
 * Authenticates user and checks plan access for a feature.
 * Returns userId + plan on success, or a NextResponse error.
 */
export async function requirePlanFeature(
  feature: Feature
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Non authentifi\u00e9' },
      { status: 401 }
    )
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan as Plan) || 'starter'

  if (!hasFeature(plan, feature)) {
    const required = getRequiredPlan(feature)
    return NextResponse.json(
      {
        success: false,
        error: `${getFeatureLabel(feature)} n\u00e9cessite le plan ${getPlanLabel(required)}`,
        upgrade_required: required,
      },
      { status: 403 }
    )
  }

  return { userId: user.id, plan }
}

/**
 * Type guard: checks if result is an auth success (not a NextResponse error).
 */
export function isAuthed(result: AuthResult | NextResponse): result is AuthResult {
  return 'userId' in result
}
