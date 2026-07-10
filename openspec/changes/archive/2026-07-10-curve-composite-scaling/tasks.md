## 1. Store Layer

- [x] 1.1 Add `normalizeFactors: Record<string, number>` and `globalScale: number` to `CurveState` interface in `src/store/curveStore.ts`
- [x] 1.2 Initialize `normalizeFactors: {}` and `globalScale: 1` in store factory
- [x] 1.3 Add `setGlobalScale(s: number)` and `resetGlobalScale()` actions
- [x] 1.4 Add `setNormalizeFactor(id: string, f: number)` action
- [x] 1.5 Add `normalizeAllPeak(xRange: [number, number])` action — compute baseline peak, set each visible curve's normalizeFactor = baselinePeak / curvePeak in single `set()` call
- [x] 1.6 Add `clearNormalizeFactors()` action — reset all to 1 (or delete keys)
- [x] 1.7 Update `removeCurve` and `removeSelectedCurves` to clean up `normalizeFactors[id]`

## 2. Pure Math

- [x] 2.1 Add `computePeakNormalizeFactor(curve, offset, xRange, targetPeak)` to `src/components/chart/curveScaleMath.ts` — returns `targetPeak / peakY`; guard peakY ≤ 0 or no data → 1
- [x] 2.2 Remove `scaleByDrag` function from `curveScaleMath.ts` (keep `scaleByWheel`, `clampScale`, `offsetByDrag`)
- [x] 2.3 Update `src/components/chart/__tests__/curveScaleMath.test.ts` — remove `scaleByDrag` tests, add `computePeakNormalizeFactor` tests

## 3. Rendering

- [x] 3.1 Apply composite scale formula in `WaterfallChart.tsx` `renderedData`: `y * normalize × global × manual + scaleOffset + layerYOffset + offset.yOffset`
- [x] 3.2 Pass `normalizeFactors` and `globalScale` from store into WaterfallChart

## 4. Y-Axis Range Adaptation

- [x] 4.1 Extend `computeYAxisRange.ts` signature to accept `normalizeFactors`, `globalScale`, `curveScales`, `curveScaleOffsets` parameters
- [x] 4.2 Compute `rawDataMin`/`rawDataMax` from composite-scaled data (`y * composite + scaleOffset`) per curve, accounting for layerYOffset
- [x] 4.3 Update live chart caller in `WaterfallChart.tsx` to pass scale params
- [x] 4.4 Update export caller in `exportImage.ts` to pass scale params

## 5. UI State — Two Independent Scale Modes + Unified Selection

- [x] 5.1 Replace `scaleMode: 'off'|'split'|'merge'` with `globalScaleMode: boolean` and `perCurveScaleMode: boolean` in `src/store/uiStore.ts`
- [x] 5.2 Delete `activeScaledCurveId` field and `setActiveScaledCurveId` action from uiStore
- [x] 5.3 Add `toggleGlobalScaleMode()` and `togglePerCurveScaleMode()` actions
- [x] 5.4 Update all `scaleMode`/`activeScaledCurveId` references in `Toolbar.tsx`, `CurveList.tsx`, `WaterfallChart.tsx`

## 6. Unified Curve Selection

- [x] 6.1 ECharts series: add `id: id` field (curve store ID) alongside existing `name` in `WaterfallChart.tsx` series setup
- [x] 6.2 Add `click` to `onEvents` in WaterfallChart: `onSeriesClick(params) → setSelectedCurveId(params.seriesId)`
- [x] 6.3 Update `CurveList.tsx` `handleCurveClick`: always `setSelectedCurveId(id)` (remove scaleMode branch, remove activeScaledCurveId usage)
- [x] 6.4 Update `CurveList.tsx` visual highlight: use `selectedCurveId` for `isSelected` (already done, verify no activeScaledCurveId dependency remains)

## 7. CurveScaleOverlay — Native Listeners, No Overlay Div

- [x] 7.1 Remove full-screen `<div className="absolute inset-0 z-20" pointerEvents: 'auto'>` overlay
- [x] 7.2 Add `useRef` to chart container div; in `useEffect`, `addEventListener('wheel', handler, { passive: false })` for scaling (global or per-curve based on mode flags + selectedCurveId)
- [x] 7.3 `preventDefault()` in wheel handler to stop ECharts dataZoom (now works because non-passive)
- [x] 7.4 Add native `addEventListener('mousedown', ...)` for shift+drag pan (per-curve mode only, uses `offsetByDrag`)
- [x] 7.5 Cleanup: `removeEventListener` in `useEffect` return
- [x] 7.6 Badge: render as `pointerEvents: 'none'` div — per-curve shows `×{composite}` with `Δ{offset}`, global shows `×{globalScale}`
- [x] 7.7 Double-click handler on chart container: reset active mode's scale (per-curve → curveScales=1/offset=0, global → globalScale=1)

## 8. Toolbar — Two Independent Buttons + Normalize

- [x] 8.1 Replace 3-state Y-scale button with two independent toggle buttons: 「全局缩放」(`globalScaleMode`) and 「单曲线缩放」(`perCurveScaleMode`)
- [x] 8.2 Each button highlights when active (blue), gray when inactive
- [x] 8.3 Both buttons call `setBracePlacementMode(false)` and `setPointLabelPlacementMode(false)` when entering (mutual exclusion with other tools)
- [x] 8.4 Add "归一化" button — one-shot `normalizeAllPeak(xRange)`
- [x] 8.5 Add "还原归一" button (renamed from "清除归一") — `clearNormalizeFactors()`

## 9. Persistence

- [x] 9.1 Add `globalScale` and `normalizeFactors` to workspace snapshot in `src/persistence/index.ts` save function
- [x] 9.2 Read and restore `globalScale` and `normalizeFactors` in restore function, with defaults for missing fields

## 10. Tests

- [x] 10.1 `computePeakNormalizeFactor`: normal peak, zero-peak guard, xRange filter, target=baselinePeak
- [x] 10.2 `curveStore`: `normalizeAllPeak` writes baseline-relative factors, `clearNormalizeFactors`, `setGlobalScale`, undo single entry, removeCurve cleans normalizeFactors
- [x] 10.3 Composite formula: `n × g × m` product with defaults
- [x] 10.4 `computeYAxisRange`: scaled data produces correct axis bounds
- [x] 10.5 Run `npx vitest run` and `npx tsc --noEmit` — all green (except pre-existing raw_data fixture)