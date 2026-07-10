### Task 3: Rendering — Apply composite scale in WaterfallChart

**Files:**
- Modify: `src/components/chart/WaterfallChart.tsx`

**Interfaces:**
- Consumes: `normalizeFactors`, `globalScale` from `useCurveStore`
- Produces: Composite `renderedData` in ECharts series option

- [ ] **Step 1: Read current rendering code**

Read `src/components/chart/WaterfallChart.tsx` lines 210-230 to see the current series build and `renderedData` formula.

- [ ] **Step 2: Apply composite formula**

In `src/components/chart/WaterfallChart.tsx`:

1. Add destructured fields from `useCurveStore` (around line 48-49, where `curveScales`, `curveScaleOffsets` are already destructured):
```typescript
const normalizeFactors = useCurveStore((s) => s.normalizeFactors);
const globalScale = useCurveStore((s) => s.globalScale);
```

2. In the `series` map (around line 221-222), replace the scale computation:
```typescript
// OLD:
const scale = curveScales[id] ?? 1;
const scaleOffset = curveScaleOffsets[id] ?? 0;

// NEW:
const normalize = normalizeFactors[id] ?? 1;
const manual = curveScales[id] ?? 1;
const composite = normalize * globalScale * manual;
const scaleOffset = curveScaleOffsets[id] ?? 0;
```

3. Update `renderedData` (line 223-226):
```typescript
// OLD:
const renderedData = curve.data.map(([x, y]) => [
  x + offset.xOffset,
  y * scale + scaleOffset + layerYOffset + offset.yOffset,
]);

// NEW:
const renderedData = curve.data.map(([x, y]) => [
  x + offset.xOffset,
  y * composite + scaleOffset + layerYOffset + offset.yOffset,
]);
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | tail -10
```

Expected: No errors related to WaterfallChart.

- [ ] **Step 4: Commit**

```bash
git add src/components/chart/WaterfallChart.tsx
git commit -m "feat: apply composite scale (normalize x global x manual) in WaterfallChart renderedData"
```

---


