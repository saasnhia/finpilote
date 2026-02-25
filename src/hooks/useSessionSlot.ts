'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

const PING_INTERVAL_MS = 10 * 60 * 1000  // 10 minutes
const SESSION_KEY = 'finsoft_session_token'

interface SlotState {
  allowed: boolean
  active: number
  limit: number | null
  limitLabel: string
  plan: string
  checked: boolean
}

function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return ''
  let token = localStorage.getItem(SESSION_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, token)
  }
  return token
}

/** Registers and keeps alive a device session. Enforces plan user limits. */
export function useSessionSlot() {
  const { user } = useAuth()
  const [state, setState] = useState<SlotState>({
    allowed: true,
    active: 0,
    limit: null,
    limitLabel: '∞',
    plan: 'starter',
    checked: false,
  })
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionToken = useRef<string>('')

  const registerSlot = useCallback(async () => {
    if (!user) return
    const token = sessionToken.current
    if (!token) return

    try {
      const res = await fetch('/api/auth/verify-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token }),
      })
      const data = await res.json()

      setState({
        allowed: data.allowed ?? res.ok,
        active: data.active ?? 0,
        limit: data.limit === Infinity ? null : (data.limit ?? null),
        limitLabel: data.limitLabel ?? '∞',
        plan: data.plan ?? 'starter',
        checked: true,
      })

      if (!res.ok && res.status === 429) {
        toast.error(
          `Plan plein : ${data.active}/${data.limit} sessions actives. Upgrade pour débloquer.`,
          { duration: 6000, id: 'slot-full' }
        )
      }
    } catch {
      // Silent — don't block the app if the API is unreachable
      setState(prev => ({ ...prev, checked: true }))
    }
  }, [user])

  const releaseSlot = useCallback(async () => {
    const token = sessionToken.current
    if (!token || !user) return
    try {
      await fetch('/api/auth/verify-slot', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token }),
      })
    } catch { /* silent */ }
  }, [user])

  useEffect(() => {
    if (!user) return
    sessionToken.current = getOrCreateSessionToken()
    registerSlot()

    // Keep session alive
    pingRef.current = setInterval(registerSlot, PING_INTERVAL_MS)

    // Release on tab close / navigation away
    window.addEventListener('beforeunload', releaseSlot)

    return () => {
      if (pingRef.current) clearInterval(pingRef.current)
      window.removeEventListener('beforeunload', releaseSlot)
    }
  }, [user, registerSlot, releaseSlot])

  return state
}
