## Context

当前 `yAxis.min/max` 使用 `rangeResult.yAxisMin/yAxisMax`（来自 `computeYAxisRange`），该函数按 `xRange` 窗口统计可见数据点 → `rawDataMin/Max` 随 X 缩放变化 → `yAxisMin/Max` 变化 → Y 轴全量范围变化 → dataZoom 轨道漂移。

同时，option useMemo 中对 `yZoomRange` 做 `normalizeYZoomRange` 二次 clamp，以及 `replaceMerge: ['series']` 导致 dataZoom 组件每次 option 变化时销毁重建，三者叠加使 Y 轴可见范围在非用户操作下持续抖动。

约束：`computeYAxisRange` 的 `yRangeForLayer` 仍需依赖 `xRange`（层间距以当前可见窗口为基准），不能整体移除 `xRange` 依赖。

## Goals / Non-Goals

**Goals:**
- 用户不操作 Y slider 时，Y 轴可见范围保持不变。
- X 轴缩放、曲线增删、showGrid 切换等操作不改变 Y 轴全量范围（`yAxis.min/max`）。
- DataZoom 组件在 option 更新时原地更新，不销毁重建。

**Non-Goals:**
- 不改 `computeYAxisRange` 中对 `xRange` 的依赖（`yRangeForLayer` 等仍需窗口统计）。
- 不改 `onDataZoom` 中的 `normalizeYZoomRange` 规整逻辑（用户操作时仍需 clamp）。
- 不改 `replaceMerge` 中 `series` 的行为。

## Decisions

### D1: 新增 `yAxisFullRange` useMemo，基于全量数据计算

新增独立的 `useMemo`，遍历所有可见曲线的**全部**数据点（不按 `xRange` 过滤），计算 `yAxisMin/yAxisMax` 等全量范围参数。`yAxis.min/max` 改用 `yAxisFullRange.yAxisMin/yAxisMax`。

`computeYAxisRange` 保留，继续用于 `yRangeForLayer`、`rawDataMin/Max`、`dataSpan` 等（这些依赖 `xRange` 窗口是合理的）。

**理由**：`yAxis.min/max` 定义了 dataZoom 的轨道全量范围，应稳定；`yRangeForLayer` 定义了层间距基准，可随可见窗口调整。两者职责不同，拆分为两个计算。

**备选**：修改 `computeYAxisRange` 内部使其不依赖 `xRange` 计算 `yAxisMin/Max` → 否决，因为 `yRangeForLayer` 仍需窗口统计，拆成两个独立计算更清晰。

### D2: 移除 option 中 `normalizeYZoomRange` 的二次 clamp

`yZoomRange` 已在 `onDataZoom` 中经 `normalizeYZoomRange` 规整后写入 store。option useMemo 中直接使用 `yZoomRange[0]`/`yZoomRange[1]` 作为 `startValue/endValue`，不做二次 clamp。

唯一的未 clamp 入口是 workspace 加载（store 直接写入 `yZoomRange`）。此时 ECharts 内部会自行 clamp 越界值到 `[yAxisMin, yAxisMax]` 范围内，store 不变，直到用户下次操作 Y slider 时由 `onDataZoom` 更新。

**理由**：`normalizeYZoomRange` 在 option useMemo 中被调用，每次 render 都会重新 clamp，导致 `startValue/endValue` 随 `rawDataMin/Max` 变化而变化。移除后，`startValue/endValue` 仅在用户操作时更新。

**备选**：保留 clamp 但仅在 `yZoomRange` 来源变化时执行 → 需要额外状态追踪，复杂度高。

### D3: `replaceMerge` 加入 `'dataZoom'`

```tsx
replaceMerge={['series', 'dataZoom']}
```

ECharts 按 `id` 匹配 dataZoom 组件（`yZoom`、`yZoomSlider`、X slider 等），原地更新属性而非销毁重建。当 `bracePlacementMode` 切换时，Y dataZoom 项从配置中消失，ECharts 自动移除；切回时重新创建。

**理由**：避免每次 option 变化时 dataZoom 组件的销毁-重建周期（包括短暂的全量显示闪烁）。

## Risks / Trade-offs

- [Workspace 加载的 `yZoomRange` 可能越界] → D2 中 ECharts 内部 clamp 到 `[yAxisMin, yAxisMax]`，store 不变，下次用户操作时由 `onDataZoom` 纠正。风险：用户在看到旧 range 被 clamp 后可能困惑，但操作一次 slider 即恢复。

- [`yAxisFullRange` 与 `computeYAxisRange` 的公式重复] → 两个函数共享相同的 Y 轴范围计算公式（padding、labelRatio 等），可提取共享常量或工具函数。风险：公式不一致导致 dataZoom 轨道与实际范围不匹配。

- [`replaceMerge: ['dataZoom']` 中 `bracePlacementMode` 切换时 Y slider 消失再出现] → X dataZoom 已有此行为（`bracePlacementMode` 时只保留 X slider），Y 同理。与现状一致。

- [全量数据计算性能] → `yAxisFullRange` 遍历所有数据点（不按 `xRange` 过滤），数据量大时可能耗时。但 `computeYAxisRange` 在 X 范围较宽时也遍历大部分数据，额外开销在 `computeYAxisRange` 已遍历的范围内。可接受。

## Migration Plan

1. 在 `WaterfallChart.tsx` 新增 `yAxisFullRange` useMemo。
2. 替换 `yAxis.min/max` 为 `yAxisFullRange.yAxisMin/yAxisMax`。
3. 移除 option 中 `normalizeYZoomRange` 调用，直接使用 `yZoomRange`。
4. 修改 `replaceMerge` 为 `['series', 'dataZoom']`。
5. 验证：vitest + tsc + build + 人工回归（X 缩放不改变 Y 范围、Y slider 操作正常、bracePlacementMode 切换正常）。

## Open Questions

- `yAxisFullRange` 的计算公式是否与 `computeYAxisRange` 完全一致？需确认 padding、LAYER_PADDING_RATIO 等常量共享。
- 是否需要将 `yAxisFullRange` 的计算提取为独立工具函数（如 `computeYAxisFullRange`）以复用？