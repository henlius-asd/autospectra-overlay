### Task 9: Integration Tests — Run full test suite and type check

**Files:**
- No new files

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run 2>&1
```

Expected: All tests pass (except the pre-existing `raw_data` fixture issue). Validate that:
- `curveStore` tests pass (including new normalize/global actions)
- `curveScaleMath` tests pass (scaleByDrag removed, computePeakNormalizeFactor added)
- `computeYAxisRange` tests pass (including scaled-data tests)
- Other tests unchanged

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit 2>&1
```

Expected: No errors.

- [ ] **Step 3: Manual verification checklist**

Verify in the running app:
- [ ] Y-scale button cycles off → split → merge → off
- [ ] Split mode: click curve → wheel scales it → badge shows composite ×{effective}
- [ ] Split mode: shift+drag pans curve → badge shows Δ{offset}
- [ ] Split mode: double-click resets curve to 1/0
- [ ] Merge mode: wheel scales all curves → badge shows ×{globalScale}
- [ ] Merge mode: double-click resets globalScale to 1
- [ ] Normalize button: scales curves so peaks match baseline — heights visually equal
- [ ] Clear normalize: returns to original heights
- [ ] Undo works: normalize is one step; wheel changes are individual steps
- [ ] Refresh page: globalScale and normalizeFactors persist
- [ ] Export PNG: scaling matches live view

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: final integration verification, all tests pass"
```
