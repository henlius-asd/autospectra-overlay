### Task 4: Y-Axis Range — Extend computeYAxisRange for scaled data

**Files:**
- Modify: `src/components/chart/computeYAxisRange.ts`
- Modify: `src/components/chart/WaterfallChart.tsx` (caller)
- Modify: `src/components/chart/exportImage.ts` (caller)
- Modify: `src/components/chart/__tests__/computeYAxisRange.test.ts`

**Interfaces:**
- Consumes: `normalizeFactors`, `globalScale`, `curveScales`, `curveScaleOffsets`
- Produces: Updated signature with scale params; `rawDataMin`, `rawDataMax`, `dataSpan`, `yAxisMax` computed from scaled data

- [ ] **Step 1: Write failing test for scaled-axis computation**

```typescript
// In src/components/chart/__tests__/computeYAxisRange.test.ts, add:

describe('computeYAxisRange with scale params', () => {
  it('computes rawDataMin/Max from scaled data', () => {
    const curve = { name: 'A', color: '#000', data: [[0, 10], [1, 50], [2, 30]] };
    const curves = { id1: curve };
    const offsets = { id1: { xOffset: 0, yOffset: 0 } };
    const normalizeFactors = { id1: 2 };
    const globalScale = 1.5;
    const curveScales = { id1: 1 };
    const curveScaleOffsets = { id1: 0 };

    const result = computeYAxisRange(
      ['id1'], curves, offsets, [0, 2], 0,
      normalizeFactors, globalScale, curveScales, curveScaleOffsets,
    );
    // peak = 50, composite = 2 * 1.5 * 1 = 3, scaled peak = 150
    expect(result.rawDataMax).toBeCloseTo(150, 0);
    expect(result.rawDataMin).toBeCloseTo(30, 0); // 10 * 3 = 30
  });

  it('handles scaleOffset in range computation', () => {
    const curve = { name: 'A', color: '#000', data: [[0, 10]] };
    const curves = { id1: curve };
    const offsets = { id1: { xOffset: 0, yOffset: 0 } };
    const normalizeFactors = {};
    const globalScale = 1;
    const curveScales = { id1: 2 };
    const curveScaleOffsets = { id1: 5 };

    const result = computeYAxisRange(
      ['id1'], curves, offsets, [0, 0], 0,
      normalizeFactors, globalScale, curveScales, curveScaleOffsets,
    );
    // scaled = 10 * 2 + 5 = 25
    expect(result.rawDataMax).toBeCloseTo(25, 0);
    expect(result.rawDataMin).toBeCloseTo(25, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/chart/__tests__/computeYAxisRange.test.ts 2>&1 | tail -20
```

Expected: FAIL — TypeScript type error (extra params not in signature).

- [ ] **Step 3: Extend computeYAxisRange signature and logic**

In `src/components/chart/computeYAxisRange.ts`:

1. Update function signature to add scale params:
```typescript
export function computeYAxisRange(
  visibleIds: string[],
  curves: Record<string, CurveData>,
  offsets: Record<string, CurveOffsets>,
  xRange: [number, number],
  layerSpacing: number,
  normalizeFactors: Record<string, number> = {},
  globalScale: number = 1,
  curveScales: Record<string, number> = {},
  curveScaleOffsets: Record<string, number> = {},
): {
```

2. Update the loop body (lines 37-46) to compute from scaled data:
```typescript
for (const id of visibleIds) {
  const curve = curves[id];
  const offset = offsets[id] ?? { xOffset: 0, yOffset: 0 };
  const normalize = normalizeFactors[id] ?? 1;
  const manual = curveScales[id] ?? 1;
  const composite = normalize * globalScale * manual;
  const scaleOffset = curveScaleOffsets[id] ?? 0;
  for (const [x, yVal] of curve.data) {
    if (x + offset.xOffset >= xRange[0] && x + offset.xOffset <= xRange[1]) {
      const adjusted = yVal * composite + scaleOffset + offset.yOffset;
      if (adjusted < rawDataMin) rawDataMin = adjusted;
      if (adjusted > rawDataMax) rawDataMax = adjusted;
    }
  }
}
```

3. Remove the old doc comment about "clip: false" (lines 8-9) since range now reflects scaled data.

- [ ] **Step 4: Update WaterfallChart caller**

In `src/components/chart/WaterfallChart.tsx`, find the call to `computeYAxisRange` (around the `yAxisFullRange` computation) and pass the new params:

```typescript
const yAxisFullRange = useMemo(() =>
  computeYAxisRange(
    visibleIds, curves, offsets, xRange, layerSpacing,
    normalizeFactors, globalScale, curveScales, curveScaleOffsets,
  ),
  [visibleIds, curves, offsets, xRange, layerSpacing, normalizeFactors, globalScale, curveScales, curveScaleOffsets],
);
```

- [ ] **Step 5: Update exportImage caller**

In `src/components/chart/exportImage.ts`, find the `computeYAxisRange` call (line 58) and pass scale params:

```typescript
const rangeResult = computeYAxisRange(
  visibleIds, state.curves, state.offsets, xRange, state.layerSpacing,
  state.normalizeFactors ?? {}, state.globalScale ?? 1, state.curveScales ?? {}, state.curveScaleOffsets ?? {},
);
```

- [ ] **Step 6: Run tests to verify**

```bash
npx vitest run src/components/chart/__tests__/computeYAxisRange.test.ts 2>&1 | tail -20
```

Expected: PASS (all tests, including new scaled-data tests)

- [ ] **Step 7: Commit**

```bash
git add src/components/chart/computeYAxisRange.ts src/components/chart/WaterfallChart.tsx src/components/chart/exportImage.ts src/components/chart/__tests__/computeYAxisRange.test.ts
git commit -m "feat: extend computeYAxisRange to compute from composite-scaled data"
```

---


