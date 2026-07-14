## Context

`computeYAxisRange`（`src/components/chart/computeYAxisRange.ts`）此前在遍历可见曲线数据点时按 `x + offset.xOffset >= xRange[0] && <= xRange[1]` 过滤，即只统计当前 X 可视窗口内的点。由此派生的 `rawDataMin/Max` → `dataSpan` → `yRangeForLayer` → `yAxisMin/Max` 全部随 X 平移/缩放而变化。

影响路径：
- `yAxis.min/max`（`WaterfallChart.tsx`）随窗口极值漂移 → Y 画布自动重缩放。
- `yRangeForLayer` → `layerYOffset = layerIndex * layerSpacing * yRangeForLayer`（`WaterfallChart.tsx`、`exportImage.ts`、`exportPptx.ts`）随窗口漂移 → 曲线层垂直错位。

历史：`2026-07-10-stabilize-y-axis-zoom-range` 曾设计"新增 `yAxisFullRange` 遍历全量数据"与"保留 `computeYAxisRange` 窗口化"双计算分离（design D1），但落地时未拆分——`yAxisFullRange` 直接调用 `computeYAxisRange(..., xRange, ...)`，仍是窗口化，故稳定效果回归。本变更按用户"固定画布"诉求改为全量数据计算。

约束：
- 三处调用方（`WaterfallChart.tsx`、`exportImage.ts`、`exportPptx.ts`）必须保持一致，否则导出与屏幕 Y 范围不一致。
- `xRange` 变量在导出与图表中仍用于 X→像素换算与标注过滤，不能整体移除，仅从 `computeYAxisRange` 调用中摘除。
- 缩放（`normalize × global × manual`）仍以 `clip: false` 溢出轴范围，Y 轴范围仅基于原始未缩放数据（`yVal + offset.yOffset`）——此点不变。

## Goals / Non-Goals

**Goals:**
- X 轴平移/缩放时，`yAxis.min/max`、`dataSpan`、`yRangeForLayer` 保持不变，曲线不自动缩放、不垂直错位。
- 屏幕图表与 PNG/PPTX 导出共用同一套全量 Y 范围计算，导出视图与屏幕一致。
- 减少渲染开销：`yAxisFullRange` 的 useMemo 依赖列表去掉 `xRange`，X 平移不再触发 Y 范围重算。

**Non-Goals:**
- 不改 `onDataZoom` / `xRange` 的写入语义（仍由 `onChartReady`、`onDataZoom`、首次可见曲线初始化承担）。
- 不改 `yZoomRange` 框选规整逻辑（`normalizeYZoomRange`）。
- 不改 `replaceMerge` 策略。
- 不改缩放/归一化倍率计算（`computePeakNormalizeFactor` 仍按可见 X 范围取峰值——归一化目标本就是"当前窗口对齐"，与画布固定是两个独立维度）。
- 不引入"按区域自适应层间距"开关；用户仍用 `layerSpacing` 滑块手动调节。

## Decisions

### D1: `computeYAxisRange` 移除 `xRange` 形参与窗口过滤

将遍历改为无条件统计每条可见曲线**全部**数据点（`for (const [, yVal] of curve.data)`），仅做 `yVal + offset.yOffset` 调整。移除 `xRange` 形参。三个调用方同步摘除 `xRange` 实参。

**理由**：Y 画布（轴范围 + 层间距基准）应稳定，与 X 视口解耦。移除窗口过滤是最小、最直接的实现，且三处调用同源一致。

**备选 A**（design D1 原方案：双计算分离，`yAxisFullRange` 全量、`computeYAxisRange` 窗口化）：否决。`yRangeForLayer` 仍窗口化会让 `layerYOffset` 随 X 平移漂移（"位置改变"症状依旧），不满足"固定画布"。且双份计算需共享 padding/LABEL_PADDING_RATIO 常量，公式漂移风险更高。

**备选 B**（仅 `yAxis.min/max` 全量、`yRangeForLayer` 保留窗口化）：否决，同备选 A 的层漂移问题。

### D2: useMemo 依赖列表移除 `xRange`

`WaterfallChart.tsx` 中 `yAxisFullRange` 的 `useMemo` 依赖由 `[visibleIds, curves, offsets, xRange, layerSpacing]` 改为 `[visibleIds, curves, offsets, layerSpacing]`。X 平移只改 `xRange`，不再触发该 memo 重算；曲线/offset/层间距变更才重算全量范围。

**理由**：语义上 `yAxisFullRange` 不再依赖 `xRange`；保留依赖会在 X 平移时做无用全量遍历。移除后 X 平移为 O(1)（memo 命中），全量遍历只在曲线/offset/层间距变更时发生。

## Risks / Trade-offs

- [全量数据 span 大于局部窗口 span → 可见区域曲线被压缩、层间距在平坦区偏大] → 用户预期"固定画布"即接受此权衡；`layerSpacing` 滑块与 `yZoomRange` 框选仍可细调可见范围。
- [归一化仍按窗口取峰值，与全量画布基准不同] → 有意为之：归一化目标是"当前窗口对齐峰值"，与画布固定属不同维度，二者独立。
- [旧 workspace 的 `yZoomRange` 是绝对 Y 值] → 全量画布稳定后，绝对 `yZoomRange` 反而更稳定（track 不再漂移）；越界时仍由 ECharts 内部 clamp、下次操作由 `onDataZoom` 纠正，行为与现状一致。
- [导出 Y 范围从窗口化改为全量化] → 三处调用同源改动，导出与屏幕保持一致；`exportImage.ts`/`exportPptx.ts` 中 `xRange` 仍保留用于 X→像素换算与标注过滤，不受影响。

## Migration Plan

1. 改 `computeYAxisRange.ts`：移除 `xRange` 形参与过滤条件，遍历全量数据。
2. 改三个调用方摘除 `xRange` 实参；`WaterfallChart.tsx` 同步更新 `useMemo` 依赖列表。
3. 更新 `computeYAxisRange.test.ts`：移除用例 `xRange` 实参，新增"全量数据、忽略 X 视口"用例。
4. 验证：`npx vitest run`、`npx tsc --noEmit`、`npm run build`；人工回归（X 平移/缩放不改变 Y 范围与层位置、导出与屏幕一致）。
5. 无运行时迁移：无持久化结构变化，旧 workspace 直接兼容。

## Open Questions

无。
