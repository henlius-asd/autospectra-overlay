import { test, expect } from '@playwright/test';
import {
  getXExtent,
  getStoreXRange,
  setStoreXRange,
  setInteractionMode,
  getUiState,
  getChartSize,
  getChartDims,
  getCanvasCssWidth,
  toggleRightPanel,
  waitForViewportSettled,
  prepareChartWithFullExtent,
  getYExtent,
  getStoreYZoomRange,
  dispatchYZoom,
} from './helpers';

/**
 * H1 red loop: after a page refresh, the persisted X zoom (uiStore.xRange)
 * is overwritten by the "seed xRange" effect in WaterfallChart.tsx, so the
 * visible X viewport snaps back to the full data extent.
 *
 * Setup: load one committed CSV fixture, make it visible, set a non-default
 * X zoom in the store (the single source of truth), wait for persistence to
 * flush to IndexedDB, then reload and read back the live X extent + store
 * xRange.
 *
 * Expected (current/broken): post-reload xRange == full extent (RED).
 * Goal: post-reload xRange == the persisted sub-range (GREEN).
 */

// Set the store's xRange (the single source of truth), wait for the debounced
// (500ms) IndexedDB persistence to flush, reload, then assert both the store
// xRange and the live chart X extent equal the persisted sub-range.
async function setZoomReloadAndAssert(
  page: import('@playwright/test').Page,
  subRange: [number, number],
  label: string,
): Promise<void> {
  await setStoreXRange(page, subRange);
  await waitForViewportSettled(page);
  const preReload = await getStoreXRange(page);
  expect(preReload, `${label}: pre-reload store xRange`).toEqual(subRange);

  await page.waitForTimeout(700); // let the debounced IndexedDB write flush
  await page.reload();
  await waitForViewportSettled(page);

  const postReloadStore = await getStoreXRange(page);
  const postReloadExtent = await getXExtent(page);
  // eslint-disable-next-line no-console
  console.log(`${label} diag:`, JSON.stringify({ subRange, preReload, postReloadStore, postReloadExtent }));
  expect(postReloadStore, `${label}: store xRange must survive refresh`).toEqual(subRange);
  expect(postReloadExtent, `${label}: chart X extent must survive refresh`).toEqual(subRange);
}

test('H1: non-default X zoom survives a page refresh', async ({ page }) => {
  const [xMin, xMax] = await prepareChartWithFullExtent(page);
  const span = xMax - xMin;
  await setZoomReloadAndAssert(page, [xMin + Math.round(span * 0.25), xMin + Math.round(span * 0.5)], 'non-default');
});

test('H1-edge: X zoom equal to the store default survives a page refresh', async ({ page }) => {
  const [xMin, xMax] = await prepareChartWithFullExtent(page);
  // Edge case (review finding #1): the persisted xRange coincidentally equals
  // the store's initial default [0,10] while the data spans more. The
  // [xRange] restore effect fires only on dep change; on reload the restored
  // [0,10] equals the prior render's value, so the effect does not re-dispatch
  // and the async onDataZoom overwrite can win.
  expect(xMax - xMin, 'data must span beyond [0,10] for this edge case').toBeGreaterThan(10);
  expect(xMin, 'fixture xMin must be 0 for the [0,10] default case').toBe(0);
  await setZoomReloadAndAssert(page, [0, 10], 'edge-default');
});

test('H2: X zoom survives select -> zoomGlobal -> select (inside <-> hidden slider)', async ({ page }) => {
  const [xMin, xMax] = await prepareChartWithFullExtent(page);
  const span = xMax - xMin;
  const subRange: [number, number] = [xMin + Math.round(span * 0.25), xMin + Math.round(span * 0.5)];
  await setStoreXRange(page, subRange);
  await waitForViewportSettled(page);
  expect(await getXExtent(page), 'chart at sub-range before mode switch').toEqual(subRange);

  // zoomGlobal flips xZoom/yZoom `type` from 'inside' to a hidden slider, so
  // ECharts rebuilds those dataZoom components and discards internal start/end.
  await setInteractionMode(page, 'zoomGlobal');
  await waitForViewportSettled(page);
  expect(await getStoreXRange(page), 'store xRange preserved in zoomGlobal').toEqual(subRange);
  expect(await getXExtent(page), 'chart X extent preserved in zoomGlobal').toEqual(subRange);

  // Back to select recreates the 'inside' dataZoom from scratch.
  await setInteractionMode(page, 'select');
  await waitForViewportSettled(page);
  expect(await getStoreXRange(page), 'store xRange preserved after returning to select').toEqual(subRange);
  expect(await getXExtent(page), 'chart X extent preserved after returning to select').toEqual(subRange);
});

test('H3: X and Y zoom survive select -> brace -> select (component removal)', async ({ page }) => {
  const [xMin, xMax] = await prepareChartWithFullExtent(page);
  const span = xMax - xMin;
  const subRange: [number, number] = [xMin + Math.round(span * 0.25), xMin + Math.round(span * 0.5)];
  await setStoreXRange(page, subRange);
  await waitForViewportSettled(page);
  expect(await getXExtent(page), 'chart at X sub-range before brace').toEqual(subRange);

  // Inject a Y sub-range via a chart-originated dataZoom (real wheel events
  // can't be synthesised by Playwright for ECharts dataZoom). onDataZoom
  // writes store.yZoomRange so this doubles as test-state setup.
  const fullY = await getYExtent(page);
  expect(fullY, 'chart reports a Y extent before zoom').not.toBeNull();
  const ySpan = fullY![1] - fullY![0];
  const ySubRange: [number, number] = [fullY![0] + ySpan * 0.25, fullY![0] + ySpan * 0.5];
  await dispatchYZoom(page, ySubRange[0], ySubRange[1]);
  await waitForViewportSettled(page);
  expect(await getStoreYZoomRange(page), 'store yZoomRange set by chart zoom').toEqual(ySubRange);
  expect(await getYExtent(page), 'chart at Y sub-range before brace').toEqual(ySubRange);

  // brace mode previously REMOVED the yZoom/yZoomSlider dataZoom components
  // (option returned only xZoomSlider), collapsing Y back to full range while
  // the store value survived. After the fix all four components are retained
  // (disabled), so both X and Y viewport survive the brace round-trip.
  await setInteractionMode(page, 'brace');
  await waitForViewportSettled(page);
  expect(await getStoreXRange(page), 'store xRange preserved in brace').toEqual(subRange);
  expect(await getStoreYZoomRange(page), 'store yZoomRange preserved in brace').toEqual(ySubRange);
  expect(await getXExtent(page), 'chart X extent preserved in brace').toEqual(subRange);
  expect(await getYExtent(page), 'chart Y extent preserved in brace (no collapse)').toEqual(ySubRange);

  // Returning to select: disabled flips back; X and Y viewport stay.
  await setInteractionMode(page, 'select');
  await waitForViewportSettled(page);
  expect(await getStoreXRange(page), 'store xRange preserved after brace round-trip').toEqual(subRange);
  expect(await getStoreYZoomRange(page), 'store yZoomRange preserved after brace round-trip').toEqual(ySubRange);
  expect(await getXExtent(page), 'chart X extent preserved after brace round-trip').toEqual(subRange);
  expect(await getYExtent(page), 'chart Y extent preserved after brace round-trip').toEqual(ySubRange);
});

test('H4: workspace import X range wins over a prior brush zoom', async ({ page }) => {
  const [xMin, xMax] = await prepareChartWithFullExtent(page);
  const span = xMax - xMin;

  // Simulate a brush zoom to sub-range A.
  const brushed: [number, number] = [xMin + Math.round(span * 0.25), xMin + Math.round(span * 0.5)];
  await setStoreXRange(page, brushed);
  await waitForViewportSettled(page);
  expect(await getXExtent(page), 'chart at brushed range').toEqual(brushed);

  // Immediately "import" a workspace whose X range is a different sub-range B.
  // H4 hypothesis: a leftover xZoomRangeSource='event' from the brush could
  // make the [xRange] effect skip dispatching B, leaving the chart at A.
  const imported: [number, number] = [xMin + Math.round(span * 0.6), xMin + Math.round(span * 0.8)];
  await setStoreXRange(page, imported);
  await waitForViewportSettled(page);

  const store = await getStoreXRange(page);
  const ext = await getXExtent(page);
  // eslint-disable-next-line no-console
  console.log('H4 diag:', JSON.stringify({ brushed, imported, store, ext }));
  expect(store, 'store must hold the imported range').toEqual(imported);
  expect(ext, 'chart must show the imported range, not the brushed one').toEqual(imported);
});

test('H4-race: external setXRange landing in the same tick as a chart dataZoom is not swallowed', async ({ page }) => {
  await prepareChartWithFullExtent(page);
  // Chart is at the full extent. Inject, in ONE synchronous tick:
  //   (a) a chart-originated dataZoom to [9,18]  -> onDataZoom sets
  //       xZoomRangeSource='event' and writes store=[9,18];
  //   (b) an external setXRange([21,28])         -> simulates a workspace
  //       import landing in the same React batch.
  // React 18 auto-batches both into one commit with xRange=[21,28]. The
  // [xRange] useLayoutEffect then runs ONCE; if it sees the stale
  // source='event' from (a) it skips dispatching [21,28], leaving the chart
  // at [9,18] while the store holds [21,28] — the H4 residue bug.
  await page.evaluate(() => {
    const a = (window as any).__autospectra;
    a.dispatchXZoom(9, 18);              // chart-originated
    a.getUiState().setXRange([21, 28]);  // external "import", same tick
  });
  await waitForViewportSettled(page);

  const store = await getStoreXRange(page);
  const ext = await getXExtent(page);
  // eslint-disable-next-line no-console
  console.log('H4-race diag:', JSON.stringify({ store, ext }));
  expect(store, 'store must hold the external (imported) range').toEqual([21, 28]);
  expect(ext, 'chart must show the imported range, not the swallowed chart-zoom').toEqual([21, 28]);
});

test('brush: box-select zooms to the brushed rect and returns to select mode', async ({ page }) => {
  const [xMin, xMax] = await prepareChartWithFullExtent(page);
  const fullSpan = xMax - xMin;

  // Activate the brush tool (the [interactionMode] effect dispatches
  // takeGlobalCursor to register pointer handlers).
  await setInteractionMode(page, 'brush');
  await page.waitForTimeout(200);

  // Drag a rect over the middle of the plot area.
  const box = await page.locator('canvas').first().boundingBox();
  expect(box, 'canvas must be present').not.toBeNull();
  const x1 = box!.x + box!.width * 0.3;
  const y1 = box!.y + box!.height * 0.4;
  const x2 = box!.x + box!.width * 0.6;
  const y2 = box!.y + box!.height * 0.6;
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps: 6 });
  await page.mouse.up();
  await waitForViewportSettled(page);

  const store = await getStoreXRange(page);
  const ext = await getXExtent(page);
  const ui = await getUiState(page);

  // eslint-disable-next-line no-console
  console.log('brush diag:', JSON.stringify({ xMin, xMax, store, ext, mode: ui?.interactionMode, yZoom: ui?.yZoomRange }));

  // brushEnd sets xRange to the brushed sub-range, switches back to select.
  expect(ui?.interactionMode, 'brush returns to select mode').toEqual('select');
  expect(store, 'brushed xRange must be a sub-range').not.toBeNull();
  const span = store![1] - store![0];
  expect(span, 'brushed range must be narrower than full').toBeLessThan(fullSpan);
  expect(store![0], 'brushed xMin within data').toBeGreaterThanOrEqual(xMin);
  expect(store![1], 'brushed xMax within data').toBeLessThanOrEqual(xMax);
  // The chart's visible extent must match the brushed store range (the rAF
  // restore via dispatchRangeToIds applied it).
  expect(ext, 'chart extent must equal the brushed range').toEqual(store);
});

test('H5: chartDims (React state) tracks container resize, not just the ECharts canvas', async ({ page }) => {
  await prepareChartWithFullExtent(page);

  const sizeBefore = await getChartSize(page);
  const dimsBefore = await getChartDims(page);
  const cssBefore = await getCanvasCssWidth(page);
  expect(sizeBefore, 'chart must be ready').not.toBeNull();
  expect(dimsBefore, 'chartDims must be mirrored').not.toBeNull();

  // Collapse the right panel -> center column widens.
  await toggleRightPanel(page);
  await page.waitForTimeout(500); // CSS transition + ECharts auto-resize settle

  const cssAfter = await getCanvasCssWidth(page);
  const sizeAfter = await getChartSize(page);
  const dimsAfter = await getChartDims(page);

  // eslint-disable-next-line no-console
  console.log('H5 diag:', JSON.stringify({ cssBefore, dimsBefore, sizeBefore, cssAfter, dimsAfter, sizeAfter }));

  // Sanity: the container + ECharts canvas both grew (echarts-for-react
  // auto-resizes the drawing buffer).
  expect(cssAfter!, 'container must widen on right-panel collapse').toBeGreaterThan(cssBefore!);
  expect(sizeAfter!.width, 'ECharts drawing-buffer must track the container').toBeGreaterThan(sizeBefore!.width);

  // The actual H5 bug: the React-side chartDims (consumed by convertYToPixel,
  // gridTop/gridBottom/gridLeft/gridRight, and every overlay) must ALSO grow,
  // otherwise overlays and click-targeting drift after a resize.
  expect(dimsAfter!.width, 'chartDims React state must track the container resize').toBeGreaterThan(dimsBefore!.width);
});
