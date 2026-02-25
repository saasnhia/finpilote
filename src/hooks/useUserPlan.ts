'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { Plan, Feature } from '@/lib/auth/check-plan'
import { hasFeature, getPlanLimits, getUpgradePlan, getFeatureLabel, getPlanLabel, getRequiredPlan } from '@/lib/auth/check-plan'
import toast from 'react-hot-toast'

interface UserPlan {
  plan: Plan
  facturesCount: number
  facturesLimit: number
  maxUsers: number
}

export function useUserPlan() {
  const { user } = useAuth()
  const [userPlan, setUserPlan] = useState<UserPlan>({
    plan: 'starter',
    facturesCount: 0,
    facturesLimit: 300,
    maxUsers: 1,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchPlan = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('user_profiles')
        .select('plan, factures_count, factures_limit, max_users')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserPlan({
          plan: data.plan as Plan,
          facturesCount: data.factures_count,
          facturesLimit: data.factures_limit,
          maxUsers: data.max_users,
        })
      }
      setLoading(false)
    }

    fetchPlan()
  }, [user])

  const can = useCallback((feature: Feature): boolean => {
    return hasFeature(userPlan.plan, feature)
  }, [userPlan.plan])

  const requireFeature = useCallback((feature: Feature): boolean => {
    if (hasFeature(userPlan.plan, feature)) return true
    const required = getRequiredPlan(feature)
    toast.error(
      `${getFeatureLabel(feature)} requiert le plan ${getPlanLabel(required)}. Upgrade pour d\u00e9bloquer.`,
      { duration: 4000 }
    )
    return false
  }, [userPlan.plan])

  const canUpload = useCallback((): boolean => {
    const limits = getPlanLimits(userPlan.plan)
    if (limits.factures === Infinity) return true
    if (userPlan.facturesCount >= userPlan.facturesLimit) {
      const upgrade = getUpgradePlan(userPlan.plan)
      toast.error(
        `Limite de ${userPlan.facturesLimit} factures atteinte.${upgrade ? ` Passez au plan ${getPlanLabel(upgrade)}.` : ''}`,
        { duration: 4000 }
      )
      return false
    }
    return true
  }, [userPlan])

  return {
    ...userPlan,
    loading,
    can,
    requireFeature,
    canUpload,
    upgradePlan: getUpgradePlan(userPlan.plan),
  }
}
