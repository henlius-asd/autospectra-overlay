# Task 5 Report: Replace yScaleToolMode with scaleMode

## Status
✅ Complete

## Commit
1f79340 - feat: replace yScaleToolMode boolean with scaleMode 3-state enum

## Changes Made

### `src/store/uiStore.ts`
- Replaced `yScaleToolMode: boolean` with `scaleMode: 'off' | 'split' | 'merge'`
- Replaced `setYScaleToolMode` with `setScaleMode(mode)` and `cycleScaleMode()`
- Initial state: `scaleMode: 'off'`

### `src/components/toolbar/Toolbar.tsx`
- Replaced `yScaleToolMode`/`setYScaleToolMode` selectors with `scaleMode`/`cycleScaleMode`/`setScaleMode`
- `handleToggleYScaleMode` now calls `cycleScaleMode()` instead of toggling boolean
- `handleToggleBraceMode` and `handleTogglePointLabelMode` now call `setScaleMode('off')`
- Button shows dynamic label: `'Y缩放'` / `'拆分'` / `'合并'`
- Button title updates per mode with appropriate Chinese descriptions
- Active state when `scaleMode !== 'off'`

### `src/components/data/CurveList.tsx`
- Replaced `yScaleToolMode` selector with `scaleMode`
- Click handler enters split mode only when `scaleMode === 'split'`
- Updated dependency array

### `src/components/chart/WaterfallChart.tsx`
- Replaced `yScaleToolMode` selector with `scaleMode`
- `<CurveScaleOverlay>` renders when `scaleMode !== 'off' && activeScaledCurveId`

## TypeScript Check
No new errors introduced. All remaining errors are pre-existing (test files, CurveScaleOverlay, curveStore).

## Patch: Restore competing-mode disable in handleToggleYScaleMode

### Status
✅ Fixed

### Commit
8e43894 - fix: disable brace/point-label modes before entering scale mode in handleToggleYScaleMode

### What was fixed
`handleToggleYScaleMode` in `Toolbar.tsx` (line 58) was calling `cycleScaleMode()` without first disabling brace placement and point label placement modes. This meant clicking the scale button while brace or point-label mode was active would enter scale mode with both competing modes still enabled, violating the mutual exclusion invariant.

### Fix
Before calling `cycleScaleMode()`, if `scaleMode === 'off'` (i.e., entering scale mode), the function now calls `setBracePlacementMode(false)` and `setPointLabelPlacementMode(false)`. This mirrors the same mutual-exclusion pattern used by `handleToggleBraceMode` and `handleTogglePointLabelMode`.

### TypeScript Check
No new errors. 6 pre-existing errors unchanged (test DataPoint types, missing `scaleByDrag` export, unused `state` in curveStore).

## Concerns
- The `CurveScaleOverlay` conditional originally required `activeScaledCurveId` to be truthy (guarding the `string | null` type). The brief's proposed `{scaleMode !== 'off' &&` would cause a TS error because `CurveScaleOverlay` expects `curveId: string`. The implementation keeps the `activeScaledCurveId` guard to maintain type safety.