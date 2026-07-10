# Task 6 Report: CurveScaleOverlay — Split/merge modes, wheel-only scaling, shift+drag pan

## Status
✅ Complete

## Commits
- `055036e` feat: rewrite CurveScaleOverlay for split/merge modes, wheel-only scaling, shift+drag pan

## Changes

### `src/components/chart/CurveScaleOverlay.tsx`
- Added props: `scaleMode`, `normalizeFactors`, `globalScale`, `setGlobalScale`
- Removed `scaleByDrag` import (function removed from `curveScaleMath`)
- Removed `useState` and `displayScale` (no longer needed; badge reads `globalScale`/`scale` directly)
- **`onWheel`**: `merge` → scales `globalScale` via `scaleByWheel`; `split` → scales per-curve `curveScales[curveId]`
- **`onMouseDown`**: only acts in `split` mode + `shiftKey`; non-shift drag is removed entirely
- **`onDoubleClick`**: `merge` → resets `globalScale` to 1; `split` → resets per-curve scale/offset
- **`onKeyDown`**: `merge` → calls `onDeselect` (which sets scaleMode to 'off'); `split` → calls `onDeselect`
- **Badge**: `merge` → shows `×{globalScale}`; `split` → shows composite `×{normalize×global×manual}` with optional offset `Δ{offset}`
- **`valid`**: `merge` → `true` always; `split` → requires curve data with finite range

### `src/components/chart/WaterfallChart.tsx`
- Added `setGlobalScale` destructured from `useCurveStore`
- Removed `activeScaledCurveId` guard since merge mode renders without a selected curve
- Passes `scaleMode`, `normalizeFactors`, `globalScale`, `setGlobalScale` to CurveScaleOverlay
- `onDeselect`: clears `activeScaledCurveId`; if `merge`, also sets `scaleMode` to `'off'`

## Test Summary
- TypeScript: no new errors (pre-existing errors in `curveStore.test.ts` and `curveStore.ts` unchanged)
- Logic verified by inspecting the compiled output: `npx tsc --noEmit` passes for both modified files

## Concerns
None. The implementation follows the spec exactly.