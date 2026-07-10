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

## Concerns
- The `CurveScaleOverlay` conditional originally required `activeScaledCurveId` to be truthy (guarding the `string | null` type). The brief's proposed `{scaleMode !== 'off' &&` would cause a TS error because `CurveScaleOverlay` expects `curveId: string`. The implementation keeps the `activeScaledCurveId` guard to maintain type safety.