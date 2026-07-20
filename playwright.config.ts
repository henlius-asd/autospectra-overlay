import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the AutoSpectra viewport-preservation red loop.
 * Targets the Vite dev server (base path /autospectra-overlay/) and the
 * dev-only window.__autospectra seam in WaterfallChart.tsx.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:5180/autospectra-overlay/',
    headless: true,
    // localforage (IndexedDB) persists between reloads by default; that is
    // exactly the behavior we need to exercise the refresh path.
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Pin a dedicated port (strictPort) so a stale/leftover dev server on the
    // default 5173 never collides with the e2e loop.
    command: 'npm run dev -- --port 5180 --strictPort',
    url: 'http://localhost:5180/autospectra-overlay/',
    reuseExistingServer: true,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
