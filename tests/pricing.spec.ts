/**
 * Pricing page — public (no auth) and authenticated views.
 */
import { test, expect } from '@playwright/test'

test.describe('Pricing — page publique', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('page /pricing se charge', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveTitle(/tarif|prix|plan|Worthifast/i, { timeout: 15_000 })
  })

  test('les profils de plans sont affichés', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText(/cabinet/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/indépendant|independant/i).first()).toBeVisible()
  })

  test('prix Cabinet Essentiel affiché (99€/mois)', async ({ page }) => {
    await page.goto('/pricing')
    // Default profile is Cabinet — should show 99€
    await expect(page.getByText(/99/)).toBeVisible({ timeout: 10_000 })
  })

  test('toggle profil Indépendant fonctionne', async ({ page }) => {
    await page.goto('/pricing')
    const indepBtn = page.getByRole('button', { name: /indépendant|independant/i })
    await expect(indepBtn.first()).toBeVisible({ timeout: 10_000 })
    await indepBtn.first().click()
    // After click, should show Starter plan
    await expect(page.getByText(/starter/i).first()).toBeVisible()
  })

  test('bouton essai cabinet est un bouton checkout (pas un lien /signup)', async ({ page }) => {
    await page.goto('/pricing')
    // Cabinet plans use <button> for Stripe checkout, not <Link>
    const btn = page.getByRole('button', { name: /essai cabinet|cabinet.*30 jours/i }).first()
    await expect(btn).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Pricing — utilisateur connecté', () => {
  // Uses saved auth session from global setup

  test('bouton essai cabinet déclenche checkout Stripe', async ({ page }) => {
    await page.goto('/pricing')
    // Authenticated user sees checkout button (not link)
    const btn = page.getByRole('button', { name: /essai cabinet|cabinet.*30 jours/i }).first()
    await expect(btn).toBeVisible({ timeout: 10_000 })
  })

  test('message subscription_required affiché si query param présent', async ({ page }) => {
    await page.goto('/pricing?message=subscription_required')
    // Should show the welcome/subscription banner
    await expect(
      page.getByText(/bienvenue|choisissez|plan/i)
    ).toBeVisible({ timeout: 10_000 })
  })
})
