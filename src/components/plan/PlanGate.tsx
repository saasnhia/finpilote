'use client'

import { useUserPlan } from '@/hooks/useUserPlan'
import { getPlanLabel, getRequiredPlan, getFeatureLabel } from '@/lib/auth/check-plan'
import type { Feature } from '@/lib/auth/check-plan'
import { Lock } from 'lucide-react'
import Link from 'next/link'

interface PlanGateProps {
  feature: Feature
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children based on user's plan.
 * Shows an upgrade prompt if feature is locked.
 */
export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const { can, loading } = useUserPlan()

  if (loading) return null

  if (can(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const required = getRequiredPlan(feature)

  return (
    <div className="relative rounded-2xl border border-slate-700 bg-slate-800/50 p-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">
            {getFeatureLabel(feature)}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Disponible à partir du plan <span className="text-emerald-400 font-medium">{getPlanLabel(required)}</span>
          </p>
        </div>
        <Link
          href="/pricing"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          Mettre à niveau
        </Link>
      </div>
    </div>
  )
}

/**
 * Small badge showing current plan.
 */
export function PlanBadge() {
  const { plan, loading } = useUserPlan()

  if (loading) return null

  const colors: Record<string, string> = {
    starter: 'bg-slate-700 text-slate-300',
    cabinet: 'bg-emerald-900/60 text-emerald-400',
    pro:     'bg-violet-900/60 text-violet-400',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[plan] ?? colors.starter}`}>
      {getPlanLabel(plan)}
    </span>
  )
}
