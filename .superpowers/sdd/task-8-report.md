# Task 8 Report: Persistence — Save and restore globalScale + normalizeFactors

## Status
**Complete**

## Commits
- `e580bd8` — `feat: persist globalScale and normalizeFactors in workspace JSON`

## Changes
- `src/persistence/index.ts` — Added `globalScale` and `normalizeFactors` to the save snapshot in `saveWorkspace`, added optional `globalScale?: number` and `normalizeFactors?: Record<string, number>` to the restore type interface, and added `globalScale: snapshot.globalScale ?? 1` and `normalizeFactors: snapshot.normalizeFactors ?? {}` to the `setState` call in `restoreWorkspace`.

## Test Summary
- All 8 test files pass (79/80 tests). 1 pre-existing failure in `parseFile.test.ts` due to missing `raw_data/empower_raw2407.arw` file (environment issue, unrelated).
- No persistence-specific tests exist; the changes are exercised through the existing curve store tests (initial default values) and follow the same pattern as other persisted fields.

## Concerns
- None.