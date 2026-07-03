## Why

ROI 初始值需要两步：先从曲线数据快速设置，再由 ECharts `onChartReady` 精炼为图表实际可视范围（含 padding）。

日志确认 `useEffect([baselineCurve])` 正确将 ROI 设为数据范围 `[0.008, 45]`，但图表实际可视范围可能不同（ECharts 自动 padding）。`onChartReady` 时 `getModel()` 已就绪，可以获取图表精确范围。

## What Changes

- `AlignmentControls` 新增 `useEffect([baselineCurve])`：直接从基线曲线数据初始化 ROI（快速首次设置）
- `WaterfallChart` `onChartReady` 中恢复 `getXAxisExtent()` 调用：精炼 `xRange` 为图表实际可视范围
- `getXAxisExtent()` 仅被 `onChartReady` 和 `onDataZoom` 调用

## Capabilities

### Modified Capabilities
- `alignment-behavior`: 初始 ROI 先快速从数据设置，再由图表精炼

## Impact

- 受影响文件：`src/components/chart/WaterfallChart.tsx`、`src/components/toolbox/AlignmentControls.tsx`
- 无 API 变更，无 breaking changes