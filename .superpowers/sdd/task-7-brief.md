### Task 7: Toolbar — Normalize button and 3-state Y-scale toggle

**Files:**
- Modify: `src/components/toolbar/Toolbar.tsx`

**Interfaces:**
- Consumes: `setScaleMode`, `cycleScaleMode`, `normalizeAllPeak`, `clearNormalizeFactors`, `xRange`
- Produces: Y-scale 3-state cycle button, normalize button, clear normalize button

- [ ] **Step 1: Add normalize button to Toolbar**

In `src/components/toolbar/Toolbar.tsx`:

1. Add imports:
```typescript
import { useCurveStore } from '@/store/curveStore';
```

2. Add store bindings:
```typescript
const normalizeAllPeak = useCurveStore((s) => s.normalizeAllPeak);
const clearNormalizeFactors = useCurveStore((s) => s.clearNormalizeFactors);
const xRange = useUiStore((s) => s.xRange);
```

3. Add normalize button after the Y-scale button:
```tsx
<button
  className={`px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100`}
  title="归一化：各曲线峰值对齐到基准线峰值"
  onClick={() => normalizeAllPeak(xRange)}
>
  归一化
</button>
<button
  className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100"
  title="清除归一化，恢复原始高度"
  onClick={clearNormalizeFactors}
>
  清除归一
</button>
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | tail -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/toolbar/Toolbar.tsx
git commit -m "feat: add normalize and clear-normalize buttons to toolbar"
```

---


