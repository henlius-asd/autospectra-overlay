### Task 6: CurveScaleOverlay — Split/merge modes, wheel-only scaling

**Files:**
- Modify: `src/components/chart/CurveScaleOverlay.tsx`

**Interfaces:**
- Consumes: `scaleMode` prop, `globalScale`, `normalizeFactors`, `setGlobalScale`, `setCurveScale`, `setCurveScaleOffset`
- Produces: Split mode (per-curve wheel + shift+drag pan), Merge mode (global wheel), badge with composite/global scale

- [ ] **Step 1: Rewrite CurveScaleOverlay**

In `src/components/chart/CurveScaleOverlay.tsx`:

1. Update Props interface — add `scaleMode`, `globalScale`, `normalizeFactors`, `setGlobalScale`:
```typescript
interface Props {
  scaleMode: 'off' | 'split' | 'merge';
  curveId: string;
  curves: Record<string, CurveData>;
  offsets: Record<string, CurveOffsets>;
  curveScales: Record<string, number>;
  curveScaleOffsets: Record<string, number>;
  normalizeFactors: Record<string, number>;
  globalScale: number;
  xRange: [number, number];
  chartHeight: number;
  gridTop: number;
  gridBottom: number;
  visibleFrame: { yMin: number; yMax: number };
  setCurveScale: (id: string, scale: number) => void;
  setCurveScaleOffset: (id: string, offset: number) => void;
  setGlobalScale: (s: number) => void;
  onDeselect: () => void;
}
```

2. Update destructuring:
```typescript
export default function CurveScaleOverlay({
  scaleMode, curveId, curves, offsets, curveScales, curveScaleOffsets,
  normalizeFactors, globalScale,
  xRange, chartHeight, gridTop, gridBottom, visibleFrame,
  setCurveScale, setCurveScaleOffset, setGlobalScale,
  onDeselect,
}: Props) {
```

3. Replace the `onWheel` handler to handle both modes:
```typescript
const onWheel = useCallback((e: React.WheelEvent) => {
  e.preventDefault();
  if (scaleMode === 'merge') {
    setGlobalScale(scaleByWheel(globalScale, e.deltaY));
  } else if (scaleMode === 'split' && isFinite(originalMin) && isFinite(originalMax)) {
    const scale = curveScales[curveId] ?? 1;
    const next = scaleByWheel(scale, e.deltaY);
    setCurveScale(curveId, next);
    setDisplayScale(next);
  }
}, [scaleMode, curveId, globalScale, curveScales, originalMin, originalMax, setCurveScale, setGlobalScale]);
```

4. Replace the `onMouseDown` handler — remove non-shift drag (scaleByDrag), keep shift+drag (offsetByDrag) in split mode only:
```typescript
const onMouseDown = (e: React.MouseEvent) => {
  if (scaleMode !== 'split') return;
  if (!isFinite(originalMin) || !isFinite(originalMax)) return;
  if (!e.shiftKey) return; // non-shift: no action (drag-scale removed)
  e.stopPropagation();
  e.preventDefault();
  const scaleOffset = curveScaleOffsets[curveId] ?? 0;
  dragRef.current = { startY: e.clientY, startOffset: scaleOffset };
  const frame = { yMin: visibleFrame.yMin, yMax: visibleFrame.yMax, gridTop, gridBottom, chartHeight };
  const onMove = (ev: MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const next = offsetByDrag(d.startOffset, d.startY, ev.clientY, frame);
    setCurveScaleOffset(curveId, next);
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    dragRef.current = null;
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};
```

5. Update `onDoubleClick`:
```typescript
const onDoubleClick = useCallback(() => {
  if (scaleMode === 'merge') {
    setGlobalScale(1);
  } else if (scaleMode === 'split') {
    setCurveScale(curveId, 1);
    setCurveScaleOffset(curveId, 0);
    setDisplayScale(1);
  }
}, [scaleMode, curveId, setCurveScale, setCurveScaleOffset, setGlobalScale]);
```

6. Update `onKeyDown` (Esc):
```typescript
const onKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (scaleMode === 'split') {
      onDeselect();
    } else if (scaleMode === 'merge') {
      onDeselect(); // exits to off
    }
  }
}, [onDeselect, scaleMode]);
```

7. Update badge display:
```typescript
const valid = scaleMode === 'split'
  ? curve && curve.data.length > 0 && isFinite(originalMin) && isFinite(originalMax)
  : true;

const badgeText = scaleMode === 'merge'
  ? `×${globalScale.toFixed(1)}`
  : scaleMode === 'split'
  ? `×${((normalizeFactors[curveId] ?? 1) * globalScale * scale).toFixed(1)}`
  : '';

const badgeOffset = scaleMode === 'split' ? (curveScaleOffsets[curveId] ?? 0) : 0;
```

8. Update the rendered JSX — badge:
```typescript
{badgeText && (
  <div className="absolute text-[10px] font-mono text-blue-600 bg-white bg-opacity-80 px-1 rounded pointer-events-none"
    style={{ left: 8, top: gridTop }}>
    {badgeText}
    {badgeOffset !== 0 && scaleMode === 'split' ? ` Δ${badgeOffset.toFixed(0)}` : ''}
  </div>
)}
```

- [ ] **Step 2: Update WaterfallChart to pass new props**

In `src/components/chart/WaterfallChart.tsx`, update the CurveScaleOverlay usage:

```typescript
{scaleMode !== 'off' && (
  <CurveScaleOverlay
    scaleMode={scaleMode}
    curveId={activeScaledCurveId ?? ''}
    curves={curves}
    offsets={offsets}
    curveScales={curveScales}
    curveScaleOffsets={curveScaleOffsets}
    normalizeFactors={normalizeFactors}
    globalScale={globalScale}
    xRange={xRange}
    chartHeight={chartDims.height}
    gridTop={gridTop}
    gridBottom={gridBottom}
    visibleFrame={{ yMin: visibleYRange[0], yMax: visibleYRange[1] }}
    setCurveScale={setCurveScale}
    setCurveScaleOffset={setCurveScaleOffset}
    setGlobalScale={setGlobalScale}
    onDeselect={() => {
      setActiveScaledCurveId(null);
      if (scaleMode === 'merge') {
        useUiStore.getState().setScaleMode('off');
      }
    }}
  />
)}
```

Also import `useUiStore` at top if not already:
```typescript
import { useUiStore } from '@/store/uiStore';
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | tail -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/chart/CurveScaleOverlay.tsx src/components/chart/WaterfallChart.tsx
git commit -m "feat: rewrite CurveScaleOverlay for split/merge modes, wheel-only scaling, shift+drag pan"
```

---


