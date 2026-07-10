# Task 4 Report: Y-Axis Range — Extend computeYAxisRange for scaled data

**Status:** ✅ Complete

**Commits:**
- `812057d` — `feat: extend computeYAxisRange to compute from composite-scaled data`

**Files modified:**
- `src/components/chart/computeYAxisRange.ts` — Added 4 new params (`normalizeFactors`, `globalScale`, `curveScales`, `curveScaleOffsets`); loop body now computes `yVal * composite + scaleOffset + offset.yOffset` instead of `yVal + offset.yOffset`
- `src/components/chart/WaterfallChart.tsx` — Replaced inline `stableDataRange` + `yAxisFullRange` memos with single `computeYAxisRange()` call; imported the function; updated `stableDataRange.dataSpan` reference to `yAxisFullRange.dataSpan`
- `src/components/chart/exportImage.ts` — Passes `state.normalizeFactors`, `state.globalScale`, `state.curveScales`, `state.curveScaleOffsets` to `computeYAxisRange`
- `src/components/chart/__tests__/computeYAxisRange.test.ts` — Added 2 new tests: scaled data min/max, scaleOffset in range

**Test summary:** All 7 tests pass (5 existing + 2 new)

**Concerns:**
- WaterfallChart's inline `stableDataRange` was replaced since `computeYAxisRange` now handles the same role with scaling. The `dataSpan` reference in the dataZoom config was updated to `yAxisFullRange.dataSpan`.
- Pre-existing TS type errors (number[][] vs DataPoint[]) in test files are unrelated.