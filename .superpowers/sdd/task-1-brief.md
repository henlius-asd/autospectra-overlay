### Task 1: Store Layer — Add composite scale fields and actions

**Files:**
- Modify: `src/store/curveStore.ts`
- Modify: `src/store/__tests__/curveStore.test.ts`

**Interfaces:**
- Consumes: Existing `CurveState` interface, `deriveBaseline` helper
- Produces: `normalizeFactors: Record<string, number>`, `globalScale: number`, `setGlobalScale(s)`, `resetGlobalScale()`, `setNormalizeFactor(id, f)`, `normalizeAllPeak(xRange)`, `clearNormalizeFactors()`

- [ ] **Step 1: Write failing tests for new store actions**

```typescript
// In src/store/__tests__/curveStore.test.ts, add after existing tests:

import { createCurve } from './testUtils'; // or define inline

describe('globalScale', () => {
  it('defaults to 1', () => {
    const { useCurveStore } = require('@/store/curveStore');
    expect(useCurveStore.getState().globalScale).toBe(1);
  });

  it('setGlobalScale updates and clamps to [0.1, 10]', () => {
    const { useCurveStore } = require('@/store/curveStore');
    useCurveStore.getState().setGlobalScale(2.5);
    expect(useCurveStore.getState().globalScale).toBe(2.5);
    useCurveStore.getState().setGlobalScale(0.05);
    expect(useCurveStore.getState().globalScale).toBe(0.1);
    useCurveStore.getState().setGlobalScale(20);
    expect(useCurveStore.getState().globalScale).toBe(10);
  });

  it('resetGlobalScale sets to 1', () => {
    const { useCurveStore } = require('@/store/curveStore');
    useCurveStore.getState().setGlobalScale(3);
    useCurveStore.getState().resetGlobalScale();
    expect(useCurveStore.getState().globalScale).toBe(1);
  });
});

describe('normalizeFactors', () => {
  it('defaults to empty object', () => {
    const { useCurveStore } = require('@/store/curveStore');
    expect(useCurveStore.getState().normalizeFactors).toEqual({});
  });

  it('setNormalizeFactor sets a factor for a curve', () => {
    const { useCurveStore } = require('@/store/curveStore');
    useCurveStore.getState().setNormalizeFactor('curveA', 2.0);
    expect(useCurveStore.getState().normalizeFactors['curveA']).toBe(2.0);
  });

  it('clearNormalizeFactors resets all to empty', () => {
    const { useCurveStore } = require('@/store/curveStore');
    useCurveStore.getState().setNormalizeFactor('curveA', 2.0);
    useCurveStore.getState().setNormalizeFactor('curveB', 0.5);
    useCurveStore.getState().clearNormalizeFactors();
    expect(useCurveStore.getState().normalizeFactors).toEqual({});
  });

  it('normalizeAllPeak sets factors relative to baseline peak', () => {
    const { useCurveStore } = require('@/store/curveStore');
    const curveA = { name: 'A', color: '#000', data: [[0, 50], [1, 100], [2, 80]] };
    const curveB = { name: 'B', color: '#111', data: [[0, 200], [1, 150], [2, 180]] };
    useCurveStore.getState().addCurves([curveA, curveB]);
    const state = useCurveStore.getState();
    const ids = Object.keys(state.curves);
    const idA = ids[0];
    const idB = ids[1];
    useCurveStore.getState().toggleCurveVisibility(idA);
    useCurveStore.getState().toggleCurveVisibility(idB);
    // idB is last in stagingOrder → baseline
    useCurveStore.getState().normalizeAllPeak([0, 2]);
    const factors = useCurveStore.getState().normalizeFactors;
    // baselinePeak = 200, curveA peak = 100, factor = 200/100 = 2
    expect(factors[idA]).toBeCloseTo(2.0, 5);
    // curveB peak = 200, factor = 200/200 = 1
    expect(factors[idB]).toBeCloseTo(1.0, 5);
  });

  it('removeCurve cleans up normalizeFactors', () => {
    const { useCurveStore } = require('@/store/curveStore');
    const curve = { name: 'C', color: '#000', data: [[0, 10]] };
    useCurveStore.getState().addCurves([curve]);
    const id = Object.keys(useCurveStore.getState().curves)[0];
    useCurveStore.getState().setNormalizeFactor(id, 3.0);
    useCurveStore.getState().removeCurve(id);
    expect(useCurveStore.getState().normalizeFactors[id]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/store/__tests__/curveStore.test.ts 2>&1 | tail -30
```

Expected: FAIL — `globalScale` and `normalizeFactors` not defined.

- [ ] **Step 3: Add fields and actions to curveStore**

In `src/store/curveStore.ts`:

1. Add to `CurveState` interface (after `curveScaleOffsets`):
```typescript
normalizeFactors: Record<string, number>;
globalScale: number;
```

2. Add action signatures to `CurveState` interface:
```typescript
setGlobalScale: (s: number) => void;
resetGlobalScale: () => void;
setNormalizeFactor: (id: string, f: number) => void;
normalizeAllPeak: (xRange: [number, number]) => void;
clearNormalizeFactors: () => void;
```

3. Add initial values in store factory (after `curveScaleOffsets: {}`):
```typescript
normalizeFactors: {},
globalScale: 1,
```

4. Add `clampScale` import at top of store:
```typescript
import { clampScale } from '@/components/chart/curveScaleMath';
```

5. Add action implementations (after `setCurveScaleOffset`):
```typescript
setGlobalScale: (s) =>
  set((state) => ({
    globalScale: clampScale(s),
  })),

resetGlobalScale: () => set({ globalScale: 1 }),

setNormalizeFactor: (id, f) =>
  set((state) => ({
    normalizeFactors: { ...state.normalizeFactors, [id]: f },
  })),

normalizeAllPeak: (xRange) =>
  set((state) => {
    const baselineId = deriveBaseline(state.stagingOrder, state.visibleCurves);
    if (!baselineId) return state;
    const baselineCurve = state.curves[baselineId];
    if (!baselineCurve) return state;
    const baselineOffset = state.offsets[baselineId] ?? { xOffset: 0, yOffset: 0 };
    let baselinePeak = -Infinity;
    for (const [x, y] of baselineCurve.data) {
      if (x + baselineOffset.xOffset >= xRange[0] && x + baselineOffset.xOffset <= xRange[1]) {
        if (y > baselinePeak) baselinePeak = y;
      }
    }
    if (!isFinite(baselinePeak) || baselinePeak <= 0) return state;
    const normalizeFactors = { ...state.normalizeFactors };
    for (const id of state.stagingOrder) {
      if (!state.visibleCurves[id]) continue;
      const curve = state.curves[id];
      if (!curve) continue;
      const offset = state.offsets[id] ?? { xOffset: 0, yOffset: 0 };
      let peak = -Infinity;
      for (const [x, y] of curve.data) {
        if (x + offset.xOffset >= xRange[0] && x + offset.xOffset <= xRange[1]) {
          if (y > peak) peak = y;
        }
      }
      if (isFinite(peak) && peak > 0) {
        normalizeFactors[id] = baselinePeak / peak;
      } else {
        normalizeFactors[id] = 1;
      }
    }
    return { normalizeFactors };
  }),

clearNormalizeFactors: () => set({ normalizeFactors: {} }),
```

6. Update `removeCurve` — add after `delete curveScaleOffsets[id]`:
```typescript
delete normalizeFactors[id];
```

7. Update `removeSelectedCurves` — add after `delete curveScaleOffsets[id]`:
```typescript
delete normalizeFactors[id];
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/store/__tests__/curveStore.test.ts 2>&1 | tail -30
```

Expected: PASS (all 14 tests, including new)

- [ ] **Step 5: Commit**

```bash
git add src/store/curveStore.ts src/store/__tests__/curveStore.test.ts
git commit -m "feat: add normalizeFactors, globalScale, and composite scale actions to curveStore"
```

---


