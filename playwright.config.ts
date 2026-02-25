import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,      // sequential to avoid session conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 30_000,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: 'https://finpilote.vercel.app',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // webServer is omitted — tests run against the deployed Vercel URL.
  // In CI, wait-on handles the health check before tests start.

  projects: [
    // Global setup: creates auth session
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    // Chromium — authenticated
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/auth.spec.ts'],
    },
    // Firefox — authenticated
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/auth.spec.ts'],
    },
    // Auth tests run without saved session (chromium only)
    {
      name: 'auth-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/auth.spec.ts',
    },
  ],
})
