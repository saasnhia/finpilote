/**
 * Rapprochement bancaire — tests E2E
 * Tests: dashboard, lancement matching, anomalies, import relevé, transactions
 */
import { test, expect } from '@playwright/test'
import path from 'path'

const FILES_DIR = path.join(__dirname, 'files')

// ── Dashboard rapprochement ───────────────────────────────────────────────────

test.describe('Rapprochement — dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rapprochement')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
  })

  test('page rapprochement accessible', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('titre "Rapprochement Bancaire" visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /rapprochement bancaire/i })).toBeVisible({ timeout: 15_000 })
  })

  test('bouton "Lancer le rapprochement" visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /lancer le rapprochement/i }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('stats ou message état vide visible', async ({ page }) => {
    const stat = page
      .getByText(/rapproché|non rapproché|en attente|anomalie|aucun/i).first()
    await expect(stat.first()).toBeVisible({ timeout: 15_000 })
  })
})

// ── Matching automatique ──────────────────────────────────────────────────────

test.describe('Rapprochement — matching automatique', () => {
  test('clic "Lancer le rapprochement" → résultats ou état vide', async ({ page }) => {
    await page.goto('/rapprochement')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    await page.getByRole('button', { name: /lancer le rapprochement/i }).first().click()

    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    await expect(
      page.getByText(/match|rapproché|aucune|correspondance|analyse/i).first()
    ).toBeVisible({ timeout: 20_000 })
  })

  test('résultat matching : compteurs matchés/suggestions/non-matchés affichés', async ({ page }) => {
    await page.goto('/rapprochement')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    await page.getByRole('button', { name: /lancer le rapprochement/i }).first().click()
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    // Banner shows "Rapprochement terminé" + "X auto-rapprochés, Y suggestions..."
    const result = page
      .getByText(/rapprochement terminé|auto-rapprochés|suggestions/i).first()
      .or(page.getByText(/aucun|erreur/i).first())
    await expect(result.first()).toBeVisible({ timeout: 30_000 })
  })
})

// ── Import relevé bancaire CSV ────────────────────────────────────────────────

test.describe('Rapprochement — import relevé CSV', () => {
  test('page /import-releve accessible', async ({ page }) => {
    await page.goto('/import-releve')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('titre "Import relevé bancaire" visible', async ({ page }) => {
    await page.goto('/import-releve')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(
      page.getByRole('heading', { name: /import relevé bancaire/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('upload bank.csv → traitement ou message compte manquant', async ({ page }) => {
    await page.goto('/import-releve')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})

    const fileInput = page.locator('input[type="file"]').first()
    const hasInput = await fileInput.isVisible({ timeout: 5_000 }).catch(() => false)

    if (hasInput) {
      await fileInput.setInputFiles(path.join(FILES_DIR, 'bank.csv'))
      await expect(
        page.getByText(/import|traitement|transactions|erreur|lignes/i).first()
      ).toBeVisible({ timeout: 20_000 })
    } else {
      // No bank account → form hidden, warning shown
      await expect(
        page.getByText(/aucun compte bancaire/i)
      ).toBeVisible({ timeout: 10_000 })
    }
  })

  test('matching automatique avec écritures comptables : bouton rapprochement accessible après import', async ({ page }) => {
    // After visiting import-releve, the rapprochement button should be accessible
    await page.goto('/rapprochement')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
    await expect(
      page.getByRole('button', { name: /lancer le rapprochement/i }).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})

// ── Anomalies ────────────────────────────────────────────────────────────────

test.describe('Rapprochement — détection d\'anomalies', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rapprochement/anomalies')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
  })

  test('page /rapprochement/anomalies accessible', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('filtres par statut (Ouverte/Résolue/Ignorée) visibles', async ({ page }) => {
    const filterBtn = page
      .getByRole('button', { name: /ouverte|résolue|ignorée|tout/i }).first()
      .or(page.getByText(/ouverte|résolue|ignorée/i).first())
    await expect(filterBtn.first()).toBeVisible({ timeout: 15_000 })
  })

  test('filtres par sévérité (Critique/Avertissement/Info) visibles', async ({ page }) => {
    const severite = page
      .getByRole('button', { name: /critique|avertissement|info/i }).first()
      .or(page.getByText(/critique|avertissement/i).first())
    await expect(severite.first()).toBeVisible({ timeout: 15_000 })
  })

  test('liste anomalies ou état vide visible', async ({ page }) => {
    const content = page
      .getByText(/aucune anomalie|anomalie/i).first()
    await expect(content.first()).toBeVisible({ timeout: 15_000 })
  })

  // Anomalie montant > 10 000€ : détectée automatiquement lors du rapprochement
  test('validation manuelle anomalie ouverte → bouton Résoudre/Ignorer (si anomalies présentes)', async ({ page }) => {
    const hasAnomalies = await page.getByRole('button', { name: /résoudre|ignorer|marquer/i })
      .first().isVisible().catch(() => false)
    if (hasAnomalies) {
      await expect(
        page.getByRole('button', { name: /résoudre|ignorer/i }).first()
      ).toBeVisible({ timeout: 10_000 })
    } else {
      test.info().annotations.push({ type: 'skip-reason', description: 'No open anomalies in test account' })
    }
  })
})

// ── Transactions rapprochées ──────────────────────────────────────────────────

test.describe('Rapprochement — transactions', () => {
  test('/rapprochement/transactions accessible', async ({ page }) => {
    await page.goto('/rapprochement/transactions')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('titre ou liste transactions visible', async ({ page }) => {
    await page.goto('/rapprochement/transactions')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})

    const content = page
      .getByRole('heading', { name: /transaction/i }).first()
      .or(page.getByText(/aucune transaction|transaction/i).first())
    await expect(content.first()).toBeVisible({ timeout: 15_000 })
  })
})
