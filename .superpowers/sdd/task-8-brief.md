### Task 8: Persistence — Save and restore globalScale + normalizeFactors

**Files:**
- Modify: `src/persistence/index.ts`

**Interfaces:**
- Consumes: `useCurveStore.getState()`
- Produces: `globalScale` and `normalizeFactors` in save/restore snapshot

- [ ] **Step 1: Add fields to save snapshot**

In `src/persistence/index.ts`, `saveWorkspace` function (around line 24-36), add to snapshot:
```typescript
const snapshot = {
  version: 2,
  curves: state.curves,
  offsets: state.offsets,
  baselineId: state.baselineId,
  braces: state.braces,
  stagingOrder: state.stagingOrder,
  visibleCurves: state.visibleCurves,
  layerSpacing: state.layerSpacing,
  pointLabels: state.pointLabels,
  globalScale: state.globalScale,           // NEW
  normalizeFactors: state.normalizeFactors, // NEW
  savedAt: Date.now(),
};
```

- [ ] **Step 2: Add fields to restore**

In `restoreWorkspace`, add to the type interface (around line 54-65):
```typescript
const snapshot = await persistenceStore.getItem<{
  // ... existing fields ...
  globalScale?: number;
  normalizeFactors?: Record<string, number>;
  // ... existing fields ...
}>(PERSISTENCE_KEY);
```

And in the `setState` call (around line 74-83), add:
```typescript
useCurveStore.setState({
  // ... existing fields ...
  globalScale: snapshot.globalScale ?? 1,
  normalizeFactors: snapshot.normalizeFactors ?? {},
  // ... existing fields ...
});
```

- [ ] **Step 3: Commit**

```bash
git add src/persistence/index.ts
git commit -m "feat: persist globalScale and normalizeFactors in workspace JSON"
```

---


