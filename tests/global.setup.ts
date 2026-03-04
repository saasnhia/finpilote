/**
 * Global setup: provision test account in Supabase then save browser auth state.
 *
 * Steps:
 *  1. Create user via Supabase admin API (email_confirm=true, skips email flow)
 *  2. Set user_profiles: subscription_status='active', onboarding_completed=true
 *  3. Upsert a subscription row so useSubscription hook returns isActive=true
 *  4. Login via browser and save storageState
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://jwaqsszcaicikhgmfcwc.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@worthifast.dev'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'TestWorthifast2026!'

const adminHeaders = {
  'apikey':        SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type':  'application/json',
}

async function createOrGetUser(): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    }),
  })
  const body = await res.json() as { id?: string; msg?: string; message?: string }

  if (res.ok && body.id) {
    console.log('[setup] Test user created:', body.id)
    return body.id
  }

  // 422 = already exists → list users to get id
  if (res.status === 422) {
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(TEST_EMAIL)}`,
      { headers: adminHeaders }
    )
    if (listRes.ok) {
      const listBody = await listRes.json() as { users?: Array<{ id: string }> }
      const userId = listBody.users?.[0]?.id ?? null
      if (userId) { console.log('[setup] Test user exists:', userId); return userId }
    }
  }

  console.error('[setup] Could not create/find user:', res.status, body)
  return null
}

async function ensureProfile(userId: string) {
  // PATCH first; if no rows affected, INSERT
  const patch = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: { ...adminHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ subscription_status: 'active', onboarding_completed: true, profile_type: 'cabinet' }),
  })
  if (!patch.ok) {
    await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Prefer': 'return=minimal,resolution=merge-duplicates' },
      body: JSON.stringify({ id: userId, subscription_status: 'active', onboarding_completed: true, profile_type: 'cabinet' }),
    })
  }
}

async function ensureSubscription(userId: string) {
  const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: { ...adminHeaders, 'Prefer': 'return=minimal,resolution=merge-duplicates' },
    body: JSON.stringify({
      user_id: userId,
      stripe_customer_id: 'cus_test_worthifast',
      stripe_subscription_id: 'sub_test_worthifast',
      plan: 'pro',
      status: 'active',
      current_period_end: periodEnd,
    }),
  })
}

setup('provision test account and authenticate', async ({ page }) => {
  // ── 1. Provision via Supabase admin API ─────────────────────────────────
  const userId = await createOrGetUser()
  if (userId) {
    await ensureProfile(userId)
    await ensureSubscription(userId)
  }

  // ── 2. Login via browser ─────────────────────────────────────────────────
  await page.goto('/login')
  await expect(page.locator('body')).toBeVisible({ timeout: 15_000 })

  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/mot de passe|password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /se connecter|connexion|login/i }).click()

  await page.waitForURL(/\/(dashboard|onboarding|pricing)/, { timeout: 25_000 })

  if (page.url().includes('/pricing')) {
    throw new Error('[setup] Redirected to /pricing — subscription provisioning failed')
  }
  if (page.url().includes('/onboarding')) {
    await page.getByRole('button', { name: /cabinet comptable/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
  }

  await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible({ timeout: 15_000 })
  await page.context().storageState({ path: AUTH_FILE })
  console.log('[setup] Auth state saved ✓')
})
