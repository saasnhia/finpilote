'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface SlotInfo {
  active: number
  limit: number | null
  limitLabel: string
  plan: string
}

/** Shows "Plan : X/Y actifs" in the Sidebar footer. Polls GET /api/auth/verify-slot. */
export function UserCountBadge() {
  const { user } = useAuth()
  const [info, setInfo] = useState<SlotInfo | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchSlot = async () => {
      try {
        const res = await fetch('/api/auth/verify-slot')
        if (res.ok) {
          const data = await res.json()
          setInfo({
            active: data.active ?? 0,
            limit: data.limit === Infinity ? null : (data.limit ?? null),
            limitLabel: data.limitLabel ?? '∞',
            plan: data.plan ?? 'solo',
          })
        }
      } catch { /* silent */ }
    }
    fetchSlot()
    const interval = setInterval(fetchSlot, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  if (!info) return null

  const atLimit = info.limit !== null && info.active >= info.limit
  const label = `${info.active}/${info.limitLabel} actif${info.active > 1 ? 's' : ''}`

  return (
    <Link
      href="/admin/users"
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors
        ${atLimit
          ? 'bg-coral-500/10 text-coral-400 hover:bg-coral-500/20'
          : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
        }
      `}
      title="Gérer les sessions utilisateurs"
    >
      <Users className="w-3 h-3 flex-shrink-0" />
      <span className="capitalize">{info.plan}</span>
      <span className="text-neutral-600">·</span>
      <span className={atLimit ? 'font-semibold text-coral-400' : ''}>{label}</span>
    </Link>
  )
}
