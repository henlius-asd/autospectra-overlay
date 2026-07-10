## 1. Revert computeYAxisRange to raw data

- [x] 1.1 Remove `normalizeFactors`, `globalScale`, `curveScales`, `curveScaleOffsets` parameters from `computeYAxisRange` signature in `src/components/chart/computeYAxisRange.ts`
- [x] 1.2 Revert loop body to compute from raw data: `const adjusted = yVal + offset.yOffset` (remove `composite` and `scaleOffset` scaling)
- [x] 1.3 Remove the now-unused `composite` and `scaleOffset` variables from the loop

## 2. Update callers

- [x] 2.1 Update `WaterfallChart.tsx` `computeYAxisRange` call — remove scale params
- [x] 2.2 Update `WaterfallChart.tsx` `useMemo` dependency array — remove scale deps
- [x] 2.3 Update `exportImage.ts` `computeYAxisRange` call — remove scale params

## 3. Set clip: false

- [x] 3.1 Change `clip: true` to `clip: false` in `WaterfallChart.tsx` series setup

## 4. Fix ECharts click to use seriesIndex

- [x] 4.1 Change `click` handler in `WaterfallChart.tsx` `onEvents` from `params.seriesId` to `visibleIds[params.seriesIndex]`
- [x] 4.2 Add guard: skip if `params.seriesIndex` is undefined or out of bounds

## 5. Tests

- [x] 5.1 Remove scaled-data test cases from `src/components/chart/__tests__/computeYAxisRange.test.ts` (the "computeYAxisRange with scale params" describe block)
- [x] 5.2 Run `npx vitest run` — all tests pass (except pre-existing raw_data fixture)
- [x] 5.3 Run `npx tsc --noEmit` — 0 errors