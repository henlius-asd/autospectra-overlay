import { expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Shared e2e helpers for driving the AutoSpectra chart through the DEV-only
 * `window.__autospectra` seam (defined in WaterfallChart.tsx). Centralising
 * the seam contract here means a change to the seam (or the `全选` button)
 * only needs one update instead of per-spec copies that can drift.
 *
 * Committed fixture (NOT gitignored — unlike raw_data/), so these tests run
 * in CI and on a fresh clone. Headerless 2-column CSV (Time,Y), x spans
 * 0..35 so the chart renders a real, non-trivial X extent. Resolved from
 * import.meta.url so it does not depend on process.cwd().
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SAMPLE_FIXTURE = path.resolve(__dirname, 'fixtures', 'sample.csv');

/** Read the live X visible extent straight from the ECharts model via the seam. */
export async function getXExtent(page: import('@playwright/test').Page): Promise<[number, number] | null> {
  return page.evaluate(() => (window as any).__autospectra?.getXExtent?.() ?? null);
}

export async function getStoreXRange(page: import('@playwright/test').Page): Promise<[number, number] | null> {
  return page.evaluate(() => {
    const s = (window as any).__autospectra?.getUiState?.();
    return s ? ([s.xRange[0], s.xRange[1]] as [number, number]) : null;
  });
}

export async function setStoreXRange(page: import('@playwright/test').Page, range: [number, number]): Promise<void> {
  await page.evaluate((r) => {
    const s = (window as any).__autospectra?.getUiState?.();
    s?.setXRange(r);
  }, range);
}

export async function setInteractionMode(page: import('@playwright/test').Page, mode: string): Promise<void> {
  await page.evaluate((m) => {
    const s = (window as any).__autospectra?.getUiState?.();
    s?.setInteractionMode(m);
  }, mode);
}

export async function getUiState(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as any).__autospectra?.getUiState?.());
}

/** ECharts internal drawing-buffer size (chartInstance.getWidth/getHeight). Stays stale if the chart doesn't call resize() on container changes. */
export async function getChartSize(page: import('@playwright/test').Page): Promise<{ width: number; height: number } | null> {
  return page.evaluate(() => (window as any).__autospectra?.getChartSize?.() ?? null);
}

/** React-side chartDims state (used by convertYToPixel, grid math, overlays). Stays stale while the ECharts canvas auto-resizes — the H5 overlay-drift root cause. */
export async function getChartDims(page: import('@playwright/test').Page): Promise<{ width: number; height: number } | null> {
  return page.evaluate(() => (window as any).__autospectra?.__chartDims ?? null);
}

/** CSS width of the rendered <canvas> element (follows the container via 100%). */
export async function getCanvasCssWidth(page: import('@playwright/test').Page): Promise<number | null> {
  return page.locator('canvas').first().evaluate((el: HTMLCanvasElement) => el.getBoundingClientRect().width);
}

export async function toggleRightPanel(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => (window as any).__autospectra?.getUiState?.()?.toggleRightPanel?.());
}

/** Poll until the chart is ready with data (extent non-null) AND the store xRange has been stable for `stableMs` across consecutive reads. */
export async function waitForViewportSettled(page: import('@playwright/test').Page, stableMs = 250, timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last: string | null = null;
  let stableSince = 0;
  while (Date.now() < deadline) {
    const ext = await getXExtent(page);
    const rng = await getStoreXRange(page);
    if (ext && rng) {
      const snap = JSON.stringify({ ext, rng });
      if (snap === last) {
        if (Date.now() - stableSince >= stableMs) return;
      } else {
        last = snap;
        stableSince = Date.now();
      }
    }
    await page.waitForTimeout(60);
  }
  throw new Error('viewport never settled');
}

/** Load the committed CSV fixture, make it visible, and wait for the chart to render with real data. Returns the full X extent [xMin, xMax]. */
export async function prepareChartWithFullExtent(page: import('@playwright/test').Page): Promise<[number, number]> {
  await page.goto('');
  await page.locator('input[type=file]').first().setInputFiles(SAMPLE_FIXTURE);
  await page.getByRole('button', { name: '全选' }).click();
  await waitForViewportSettled(page);
  const fullExtent = await getXExtent(page);
  expect(fullExtent, 'chart should render a real X extent').not.toBeNull();
  const span = fullExtent![1] - fullExtent![0];
  expect(span, 'data span must be non-trivial').toBeGreaterThan(0);
  return fullExtent!;
}
