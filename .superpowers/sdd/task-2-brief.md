### Task 2: Pure Math — Add computePeakNormalizeFactor, remove scaleByDrag

**Files:**
- Modify: `src/components/chart/curveScaleMath.ts`
- Modify: `src/components/chart/__tests__/curveScaleMath.test.ts`

**Interfaces:**
- Consumes: `CurveData` type from `@/types`, `CurveOffsets` from `@/store/curveStore`
- Produces: `computePeakNormalizeFactor(curve, offset, xRange, targetPeak): number`
- Removes: `scaleByDrag` function

- [ ] **Step 1: Write failing tests**

```typescript
// In src/components/chart/__tests__/curveScaleMath.test.ts, add after existing imports:
import { computePeakNormalizeFactor } from '../curveScaleMath';
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';

describe('computePeakNormalizeFactor', () => {
  const curve: CurveData = { name: 'test', color: '#000', data: [[0, 10], [1, 50], [2, 30], [3, 100], [5, 20]] };
  const offset: CurveOffsets = { xOffset: 0, yOffset: 0 };

  it('returns targetPeak / peakY when peak > 0', () => {
    expect(computePeakNormalizeFactor(curve, offset, [0, 5], 200)).toBeCloseTo(2.0, 5);
  });

  it('returns 1 when peak <= 0', () => {
    const flatCurve: CurveData = { name: 'flat', color: '#000', data: [[0, 0], [1, 0]] };
    expect(computePeakNormalizeFactor(flatCurve, offset, [0, 1], 100)).toBe(1);
  });

  it('filters by xRange', () => {
    expect(computePeakNormalizeFactor(curve, offset, [0, 2], 100)).toBeCloseTo(2.0, 5); // peak=50
  });

  it('returns 1 when no data points in xRange', () => {
    expect(computePeakNormalizeFactor(curve, offset, [10, 20], 100)).toBe(1);
  });

  it('accounts for xOffset', () => {
    const shiftedCurve: CurveData = { name: 'shifted', color: '#000', data: [[100, 50]] };
    const shiftedOffset: CurveOffsets = { xOffset: -100, yOffset: 0 };
    expect(computePeakNormalizeFactor(shiftedCurve, shiftedOffset, [0, 10], 100)).toBeCloseTo(2.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/chart/__tests__/curveScaleMath.test.ts 2>&1 | tail -20
```

Expected: FAIL — `computePeakNormalizeFactor` not exported.

- [ ] **Step 3: Add computePeakNormalizeFactor, remove scaleByDrag**

In `src/components/chart/curveScaleMath.ts`:

1. Add import at top:
```typescript
import type { CurveData } from '@/types';
import type { CurveOffsets } from '@/store/curveStore';
```

2. Add function after `offsetByDrag`:
```typescript
export function computePeakNormalizeFactor(
  curve: CurveData,
  offset: CurveOffsets,
  xRange: [number, number],
  targetPeak: number,
): number {
  let peakY = -Infinity;
  for (const [x, y] of curve.data) {
    const xAdj = x + offset.xOffset;
    if (xAdj >= xRange[0] && xAdj <= xRange[1]) {
      if (y > peakY) peakY = y;
    }
  }
  if (!isFinite(peakY) || peakY <= 0) return 1;
  return targetPeak / peakY;
}
```

3. Remove `scaleByDrag` function (lines 20-22):
```typescript
// REMOVE:
// export function scaleByDrag(scale: number, deltaPx: number): number {
//   return clampScale(scale * (1 + (-deltaPx) * DRAG_GAIN));
// }
```

Also remove the `DRAG_GAIN` constant (line 18) since it's only used by `scaleByDrag`:
```typescript
// REMOVE:
// const DRAG_GAIN = 1 / 200;
```

4. Update test file: remove `scaleByDrag` tests. In `src/components/chart/__tests__/curveScaleMath.test.ts`, remove the `scaleByDrag` describe block (lines 24-34 in the original: 3 test cases for drag up/down/clamp). Also remove the `scaleByDrag` import.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/chart/__tests__/curveScaleMath.test.ts 2>&1 | tail -20
```

Expected: PASS (scaleByWheel, clampScale, offsetByDrag, computePeakNormalizeFactor all pass)

- [ ] **Step 5: Commit**

```bash
git add src/components/chart/curveScaleMath.ts src/components/chart/__tests__/curveScaleMath.test.ts
git commit -m "feat: add computePeakNormalizeFactor, remove scaleByDrag from curveScaleMath"
```

---


