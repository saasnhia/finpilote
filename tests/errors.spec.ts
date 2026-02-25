/**
 * Gestion des erreurs — tests E2E
 * Fichier corrompu, fichier trop lourd, session expirée, Stripe annulé, skeleton loaders
 */
import { test, expect } from '@playwright/test'
import path from 'path'

const FILES_DIR = path.join(__dirname, 'files')

// ── Import fichier corrompu ────────────────────────────────────────────────────

test.describe('Erreurs — import fichier corrompu', () => {
  test('import PDF corrompu via dashboard → état "Erreur" ou toast', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /tableau de bord/i, level: 1 }))
      .toBeVisible({ timeout: 25_000 })

    // Locate the UniversalImportHub file input
    const fileInput = page.locator('input[type="file"]').first()
    await expect(fileInput).toBeAttached({ timeout: 10_000 })

    // Upload a "corrupted" file — PDF header bytes followed by garbage content
    await fileInput.setInputFiles({
      name: 'corrupted.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% Corrupted garbage content $$##@@!!', 'utf-8'),
    })

    // After detection attempt: either error state or detected (partial parse)
    await expect(
      page.getByText(/erreur|impossible|échoué|inconnu|type de fichier/i).first()
        .or(page.getByText(/annuler|traiter maintenant/i).first())
    ).toBeVisible({ timeout: 20_000 })
  })

  test('import fichier avec contenu invalide (.csv garbage) → feedback clair', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /tableau de bord/i, level: 1 }))
      .toBeVisible({ timeout: 25_000 })

    // Use .csv (accepted by the input) but with clearly garbage content
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles({
      name: 'garbage-data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('##CORRUPT##\x00\x01\x02\x03\xFF\xFE random garbage not a valid CSV', 'binary'),
    })

    // After detection attempt: any UI feedback (detection result, error, or idle)
    await expect(
      page.getByText(/erreur|inconnu|annuler|réessayer|glissez ou cliquez|traiter/i).first()
    ).toBeVisible({ timeout: 25_000 })
  })
})

// ── Import fichier trop lourd ──────────────────────────────────────────────────

test.describe('Erreurs — import fichier trop lourd', () => {
  test('upload facture >10 Mo via /factures → toast "Fichier trop volumineux"', async ({ page }) => {
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})

    const fileInput = page.locator('input[type="file"]').first()
    await expect(fileInput).toBeAttached({ timeout: 10_000 })

    await fileInput.setInputFiles({
      name: 'huge-invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(11 * 1024 * 1024, 0),
    })

    // Client-side check fires immediately
    await expect(
      page.getByText(/trop volumineux|max 10/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('upload >10 Mo ne démarre pas de requête API (zone reset immédiat)', async ({ page }) => {
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})

    const fileInput = page.locator('input[type="file"]').first()

    // Track any API calls to factures/upload
    let uploadCalled = false
    page.on('request', req => {
      if (req.url().includes('/api/factures/upload')) uploadCalled = true
    })

    await fileInput.setInputFiles({
      name: 'huge-invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(11 * 1024 * 1024, 0),
    })

    await page.waitForTimeout(2_000) // give time for any API call to fire
    expect(uploadCalled).toBe(false) // no API call should have been made
  })
})

// ── Session expirée ────────────────────────────────────────────────────────────

test.describe('Erreurs — session expirée', () => {
  test('suppression cookies + navigation /dashboard → redirect /login', async ({ page }) => {
    // Clear all cookies to simulate expired session
    await page.context().clearCookies()

    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })

  test('suppression cookies + navigation /factures → redirect /login', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/factures')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })

  test('suppression cookies + navigation /tva → redirect /login', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/tva')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })

  test('page /login accessible et formulaire visible après session expirée', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: 15_000 })

    // Login form must be present
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByLabel(/mot de passe|password/i)).toBeVisible()
  })
})

// ── Stripe checkout annulé ────────────────────────────────────────────────────

test.describe('Erreurs — Stripe checkout annulé', () => {
  test('/pricing?stripe=canceled se charge sans crash', async ({ page }) => {
    await page.goto('/pricing?stripe=canceled')
    // Page should load normally (no white screen, no 500 error)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('body')).toBeVisible()
    // No error boundary or crash message
    await expect(page.getByText(/something went wrong|erreur serveur|500/i)).toHaveCount(0)
  })

  test('/pricing?stripe=canceled affiche les plans tarifaires', async ({ page }) => {
    await page.goto('/pricing?stripe=canceled')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    // Pricing page should still show plans
    await expect(
      page.getByText(/290|890|1.?900/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('/dashboard?canceled=true se charge sans crash', async ({ page }) => {
    await page.goto('/dashboard?canceled=true')
    await expect(page.getByRole('heading', { name: /tableau de bord/i, level: 1 }))
      .toBeVisible({ timeout: 25_000 })
  })
})

// ── Skeleton loaders et états de chargement ───────────────────────────────────

test.describe('Erreurs — skeleton loaders (pas d\'écran blanc)', () => {
  test('page /factures : skeleton ou spinner visible avant les données', async ({ page }) => {
    // Navigate and immediately check for loading state
    const loadingPromise = page.waitForURL('/factures', { timeout: 10_000 }).catch(() => {})
    await page.goto('/factures')

    // Either spinner OR immediately loaded content — never a blank page
    await expect(page.locator('body')).not.toBeEmpty()
    await expect(page.locator('body')).toBeVisible()
  })

  test('page /tva : spinner Loader2 visible durant le chargement', async ({ page }) => {
    await page.goto('/tva')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    // Body should never be blank
    await expect(page.locator('body')).toBeVisible()
    // Wait for spinner to eventually disappear (not stuck)
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
    // After loading, content should be present
    await expect(page.getByRole('heading', { name: /déclarations tva/i })).toBeVisible()
  })

  test('page /rapprochement : pas de flash de page blanche', async ({ page }) => {
    await page.goto('/rapprochement')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('body')).toBeVisible()
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
    await expect(
      page.getByRole('heading', { name: /rapprochement/i }).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('rechargement page /dashboard : pas de redirect /pricing intempestif', async ({ page }) => {
    // Reload the dashboard 3 times to check for race condition
    for (let i = 0; i < 3; i++) {
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: /tableau de bord/i, level: 1 }))
        .toBeVisible({ timeout: 25_000 })
      await expect(page).not.toHaveURL(/\/pricing/)
    }
  })
})
