import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareChartWithFullExtent, waitForViewportSettled, setInteractionMode } from './helpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_MULTI = path.resolve(__dirname, 'fixtures', 'sample-multi.csv');

// Shared failure-signal capture for the export loops below.
function attachFailureWatchers(page: import('@playwright/test').Page) {
  const consoleErrors: string[] = [];
  const dialogs: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('dialog', async (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });
  return { consoleErrors, dialogs };
}

async function triggerExport(page: import('@playwright/test').Page) {
  let downloadStarted = false;
  page.on('download', () => { downloadStarted = true; });
  await page.getByRole('button', { name: '导出' }).click();
  await page.getByRole('menuitem', { name: '导出 PPTX' }).click();
  await page.waitForTimeout(2500);
  return () => downloadStarted;
}

/**
 * Baseline: export completes fast and produces chromatogram.pptx with no
 * console errors / alerts. Times the export so a hang is distinguishable
 * from a cold-dev-server start (excluded from the test timeout by webServer).
 */
test('PPTX export (single curve) completes and downloads', async ({ page }) => {
  test.setTimeout(60000);
  const { consoleErrors, dialogs } = attachFailureWatchers(page);

  await prepareChartWithFullExtent(page);

  const t0 = Date.now();
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await page.getByRole('button', { name: '导出' }).click();
  await page.getByRole('menuitem', { name: '导出 PPTX' }).click();
  const download = await downloadPromise;
  const elapsedMs = Date.now() - t0;

  expect(download.suggestedFilename()).toBe('chromatogram.pptx');
  expect(elapsedMs, 'export should complete in seconds, not hang').toBeLessThan(10000);
  expect(consoleErrors, 'no console errors').toEqual([]);
  expect(dialogs, 'no alert dialogs').toEqual([]);
});

/**
 * Multi-curve + legend: exercises the legend code path commit b9931ea
 * rewrote to read resolved LineStyle (`visibleCurveStyles[vi]`) instead of
 * the old per-curve color array.
 */
test('PPTX export (multi-curve + legend) completes and downloads', async ({ page }) => {
  test.setTimeout(60000);
  const { consoleErrors, dialogs } = attachFailureWatchers(page);

  await page.goto('');
  await page.locator('input[type=file]').first().setInputFiles(SAMPLE_MULTI);
  await page.getByRole('button', { name: '全选' }).click();
  await waitForViewportSettled(page);
  await expect(page.getByText(/叠图区\s*\(2\)/)).toBeVisible({ timeout: 5000 });

  // Enable "export with legend" via the dev seam (the path b9931ea rewrote).
  await page.evaluate(() => (window as any).__autospectra?.getUiState?.()?.toggleExportWithLegend?.());
  await page.waitForTimeout(300);

  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await page.getByRole('button', { name: '导出' }).click();
  await page.getByRole('menuitem', { name: '导出 PPTX' }).click();
  await downloadPromise;

  expect(consoleErrors, 'no console errors').toEqual([]);
  expect(dialogs, 'no alert dialogs').toEqual([]);
});

/**
 * Brace + point-label annotations: covers the two export body sections
 * (exportPptx.ts lines 221-278) that depend on resolveLabelStyle.
 */
test('PPTX export with brace + point label annotations', async ({ page }) => {
  test.setTimeout(60000);
  const { consoleErrors, dialogs } = attachFailureWatchers(page);

  await prepareChartWithFullExtent(page);
  const box = await page.locator('canvas').first().boundingBox();
  expect(box, 'canvas present').not.toBeNull();

  // Brace: brace mode + horizontal drag in the upper plot area.
  await setInteractionMode(page, 'brace');
  await page.waitForTimeout(200);
  await page.mouse.move(box!.x + box!.width * 0.3, box!.y + box!.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.55, box!.y + box!.height * 0.25, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  // Point label: pointLabel mode + click in the plot area.
  await setInteractionMode(page, 'pointLabel');
  await page.waitForTimeout(200);
  await page.mouse.click(box!.x + box!.width * 0.45, box!.y + box!.height * 0.6);
  await page.waitForTimeout(200);

  await setInteractionMode(page, 'select');
  await page.waitForTimeout(200);

  const isDownloaded = await triggerExport(page);
  expect(isDownloaded(), 'download must start').toBe(true);
  expect(consoleErrors, 'no console errors').toEqual([]);
  expect(dialogs, 'no alert dialogs').toEqual([]);
});

/**
 * Regression: a curve whose per-curve `lineStyle.color` is explicitly null
 * must NOT crash the export. The null reaches the store via an unsanitized
 * JSON workspace import (Toolbar.handleImportJSON applies lineStyle without
 * default-merging). Before the resolveLineStyle fix, `resolved.color` became
 * null and `resolved.color.replace('#','')` threw -> Toolbar outer catch ->
 * the "导出 PPTX 失败" toast, no alert, no download (the exact user symptom).
 * After the fix, null falls back to the default color and the export works.
 */
function buildWorkspaceJson(curveLineStyle: Record<string, unknown> | null): string {
  const curve: Record<string, unknown> = {
    name: 'jsoncurve',
    data: [[0, 100], [5, 90], [10, 80], [15, 70], [20, 65], [25, 60], [30, 55], [35, 50]],
    lineStyle: curveLineStyle,
  };
  return JSON.stringify({
    version: 3,
    curves: { c1: curve },
    offsets: {},
    baselineId: null,
    braces: [],
    stagingOrder: ['c1'],
    visibleCurves: { c1: true },
    layerSpacing: 0,
    pointLabels: [],
    curveScales: {},
    curveScaleOffsets: {},
    globalScale: 1,
    normalizeFactors: {},
    locked: {},
    savedAt: Date.now(),
    yZoomRange: null,
    colorHistory: [],
    showLegend: true,
    exportWithLegend: false,
    labelStyle: { fontSize: 10, fontFamily: 'sans-serif', fontWeight: 'normal', color: '#333333' },
    lineStyle: { width: 1.5, type: 'solid', color: '#000000' },
    showGrid: true,
    showXAxis: true,
    showYAxis: false,
    xRange: [0, 35],
  });
}

async function importWorkspace(page: import('@playwright/test').Page, json: string) {
  await page.goto('');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: '工作区' }).click();
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: '导入工作区' }).click(),
  ]);
  await fc.setFiles({ name: 'ws.json', mimeType: 'application/json', buffer: Buffer.from(json) });
  await waitForViewportSettled(page);
}

test('PPTX export survives a per-curve null color (JSON-imported)', async ({ page }) => {
  test.setTimeout(60000);
  const { consoleErrors, dialogs } = attachFailureWatchers(page);

  await importWorkspace(page, buildWorkspaceJson({ color: null }));

  const isDownloaded = await triggerExport(page);
  expect(isDownloaded(), 'download must start (null falls back to default)').toBe(true);
  expect(consoleErrors, 'no console errors').toEqual([]);
  expect(dialogs, 'no alert dialogs').toEqual([]);
});

test('PPTX export after JSON import (control: all-valid styles)', async ({ page }) => {
  test.setTimeout(60000);
  const { consoleErrors, dialogs } = attachFailureWatchers(page);

  await importWorkspace(page, buildWorkspaceJson({ color: '#0000ff' }));

  const isDownloaded = await triggerExport(page);
  expect(isDownloaded(), 'download must start').toBe(true);
  expect(consoleErrors, 'no console errors').toEqual([]);
  expect(dialogs, 'no alert dialogs').toEqual([]);
});
