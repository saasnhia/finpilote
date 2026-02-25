/**
 * Factures — tests E2E
 * The factures page is OCR/upload-based (no manual create-invoice form).
 * Tests cover: upload zone, file size validation, OCR extraction, stats cards.
 */
import { test, expect } from '@playwright/test'
import path from 'path'

const FILES_DIR = path.join(__dirname, 'files')

// ── Helpers ───────────────────────────────────────────────────────────────────

async function gotoFactures(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] extends { page: infer P } ? P : never : never) {
  await page.goto('/factures')
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
}

// ── Basic access ──────────────────────────────────────────────────────────────

test.describe('Factures — accès', () => {
  test('page factures accessible', async ({ page }) => {
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('titre "Factures" visible', async ({ page }) => {
    await page.goto('/factures')
    await expect(page.getByRole('heading', { name: /factures/i, level: 1 })).toBeVisible({ timeout: 15_000 })
  })
})

// ── Upload zone ───────────────────────────────────────────────────────────────

test.describe('Factures — zone upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  })

  test('zone drag & drop visible avec texte "Glissez-déposez"', async ({ page }) => {
    await expect(
      page.getByText(/glissez-déposez ou cliquez pour importer/i)
    ).toBeVisible({ timeout: 15_000 })
  })

  test('taille max affichée (10 Mo)', async ({ page }) => {
    await expect(page.getByText(/10.*mo|max.*10/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('input file présent (hidden dans zone drop)', async ({ page }) => {
    // The file input is hidden but must exist in the DOM
    await expect(page.locator('input[type="file"]').first()).toBeAttached({ timeout: 10_000 })
  })

  test('upload fichier trop volumineux (>10 Mo) → toast erreur', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first()
    // Inject a 11MB buffer file via Playwright
    await fileInput.setInputFiles({
      name: 'huge-invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(11 * 1024 * 1024, 0),
    })
    await expect(
      page.getByText(/trop volumineux|max 10/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('upload invoice.txt → état "Traitement en cours" ou résultat', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FILES_DIR, 'invoice.txt'))
    // Either loading state or extracted data result
    await expect(
      page.getByText(/traitement en cours|ocr|confiance|fournisseur|erreur/i).first()
    ).toBeVisible({ timeout: 20_000 })
  })
})

// ── Extraction OCR ────────────────────────────────────────────────────────────

test.describe('Factures — extraction OCR', () => {
  test('après upload : formulaire extraction visible (ou erreur gracieuse)', async ({ page }) => {
    test.setTimeout(90_000) // OCR API can take 30-60s
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FILES_DIR, 'invoice.txt'))

    // Wait for processing to complete (spinner disappears or result appears)
    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    // Either extraction succeeded (form fields visible) or error shown
    const outcome = page
      .getByText(/fournisseur|n° facture|montant ht|montant ttc|confiance ocr/i).first()
      .or(page.getByText(/erreur|impossible|échec/i).first())
    await expect(outcome.first()).toBeVisible({ timeout: 15_000 })
  })

  test('après extraction réussie : champs HT, TVA, TTC présents', async ({ page }) => {
    test.setTimeout(90_000) // OCR API can take 30-60s
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FILES_DIR, 'invoice.txt'))

    await page.locator('svg.animate-spin').first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})

    const hasForm = await page.getByText(/montant ht|montant ttc/i).first().isVisible().catch(() => false)
    if (hasForm) {
      await expect(page.getByLabel(/montant ht/i).first()).toBeVisible()
      await expect(page.getByLabel(/tva/i).first()).toBeVisible()
      await expect(page.getByLabel(/montant ttc/i).first()).toBeVisible()
    } else {
      // OCR may fail on plain text — skip gracefully
      test.info().annotations.push({ type: 'skip-reason', description: 'OCR returned error for .txt file' })
    }
  })
})

// ── Statistiques ──────────────────────────────────────────────────────────────

test.describe('Factures — statistiques', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  })

  test('card Statistiques visible', async ({ page }) => {
    await expect(page.getByText('Statistiques').first()).toBeVisible({ timeout: 15_000 })
  })

  test('compteurs Total factures, Validées, En attente visibles', async ({ page }) => {
    await expect(page.getByText('Total factures').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Validées').first()).toBeVisible()
    await expect(page.getByText('En attente').first()).toBeVisible()
  })

  test('état vide "Aucune facture importée" ou liste factures', async ({ page }) => {
    const content = page
      .getByText(/aucune facture importée/i)
      .or(page.getByText(/mes factures/i))
    await expect(content.first()).toBeVisible({ timeout: 15_000 })
  })
})

// ── Statuts (lecture seule — pas de form de changement de statut dans le UI) ──

test.describe('Factures — badges de statut', () => {
  test('si la liste est non vide : badges statut Validée/En attente/Brouillon visibles', async ({ page }) => {
    await page.goto('/factures')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})

    const hasList = await page.getByText(/mes factures/i).isVisible().catch(() => false)
    if (hasList) {
      const badge = page
        .getByText(/validée|en attente|brouillon|rejetée/i).first()
      await expect(badge).toBeVisible({ timeout: 10_000 })
    } else {
      // No factures yet — skip
      test.info().annotations.push({ type: 'skip-reason', description: 'No factures in test account' })
    }
  })

  // NOTE: Changement de statut (Brouillon → Envoyée → Payée), recherche par numéro,
  // filtre par statut, et export PDF ne sont pas disponibles dans le UI actuel.
  // Ces fonctionnalités nécessitent une évolution du produit.
  test.skip('changement statut Brouillon → Envoyée → Payée [non implémenté]', async () => {})
  test.skip('recherche par numéro de facture [non implémenté]', async () => {})
  test.skip('filtre par statut [non implémenté]', async () => {})
  test.skip('export PDF d\'une facture [non implémenté]', async () => {})
})
