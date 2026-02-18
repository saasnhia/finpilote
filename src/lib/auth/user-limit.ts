import type { Plan } from './check-plan'

/**
 * Returns the maximum number of concurrent sessions allowed for a plan.
 * null = unlimited (Entreprise).
 */
export function getUserLimit(plan: Plan): number | null {
  switch (plan) {
    case 'solo':       return 1
    case 'cabinet':    return 5
    case 'entreprise': return null
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
    case 'solo':    return '799€ (Cabinet, 5 users)'
    case 'cabinet': return '1 499€ (Entreprise, illimité)'
    default:        return null
  }
}
