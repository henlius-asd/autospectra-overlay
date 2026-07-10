## Context

`computeYAxisRange` 当前从复合缩放后数据（`y * composite + scaleOffset`）计算 Y 轴范围。当 `globalScale` 从 1 → 2 时，所有曲线 Y 值 ×2，同时 `rawDataMax` 也 ×2，`yAxisMax` 按比例放大，ECharts 在更大的轴范围内渲染放大的曲线——视觉上曲线位置不变，缩放效果被抵消。

原设计（`computeYAxisRange.ts` 注释）明确说「Y-axis range is based on raw data only — per-curve scaling is applied in rendering with clip: false」。Task 4 将轴范围改为按缩放数据计算是为了「避免 clip:true 裁剪」，但反而导致了缩放不可见。

ECharts `click` 事件中 `params.seriesId` 在 `echarts-for-react` 或当前 ECharts 版本中未正确传递，导致图表点击选中的曲线 ID 与实际不符。

## Goals / Non-Goals

**Goals:**
- `computeYAxisRange` 改回从原始未缩放数据计算 Y 轴范围
- 设置 `clip: false`，让缩放后曲线可溢出轴范围
- ECharts click 改用 `seriesIndex` → `visibleIds[seriesIndex]` 映射曲线 ID
- 移除 `computeYAxisRange` 的 scale 参数（`normalizeFactors`、`globalScale`、`curveScales`、`curveScaleOffsets`）

**Non-Goals:**
- 不改变 `computeYAxisRange` 的其他逻辑（layerSpacing、padding 等）
- 不改变缩放状态的三层模型
- 不改变 toolbar 按钮逻辑

## Decisions

### D1: 轴范围改回用原始数据

**选择**：`computeYAxisRange` 移除 scale 参数，从原始 `yVal + offset.yOffset` 计算 `rawDataMin/Max`，恢复 Task 4 之前的逻辑。

**替代方案**：保留 scale-aware 参数但设 `includeScale: false` 开关。过度设计，不如直接移除。

**理由**：轴范围用固定原始数据，缩放曲线在固定轴上可见变化。这是原设计意图。

### D2: clip: false

**选择**：ECharts series 设 `clip: false`，让缩放后曲线可溢出轴范围。

**替代方案**：clip: true + 自动调整轴范围。已证明会导致缩放不可见（当前 bug）。

**理由**：clip: false 是原设计意图（`computeYAxisRange.ts` 注释明确说明）。缩放曲线溢出轴范围是期望行为，用户可通过 yZoomRange 调整视图。

### D3: ECharts click 改用 seriesIndex

**选择**：`onEvents.click` 从 `params.seriesId` 改为 `params.seriesIndex`，映射 `visibleIds[params.seriesIndex]` 获取曲线 ID。

**理由**：`seriesId` 在 echarts-for-react 传递中不可靠（可能为 undefined）。`seriesIndex` 是数字索引，始终可用，对应 `visibleIds` 数组中的位置。

## Risks / Trade-offs

**R1: clip: false 导致曲线溢出重叠** → 缩放过大的曲线会溢出到相邻层区域，与 waterfall 层叠布局冲突。用户可通过降低 globalScale 或单曲线手动缩小来避免。yZoomRange 可调整 Y 视图范围。

**R2: seriesIndex 映射依赖 series 顺序** → `visibleIds` 顺序必须与 `series` 数组顺序一致。当前 series 构建使用 `visibleIds.map(...)`，顺序一致。需确保 `visibleIds` 稳定（memoized）。