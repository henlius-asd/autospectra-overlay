import { test, expect } from '@playwright/test';
import {
  getXExtent,
  getStoreXRange,
  setStoreXRange,
  setInteractionMode,
  getUiState,
  waitForViewportSettled,
  prepareChartWithFullExtent,
} from './helpers';

/**
 * Regression loop for: "使用框选放大后，无法移动" — after a brush zoom
 * returns to select mode, dragging to pan the canvas did nothing.
 *
 * Root cause: the inside dataZoom `disabled` field was emitted only when
 * disabling (brush/brace/scale modes) and OMITTED in select mode. ECharts
 * `setOption` merges per-field, so an omitted `disabled` retained the
 * previous `true`, leaving the inside dataZoom disabled in select mode —
 * it then swallowed all wheel/drag input and fired no dataZoom event, so
 * drag-pan was dead. Fix: always emit `disabled: disableInside` explicitly.
 *
 * Isolation: the CONTROL step proves drag-pan works after a store-set zoom
 * (no brush residue). The regression step then performs a real brush zoom
 * and re-attempts the same drag-pan. Both must shift the window while
 * preserving the span (a pan, not a re-brush and not a no-op).
 */

// Drag-pan horizontally in the middle of the plot area. Dragging RIGHT by
// `dxPx` should shift the X window toward smaller values (content moves right).
async function dragPanRight(page: import('@playwright/test').Page, dxPx: number): Promise<void> {
  const box = await page.locator('canvas').first().boundingBox();
  expect(box, 'canvas must be present').not.toBeNull();
  const cx = box!.x + box!.width * 0.5;
  const cy = box!.y + box!.height * 0.5;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dxPx, cy, { steps: 10 });
  await page.mouse.up();
  await waitForViewportSettled(page);
}

// A successful pan shifts the window (extent changes) WITHOUT narrowing it
// (span preserved). A re-brush would shrink the span; a no-op would leave the
// extent identical. Both are failures.
function assertPanned(before: [number, number] | null, after: [number, number] | null, label: string) {
  expect(after, `${label}: pan must shift the window`).not.toEqual(before);
  const beforeSpan = before![1] - before![0];
  const afterSpan = after![1] - after![0];
  expect(Math.abs(afterSpan - beforeSpan), `${label}: pan must preserve span (not re-brush)`).toBeLessThan(beforeSpan * 0.2);
}

test('drag-pan works in select mode after a store-set zoom (control, no brush)', async ({ page }) => {
  const [xMin, xMax] = await prepareChartWithFullExtent(page);
  const span = xMax - xMin;

  // Set a sub-range directly in the store (NOT via brush) and confirm the
  // chart follows.
  const subRange: [number, number] = [xMin + Math.round(span * 0.3), xMin + Math.round(span * 0.6)];
  await setStoreXRange(page, subRange);
  await waitForViewportSettled(page);
  const before = await getXExtent(page);
  expect(before, 'chart at store-set sub-range').toEqual(subRange);

  await dragPanRight(page, 140);
  const after = await getXExtent(page);
  // eslint-disable-next-line no-console
  console.log('control pan:', JSON.stringify({ before, after }));

  assertPanned(before, after, 'control');
});

test('drag-pan still works in select mode AFTER a brush zoom', async ({ page }) => {
  const [xMin, xMax] = await prepareChartWithFullExtent(page);
  const fullSpan = xMax - xMin;

  // --- Real brush zoom (mirrors the existing brush e2e) ---
  await setInteractionMode(page, 'brush');
  await page.waitForTimeout(200);
  const box = await page.locator('canvas').first().boundingBox();
  expect(box, 'canvas must be present').not.toBeNull();
  const bx1 = box!.x + box!.width * 0.3;
  const by1 = box!.y + box!.height * 0.4;
  const bx2 = box!.x + box!.width * 0.6;
  const by2 = box!.y + box!.height * 0.6;
  await page.mouse.move(bx1, by1);
  await page.mouse.down();
  await page.mouse.move(bx2, by2, { steps: 6 });
  await page.mouse.up();
  await waitForViewportSettled(page);

  const brushed = await getStoreXRange(page);
  const ui = await getUiState(page);
  // eslint-disable-next-line no-console
  console.log('brush result:', JSON.stringify({ brushed, mode: ui?.interactionMode, yZoom: ui?.yZoomRange }));
  expect(ui?.interactionMode, 'brush returns to select mode').toEqual('select');
  expect(brushed![1] - brushed![0], 'brushed range narrower than full').toBeLessThan(fullSpan);

  const beforePan = await getXExtent(page);
  expect(beforePan, 'chart at brushed range').toEqual(brushed);

  // --- The regression: attempt to drag-pan in select mode after brush ---
  await dragPanRight(page, 140);
  const afterPan = await getXExtent(page);
  // eslint-disable-next-line no-console
  console.log('pan-after-brush:', JSON.stringify({ beforePan, afterPan }));

  assertPanned(beforePan, afterPan, 'after-brush');
});
