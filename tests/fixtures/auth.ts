/**
 * Shared auth credentials for tests.
 * Account must exist in Supabase with an active subscription (plan pro).
 */
export const TEST_USER = {
  email:    process.env.TEST_EMAIL    ?? 'test@worthifast.dev',
  password: process.env.TEST_PASSWORD ?? 'TestWorthifast2026!',
}

/** Path to saved Playwright auth state */
export const AUTH_FILE = 'tests/.auth/user.json'
