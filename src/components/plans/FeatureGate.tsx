'use client'

import { useUserPlan } from '@/hooks/useUserPlan'
import { getPlanLabel, getRequiredPlan, getFeatureLabel } from '@/lib/auth/check-plan'
import type { Feature, Plan } from '@/lib/auth/check-plan'
import { Lock } from 'lucide-react'
import Link from 'next/link'

interface FeatureGateProps {
  feature: Feature
  /** Hint displayed in the lock message. Inferred from feature if omitted. */
  requiredPlan?: Plan
  children: React.ReactNode
  /** Custom content to show when locked instead of the default overlay */
  fallback?: React.ReactNode
  /** If true, renders nothing (no lock UI) when the feature is unavailable */
  silent?: boolean
}

/**
 * Wraps content behind a plan check.
 * - If the user has access → renders children normally.
 * - If not → shows a lock overlay with an upgrade CTA.
 *
 * Usage:
 *   <FeatureGate feature="categorization_rules" requiredPlan="cabinet">
 *     <RulesTable />
 *   </FeatureGate>
 */
export function FeatureGate({
  feature,
  requiredPlan,
  children,
  fallback,
  silent = false,
}: FeatureGateProps) {
  const { can, loading } = useUserPlan()

  if (loading) return null
  if (can(feature)) return <>{children}</>
  if (silent) return null
  if (fallback) return <>{fallback}</>

  const required = requiredPlan ?? getRequiredPlan(feature)

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50 p-12 text-center gap-5">
      <div className="w-14 h-14 rounded-full bg-slate-700/80 flex items-center justify-center ring-4 ring-slate-600/40">
        <Lock className="w-7 h-7 text-slate-300" />
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold text-white">
          {getFeatureLabel(feature)}
        </p>
        <p className="text-sm text-slate-400">
          Disponible à partir du plan{' '}
          <span className="text-emerald-400 font-semibold">{getPlanLabel(required)}</span>
        </p>
      </div>

      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
      >
        Passer au plan {getPlanLabel(required)}
      </Link>
    </div>
  )
}
