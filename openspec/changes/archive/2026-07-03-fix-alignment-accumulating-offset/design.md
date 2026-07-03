## Context

`AlignmentControls.tsx` 的 `handleAlign` 函数在对齐时存在两个层面的 bug：

1. **Stale Closure**：循环中使用闭包捕获的 `offsets` 快照展开，每次迭代覆盖前一次结果。React 18 批处理使仅最后一条曲线 offset 被保留。

2. **算法操作原始数据**：`roiMaxPeakAlignment.align()` 和 `crossCorrelate()` 接收原始曲线数据，返回从原始位置对齐所需的**绝对偏移量**。但代码执行 `current.xOffset + result.xOffset`（增量叠加），导致再次点击时 offset 加倍。

## Goals / Non-Goals

**Goals:**
- 修复多次点击对齐后 offset 累积的问题（对齐幂等性）
- 确保所有非基准曲线在一次对齐操作中都能正确获得 offset
- ROI 默认值改为全局数据范围
- 保持现有对齐算法不变

**Non-Goals:**
- 不修改 store 接口或对齐算法
- 不更改 UI 交互流程
- 不添加新依赖

## Decisions

### Decision 1: 循环前 `getState()` + 一次性 `setState`（解决 stale closure）

在 `handleAlign` 开头通过 `useCurveStore.getState().offsets` 读取最新状态存入局部变量 `newOffsets`，循环内直接修改 `newOffsets`，循环结束后一次性 `setState`。

### Decision 2: 对齐前将当前 offset 应用到数据（解决算法操作原始数据）

在组件内定义 `applyOffset` 辅助函数，将 offset 应用到数据点上。对齐前，将基准曲线和目标曲线的当前 offset 分别应用到原始数据上，使算法接收的是"已偏移后的可视化数据"。这样算法计算的是增量调整量——已对齐时返回 0。

```
applyOffset(data, offset) → data.map(([x, y]) => [x + offset.xOffset, y + offset.yOffset])
```

替代方案：直接设置 `xOffset = result.xOffset`（不叠加）→ 会丢弃用户手动调整的 offset，不可取。

### Decision 3: ROI 默认值为全局范围

通过 `useEffect` 监听 `baselineId` 变化，当基线曲线可用时，将 `roiStart`/`roiEnd` 设置为基线曲线数据的 x 范围（`data[0][0]` 到 `data[last][0]`）。

## Risks / Trade-offs

- [Risk] `applyOffset` 对大数据集产生 O(n) 的额外开销 → 低风险，对齐操作本身就需要遍历数据，开销可忽略
- [Risk] 异步路径中用户中途手动修改 offset 会被覆盖 → 低风险，对齐操作通常很快完成