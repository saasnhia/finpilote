import type { Plan } from './check-plan'

/**
 * Returns the maximum number of concurrent sessions allowed for a plan.
 * null = unlimited (Pro).
 */
export function getUserLimit(plan: Plan): number | null {
  switch (plan) {
    case 'starter': return 1
    case 'cabinet': return 10
    case 'pro':     return null
  }
}

/** Human-readable limit string */
export function getUserLimitLabel(plan: Plan): string {
  const limit = getUserLimit(plan)
  return limit === null ? '∞' : String(limit)
}

/** Returns true if adding one more session would exceed the plan limit */
export function isAtLimit(plan: Plan, activeCount: number): boolean {
  const limit = getUserLimit(plan)
  if (limit === null) return false
  return activeCount >= limit
}

/** Upgrade price hint for upsell banners */
export function getUpgradePrice(plan: Plan): string | null {
  switch (plan) {
    case 'starter': return '890€/an (Cabinet, 10 utilisateurs)'
    case 'cabinet': return '1 900€/an (Pro, illimité)'
    default:        return null
  }
}
