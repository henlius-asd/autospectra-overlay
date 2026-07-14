## Context

`uiStore` 现有单一 `showAxes`（默认 false）同时控 X/Y 轴。`WaterfallChart.tsx:248-274` xAxis/yAxis 均读 `showAxes`；xAxis 未设 `onZero`，ECharts 默认 `onZero:true` 使 X 轴贴 y=0。`computeYAxisRange.ts:62-63` 底部仅 `dataSpan*0.02` padding。`persistence/index.ts` 持久化 `showAxes`。导出按 `showAxes` 处理。

## Goals / Non-Goals

**Goals:**
- X/Y 轴独立显隐，默认仅 X 轴。
- X 轴位于曲线下方且与底层曲线有清晰间隔。
- 持久化与旧 `showAxes` 兼容。

**Non-Goals:**
- 不改轴线样式（颜色/粗细）。
- 不改网格线间距算法。
- 不调整 Y 轴顶部 15% 标签预留区（`LABEL_PADDING_RATIO`）。

## Decisions

### D1: 拆分 `showAxes` → `showXAxis`/`showYAxis`，默认 X 开 Y 关

`uiStore`：`showXAxis: true`、`showYAxis: false`，各自 `toggleShowXAxis`/`toggleShowYAxis`。移除 `showAxes`（或保留为派生 getter 供过渡，最终移除）。WaterfallChart xAxis/yAxis 分别绑定。

**理由**：用户明确"分开，默认只显示 X 轴"。默认 Y 关贴合当前叠图主看曲线形态、不强调强度数值的用法。

### D2: xAxis `onZero: false` + 底部 padding 提升到 8%

xAxis 设 `onZero:false` 使轴线落至 `yAxisMin`（grid 底，即曲线整体下方），不再贴 y=0。`computeYAxisRange` 底部 padding 由 `0.02*dataSpan` 改为 `0.08*dataSpan`（或 `max(0.08*dataSpan, 某固定像素等价值)`），保证底层曲线与轴间清晰间隔。

**理由**：直接满足"不贴线"诉求；`onZero:false` 让轴落在数据下方是规范做法，padding 保证视觉间隔。

### D3: grid top/bottom 依显隐自适应

X 轴隐藏时 grid.bottom 收紧（无轴名称占位），Y 轴隐藏时 grid.left 收紧；显隐切换不挤压曲线区。

## Risks / Trade-offs

- [默认行为变化] 旧默认 `showAxes:false`（两轴都关），新默认 X 开 → 用户首次看到 X 轴。这是本变更目的，可接受；旧工作区经兼容映射恢复其原状态。
- [底部 padding 增大可能压缩曲线纵向空间] → 8% 在叠图层间距充足场景影响小；必要时按 layerSpacing 自适应。
- [onZero:false 对含负值数据] → 轴落在 yAxisMin（<rawDataMin），仍在数据下方，符合预期。
