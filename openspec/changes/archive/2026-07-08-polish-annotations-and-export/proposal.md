## Why

导出的 PNG 图当前包含上方图例与底部 dataZoom 预览条，影响多图叠加（叠图）使用；点标签带外框、对齐原点与虚线，且默认悬在最高曲线之上的预留区顶部、离曲线过远，视觉杂乱；区域标签（brace）创建后无法整体平移重新定位。本次变更统一优化标注的呈现与交互，并清理导出画面。

## What Changes

- **导出跟随 showAxes**：导出前临时切换 ECharts option（隐藏 legend、移除 dataZoom slider 但保留缩放 start/end、收紧 grid 边距），截图后同步还原；导出画面不再包含图例与 x 轴预览条。showAxes=true 时保留坐标轴，showAxes=false 时导出净图（透明背景）。
- **点标签贴近曲线**：点标签纵向基线由"全局 maxY 线（预留区顶部）"改为"最高曲线在 pl.x 处的实际像素 y"；默认 yOffset 由 -20 收紧到 -10，标签落在曲线上方约 10px。
- **点标签去装饰**：移除点标签的外框 rect、对齐原点 circle、虚线 line，仅保留文字；屏幕端与导出端一致。
- **标签完整显示**：对点标签与区域标签做竖直/水平夹取，确保文字不被 grid 边界或 canvas 边裁切。
- **区域标签可拖动**：已创建的 brace 支持整段横向拖拽平移（保持宽度），与点击编辑通过位移阈值区分。
- **区域标签贴近曲线**：brace 的 Y 基线由"预留区顶部 maxY"改为"最高曲线峰值"，贴在曲线上方约 14px。

## Capabilities

### New Capabilities

- `point-label-tool`: 单点标签标注工具——在曲线上方放置可拖动的点标签，标签贴近曲线、无外框/原点/虚线，且在 grid 内完整显示。
- `chart-image-export`: 图表 PNG 导出——合成 ECharts 画布与标注 SVG 为单张 PNG，导出画面跟随 showAxes 开关，排除图例与 dataZoom 预览条，并保持缩放视图与屏幕标注位置一致。

### Modified Capabilities

- `brace-tool`: 新增"整段横向拖拽平移"需求；Y 基线由"含 15% buffer 的 maxY"改为"最高曲线峰值"，标签贴近曲线上方。

## Impact

- 代码：`src/components/chart/exportImage.ts`、`WaterfallChart.tsx`、`PointLabelOverlay.tsx`、`BraceOverlay.tsx`、`computeYAxisRange.ts`、`src/store/curveStore.ts`（新增 `updateBrace` action）。
- 状态：`PointLabel.yOffset` 语义由"相对 maxY 线"变为"相对最高曲线在 x 处的像素 y"，已存标签位置会一次性下移贴近曲线。
- 无外部依赖新增；不涉及数据解析或持久化格式变更。
