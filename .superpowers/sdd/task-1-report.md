# Task 1 Report: Store Layer — Add composite scale fields and actions

## Status: DONE

## Commit
- `fcadb7b` feat: add normalizeFactors, globalScale, and composite scale actions to curveStore

## Tests
- **19 tests pass** (11 existing + 8 new)
- New tests cover: `globalScale` default/clamp/reset, `normalizeFactors` default/set/clear, `normalizeAllPeak` peak calculation relative to baseline, and `removeCurve` cleanup of `normalizeFactors`

## Implementation
- Added `normalizeFactors: Record<string, number>` and `globalScale: number` fields to `CurveState` interface and store factory defaults
- Added actions: `setGlobalScale`, `resetGlobalScale`, `setNormalizeFactor`, `normalizeAllPeak`, `clearNormalizeFactors`
- Imported `clampScale` from `curveScaleMath` for `[0.1, 10]` clamping
- `normalizeAllPeak` finds baseline via `deriveBaseline`, computes peaks over visible X range for all visible curves, writes all factors in single `set()` call
- Updated `removeCurve` and `removeSelectedCurves` to clean up `normalizeFactors` entries

## Concerns
None.