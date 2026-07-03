## Context

`getXAxisExtent()` 依赖 ECharts 内部 API 读取轴范围。`onChartReady` 时这些 API 未就绪，导致 `xRange` 保持默认 `[0, 10]`。曲线数据从一开始就在 `curveStore` 中，可以直接使用。

## Goals / Non-Goals

**Goals:**
- 初始加载时 `xRange` 从曲线数据直接计算，不依赖 ECharts 渲染时序
- 简化 `getXAxisExtent()`，仅保留 `getModel()` 用于 zoom 时的精确范围

**Non-Goals:**
- 不修改 `uiStore` 接口
- 不修改 `AlignmentControls` 的 ROI 同步逻辑

## Decisions

**Decision: 在 `WaterfallChart` 中新增 `useEffect([curves])` 初始化 `xRange`**

```typescript
useEffect(() => {
  const ids = Object.keys(curves);
  if (ids.length > 0) {
    const firstCurve = curves[ids[0]];
    if (firstCurve.data.length > 0) {
      useUiStore.getState().setXRange([
        firstCurve.data[0][0],
        firstCurve.data[firstCurve.data.length - 1][0],
      ]);
    }
  }
}, [curves]);
```

曲线数据假设按 x 排序，`data[0][0]` 为最小值，`data[last][0]` 为最大值。多条曲线共享 x 轴，取第一条曲线近似。

**Decision: 简化 `getXAxisExtent()`**

移除无效的 `convertFromPixel` 和 `getOption()` fallback。`getModel()` 在 `onDataZoom` 时已就绪，可获取精确范围。初始值由 `useEffect([curves])` 保证。

## Risks / Trade-offs

- [Risk] 多条曲线 x 范围不同，取第一条不精确 → 实际使用中所有曲线共享 x 轴，且 `onChartReady` 后 `getModel()` 会 refine 为精确范围
- [Risk] `curves` 对象引用变化时重复触发 → 初始值相同，`setXRange` 不会引起下游重渲染