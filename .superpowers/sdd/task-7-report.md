# Task 7 Report: Toolbar — Normalize button and 3-state Y-scale toggle

**Status:** ✅ Complete

**Branch:** `feature/curve-composite-scaling`

**Commit:** `efc3465` — feat: add normalize and clear-normalize buttons to toolbar

**Changes:**
- `src/components/toolbar/Toolbar.tsx`: Added `normalizeAllPeak`, `clearNormalizeFactors` (from curveStore) and `xRange` (from uiStore) store bindings
- Added two buttons after the Y-scale toggle: "归一化" (calls `normalizeAllPeak(xRange)`) and "清除归一" (calls `clearNormalizeFactors()`)
- Both buttons are disabled when no curves exist, and disabled styling matches existing toolbar convention

**TypeScript check:** No new errors (6 pre-existing errors in test files and curveStore.ts)

**Concerns:** None