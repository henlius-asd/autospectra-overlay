import { test, expect } from '@playwright/test';

/**
 * Regression loop for the color-picker commit fix (NOT a symptom repro).
 *
 * User-reported symptom: dragging inside the native `<input type="color">`
 * picker applies every intermediate color continuously; it should commit once
 * on release. Root cause (by code inspection + React 18 behavior): the panel
 * handlers attach to React `onChange`, which React wires to the native
 * `input` event (continuous during drag) for color inputs, and write the store
 * directly inside it.
 *
 * WHY this test cannot reproduce the symptom itself: Playwright cannot drive
 * the native OS color-picker popup, and — confirmed by probe — synthetic
 * `input`/`change` events on `<input type="color">` do NOT trigger React's
 * onChange in Chromium (the store stayed `#333333` after both, while the
 * store-write seam itself works). So the continuous-drag symptom is only
 * reproducible by a real human drag.
 *
 * WHAT this test does pin: the FIX contract — after the handlers are switched
 * to a native `change` listener (mirroring `ColorPanel.tsx:59`), dispatching a
 * native `change` event commits the color to the store, and `input` events do
 * not. The `change`-commit assertion is RED now (no change listener) and turns
 * GREEN after the fix. (A native `addEventListener('change', ...)` fires on
 * synthetic `change` events — unlike React's onChange — so this loop is a valid
 * red/green anchor for the fix.)
 */

async function readLabelColor(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const s = (window as any).__autospectra?.getUiState?.();
    return s?.labelStyle?.color ?? null;
  });
}

const textColorInput = (page: import('@playwright/test').Page) =>
  page.locator('label', { hasText: '文字颜色' }).locator('xpath=following-sibling::div/input[@type="color"]');

test('文字颜色: native change event commits the color to the store (RED pre-fix, GREEN post-fix)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('文字颜色')).toBeVisible();
  const input = textColorInput(page);
  await expect(input).toBeVisible();

  const initial = await readLabelColor(page);
  expect(initial).not.toBeNull();

  // `input` events must NOT commit (desired; non-discriminating pre/post-fix
  // because synthetics don't reach React onChange, but documents the contract).
  await input.evaluate((el: HTMLInputElement) => {
    el.value = '#aaaaaa';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(await readLabelColor(page)).toBe(initial);

  // Native `change` event MUST commit once the fix adds a change listener.
  // RED now (no change listener; React onChange ignores synthetic change).
  await input.evaluate((el: HTMLInputElement) => {
    el.value = '#600000';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(await readLabelColor(page)).toBe('#600000');
});
