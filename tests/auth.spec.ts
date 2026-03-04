/**
 * Authentication flows — runs WITHOUT saved session (fresh browser each test).
 */
import { test, expect } from '@playwright/test'
import { TEST_USER } from './fixtures/auth'

test.describe('Auth — Inscription', () => {
  test('page signup s\'affiche', async ({ page }) => {
    await page.goto('/signup')
    // Worthifast is invite-only: /signup shows "Accès sur demande" page
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('page signup affiche le message accès sur demande', async ({ page }) => {
    await page.goto('/signup')
    // The signup page shows an invite/demo request page
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Auth — Connexion', () => {
  test('page login s\'affiche', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByLabel(/mot de passe|password/i)).toBeVisible()
  })

  test('login avec mauvais mot de passe affiche une erreur', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe|password/i).fill('WrongPassword999!')
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await expect(
      page.getByText(/invalide|incorrect|wrong|erreur|error/i).or(page.locator('[role=alert]'))
    ).toBeVisible({ timeout: 10_000 })
  })

  test('login avec bons credentials redirige vers dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe|password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })
    expect(page.url()).toMatch(/\/(dashboard|onboarding)/)
  })
})

test.describe('Auth — Redirections', () => {
  test('accès /dashboard sans session → redirige vers /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('accès /factures sans session → redirige vers /login', async ({ page }) => {
    await page.goto('/factures')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('/login avec session → redirige vers /dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe|password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })

    // Now navigate to /login again — should redirect away
    await page.goto('/login')
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    expect(page.url()).toContain('/dashboard')
  })
})

test.describe('Auth — Déconnexion', () => {
  test('déconnexion ramène à /login ou page d\'accueil', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/mot de passe|password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 })
    if (page.url().includes('/onboarding')) {
      await page.getByRole('button', { name: /cabinet/i }).click()
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
    }

    // Logout — the button is in the user avatar dropdown in the header
    // The user menu button wraps the avatar + ChevronDown; click it to open dropdown
    await page.waitForSelector('header', { timeout: 10_000 })
    // Look for the user menu button by its aria structure (contains ChevronDown SVG + avatar)
    const userMenuBtn = page.locator('header').getByRole('button').filter({
      has: page.locator('svg')
    }).last()
    await expect(userMenuBtn).toBeVisible({ timeout: 10_000 })
    await userMenuBtn.click()
    // Now "Déconnexion" should be visible in the dropdown
    const logoutBtn = page.getByRole('button', { name: 'Déconnexion' })
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 })
    await logoutBtn.click()
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|)$/)
  })
})
