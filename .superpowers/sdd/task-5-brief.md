### Task 5: UI State — Replace yScaleToolMode with scaleMode

**Files:**
- Modify: `src/store/uiStore.ts`
- Modify: `src/components/toolbar/Toolbar.tsx`
- Modify: `src/components/data/CurveList.tsx`
- Modify: `src/components/chart/WaterfallChart.tsx`

**Interfaces:**
- Consumes: `yScaleToolMode: boolean` references in 3 files
- Produces: `scaleMode: 'off' | 'split' | 'merge'`, `setScaleMode(mode)`, `cycleScaleMode()`

- [ ] **Step 1: Replace yScaleToolMode with scaleMode in uiStore**

In `src/store/uiStore.ts`:

1. Replace `yScaleToolMode: boolean` with:
```typescript
scaleMode: 'off' | 'split' | 'merge';
```

2. Replace `setYScaleToolMode` action with:
```typescript
setScaleMode: (mode) => set({ scaleMode: mode }),
cycleScaleMode: () =>
  set((state) => {
    const next: Record<string, 'off' | 'split' | 'merge'> = {
      off: 'split',
      split: 'merge',
      merge: 'off',
    };
    return { scaleMode: next[state.scaleMode] };
  }),
```

3. Update initial state:
```typescript
scaleMode: 'off',
```

- [ ] **Step 2: Update Toolbar.tsx references**

In `src/components/toolbar/Toolbar.tsx`:

1. Replace `yScaleToolMode` usage:
```typescript
// OLD:
const yScaleToolMode = useUiStore((s) => s.yScaleToolMode);
const setYScaleToolMode = useUiStore((s) => s.setYScaleToolMode);

// NEW:
const scaleMode = useUiStore((s) => s.scaleMode);
const cycleScaleMode = useUiStore((s) => s.cycleScaleMode);
```

2. Update the button handler (around line 58):
```typescript
// OLD:
if (!yScaleToolMode) {
  setYScaleToolMode(true);
} else {
  setYScaleToolMode(false);
}

// NEW:
cycleScaleMode();
```

3. Update the button title and text (around lines 169-175):
```typescript
// OLD:
title={yScaleToolMode ? '点击取消Y轴缩放模式' : 'Y轴缩放：点曲线选中，滚轮/拖拽缩放，Shift+拖拽平移，双击复位'}
{yScaleToolMode ? '缩放中...' : 'Y缩放'}

// NEW:
const scaleLabel = scaleMode === 'off' ? 'Y缩放' : scaleMode === 'split' ? '拆分' : '合并';
const scaleTitle = scaleMode === 'off'
  ? 'Y轴缩放：滚轮缩放，Shift+拖拽平移，双击复位'
  : scaleMode === 'split'
  ? '拆分模式：点曲线选中，滚轮缩放单条曲线'
  : '合并模式：滚轮缩放所有曲线';
title={scaleTitle}
{scaleLabel}
```

- [ ] **Step 3: Update CurveList.tsx references**

In `src/components/data/CurveList.tsx`:

1. Replace `yScaleToolMode`:
```typescript
// OLD:
const yScaleToolMode = useUiStore((s) => s.yScaleToolMode);

// NEW:
const scaleMode = useUiStore((s) => s.scaleMode);
```

2. Update the click handler (around line 145):
```typescript
// OLD:
if (yScaleToolMode) {
  setActiveScaledCurveId(activeScaledCurveId === id ? null : id);
  return;
}

// NEW:
if (scaleMode === 'split') {
  setActiveScaledCurveId(activeScaledCurveId === id ? null : id);
  return;
}
```

3. Update dependency array (line 155):
```typescript
// OLD:
[selectedCurveId, setSelectedCurveId, yScaleToolMode, activeScaledCurveId, setActiveScaledCurveId]

// NEW:
[selectedCurveId, setSelectedCurveId, scaleMode, activeScaledCurveId, setActiveScaledCurveId]
```

- [ ] **Step 4: Update WaterfallChart.tsx reference**

In `src/components/chart/WaterfallChart.tsx`:

1. Replace `yScaleToolMode`:
```typescript
// OLD:
const yScaleToolMode = useUiStore((s) => s.yScaleToolMode);

// NEW:
const scaleMode = useUiStore((s) => s.scaleMode);
```

2. Update the CurveScaleOverlay conditional (around line 409):
```typescript
// OLD:
{yScaleToolMode && activeScaledCurveId && (

// NEW:
{scaleMode !== 'off' && (
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | tail -20
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/store/uiStore.ts src/components/toolbar/Toolbar.tsx src/components/data/CurveList.tsx src/components/chart/WaterfallChart.tsx
git commit -m "feat: replace yScaleToolMode boolean with scaleMode 3-state enum"
```

---


