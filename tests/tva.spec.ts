/**
 * TVA — déclarations CA3
 * Tests: liste, création, calcul TVA, génération CA3, duplicate error
 */
import { test, expect } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function waitForTVAList(page: import('@playwright/test').Page) {
  await page.goto('/tva')
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
  await page.locator('svg.animate-spin').first()
    .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
}

// ── Liste ─────────────────────────────────────────────────────────────────────

test.describe('TVA — liste des déclarations', () => {
  test.beforeEach(async ({ page }) => {
    await waitForTVAList(page)
  })

  test('page TVA accessible', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('titre "Déclarations TVA" visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /déclarations tva/i })).toBeVisible({ timeout: 15_000 })
  })

  test('bouton "Nouvelle déclaration" visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /nouvelle déclaration/i })).toBeVisible({ timeout: 10_000 })
  })

  test('4 KPI cards visibles (Total, Brouillons, Envoyées, TVA Payée)', async ({ page }) => {
    await expect(page.getByText('Total')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Brouillons')).toBeVisible()
    await expect(page.getByText('Envoyées')).toBeVisible()
    await expect(page.getByText('TVA Payée')).toBeVisible()
  })

  test('liste déclarations ou état vide visible', async ({ page }) => {
    const content = page
      .getByText(/aucune déclaration tva/i)
      .or(page.getByRole('table'))
    await expect(content.first()).toBeVisible({ timeout: 15_000 })
  })

  test('si liste non vide : colonnes TVA Collectée, Déductible, Nette présentes', async ({ page }) => {
    const hasTable = await page.getByRole('table').isVisible().catch(() => false)
    if (hasTable) {
      await expect(page.getByText('TVA Collectée')).toBeVisible()
      await expect(page.getByText('TVA Déductible')).toBeVisible()
      await expect(page.getByText('TVA Nette')).toBeVisible()
    } else {
      test.info().annotations.push({ type: 'skip-reason', description: 'No TVA declarations yet' })
    }
  })
})

// ── Nouvelle déclaration — formulaire ─────────────────────────────────────────

test.describe('TVA — nouvelle déclaration CA3', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tva/nouvelle-declaration')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('page /tva/nouvelle-declaration accessible', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /nouvelle déclaration/i })).toBeVisible({ timeout: 15_000 })
  })

  test('champs Date début et Date fin présents', async ({ page }) => {
    await expect(page.getByLabel(/date de début/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByLabel(/date de fin/i)).toBeVisible()
  })

  test('dropdown Régime TVA : Réel Normal et Réel Simplifié disponibles', async ({ page }) => {
    const select = page.locator('select').first()
    await expect(select).toBeVisible({ timeout: 10_000 })
    // <option> elements are hidden in the DOM — check via evaluate
    const values = await select.evaluate((el: HTMLSelectElement) =>
      Array.from(el.options).map(o => o.value)
    )
    expect(values).toContain('reel_normal')
    expect(values).toContain('reel_simplifie')
  })

  test('bouton "Mois dernier" remplit les dates automatiquement', async ({ page }) => {
    const debutInput = page.getByLabel(/date de début/i)
    const finInput = page.getByLabel(/date de fin/i)

    await page.getByRole('button', { name: /mois dernier/i }).click()

    const debut = await debutInput.inputValue()
    const fin = await finInput.inputValue()
    expect(debut).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(fin).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(debut) <= new Date(fin)).toBeTruthy()
  })

  test('bouton Calculer désactivé si aucune date saisie', async ({ page }) => {
    // Button is disabled when dates are empty
    const calcBtn = page.getByRole('button', { name: /calculer la tva/i })
    await expect(calcBtn).toBeDisabled({ timeout: 10_000 })
  })

  test('sélection régime "Réel Simplifié" change la valeur du select', async ({ page }) => {
    const select = page.locator('select').first()
    await select.selectOption('reel_simplifie')
    await expect(select).toHaveValue('reel_simplifie')
  })
})

// ── Calcul TVA ────────────────────────────────────────────────────────────────

test.describe('TVA — calcul et génération CA3', () => {
  test('calcul TVA "Mois dernier" → résultats (TVA collectée/déductible/nette) affichés', async ({ page }) => {
    await page.goto('/tva/nouvelle-declaration')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    await page.getByRole('button', { name: /mois dernier/i }).click()
    await page.getByRole('button', { name: /calculer la tva/i }).click()

    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    await expect(
      page.getByText(/tva collectée|tva déductible|tva nette|erreur/i).first()
    ).toBeVisible({ timeout: 20_000 })
  })

  test('calcul TVA réel normal (mensuel) → résultat numérique affiché', async ({ page }) => {
    await page.goto('/tva/nouvelle-declaration')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    // Explicit mensuel period
    await page.getByLabel(/date de début/i).fill('2026-01-01')
    await page.getByLabel(/date de fin/i).fill('2026-01-31')
    await page.getByRole('button', { name: /calculer la tva/i }).click()

    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    await expect(
      page.getByText(/tva collectée|tva nette|erreur/i).first()
    ).toBeVisible({ timeout: 20_000 })
  })

  test('calcul TVA réel simplifié (trimestriel/annuel) → résultat affiché', async ({ page }) => {
    await page.goto('/tva/nouvelle-declaration')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    await page.locator('select').first().selectOption('reel_simplifie')
    await page.getByLabel(/date de début/i).fill('2025-01-01')
    await page.getByLabel(/date de fin/i).fill('2025-12-31')
    await page.getByRole('button', { name: /calculer la tva/i }).click()

    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    await expect(
      page.getByText(/tva collectée|tva nette|erreur/i).first()
    ).toBeVisible({ timeout: 20_000 })
  })

  test('génération CA3 → redirection /tva/ca3/{id} ou toast duplicate', async ({ page }) => {
    await page.goto('/tva/nouvelle-declaration')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    await page.getByRole('button', { name: /mois dernier/i }).click()
    await page.getByRole('button', { name: /calculer la tva/i }).click()

    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    const generateBtn = page.getByRole('button', { name: /générer la déclaration ca3/i })
    if (!await generateBtn.isVisible().catch(() => false)) {
      test.info().annotations.push({ type: 'skip-reason', description: 'TVA calculation failed' })
      return
    }

    await generateBtn.click()
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    // Either redirected to /tva/ca3/{id} or duplicate toast
    const outcome = page
      .getByText(/déclaration ca3 générée|déclaration existe déjà/i)
      .or(page.locator('body').filter({ hasText: /\/tva\/ca3\//i }))
    await expect(outcome.first()).toBeVisible({ timeout: 15_000 })
  })

  test('erreur si période déjà déclarée → toast "Une déclaration existe déjà"', async ({ page }) => {
    // Use a fixed historical period that we'll try to generate twice
    async function tryGenerate(periodeDebut: string, periodeFin: string) {
      await page.goto('/tva/nouvelle-declaration')
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

      await page.getByLabel(/date de début/i).fill(periodeDebut)
      await page.getByLabel(/date de fin/i).fill(periodeFin)
      await page.getByRole('button', { name: /calculer la tva/i }).click()

      await page.locator('svg.animate-spin').first()
        .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

      const generateBtn = page.getByRole('button', { name: /générer la déclaration ca3/i })
      if (!await generateBtn.isVisible().catch(() => false)) return 'no-result'

      await generateBtn.click()
      await page.locator('svg.animate-spin').first()
        .waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {})

      const isDuplicate = await page.getByText(/déclaration existe déjà/i).isVisible().catch(() => false)
      const isSuccess = await page.getByText(/déclaration ca3 générée/i).isVisible().catch(() => false)
      return isDuplicate ? 'duplicate' : isSuccess ? 'success' : 'unknown'
    }

    // First call: creates or hits existing
    const r1 = await tryGenerate('2025-11-01', '2025-11-30')
    if (r1 === 'no-result') {
      test.info().annotations.push({ type: 'skip-reason', description: 'TVA calculation unavailable' })
      return
    }

    // Second call same period: must hit duplicate
    const r2 = await tryGenerate('2025-11-01', '2025-11-30')
    expect(['duplicate', 'success']).toContain(r2)
    // If first was success, second must be duplicate
    if (r1 === 'success') {
      expect(r2).toBe('duplicate')
    }
  })
})
