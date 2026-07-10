# Task 2 Report: Pure Math — computePeakNormalizeFactor + remove scaleByDrag

**Status:** ✅ Complete

**Commits:**
- `c64c2fa` feat: add computePeakNormalizeFactor, remove scaleByDrag from curveScaleMath

**Test summary:** 12 passed (5 new + 7 existing), 0 failed. 1 test file.

**Changes:**
- `curveScaleMath.ts`: Added `computePeakNormalizeFactor` (peak-finding over visible xRange, returns targetPeak/peakY or 1), removed `DRAG_GAIN` constant and `scaleByDrag` function. Added `CurveData` and `CurveOffsets` imports.
- `curveScaleMath.test.ts`: Added 5 tests for `computePeakNormalizeFactor`, removed `scaleByDrag` import and 3 tests.

**Self-review:**
- TDD followed: tests written first, verified failure (`computePeakNormalizeFactor is not a function`), then implemented.
- `computePeakNormalizeFactor` handles: peak > 0 → targetPeak/peakY, peak ≤ 0 → 1, xRange filtering, empty xRange → 1, xOffset adjustment.
- Removed `scaleByDrag` and its only-dependency `DRAG_GAIN`. `scaleByWheel`, `clampScale`, `offsetByDrag` preserved.
- `CurveData`/`CurveOffsets` imports added to both files; only type-only usage, no runtime cost.

**Concerns:** None.