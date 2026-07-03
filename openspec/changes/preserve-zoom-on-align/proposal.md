## Why

1. **对齐后重置缩放**：点击"一键对齐"后，图表缩放状态被重置。根因是 `ReactECharts` 设置了 `notMerge`，每次 offset 变化触发 option 重算时，ECharts 完全重建图表配置，丢弃 dataZoom 的当前 `start`/`end` 状态。

2. **初始加载时 ROI 未同步可视范围**：`onChartReady` 中 `getXAxisExtent()` 无法获取初始轴范围——`getModel()` 在图表刚就绪时可能未完全初始化，`getOption()` 不包含 ECharts 动态计算的 `min`/`max`。导致 `xRange` 保持默认值 `[0, 10]`，ROI 不反映实际图表范围。只有用户缩放后 `onDataZoom` 触发时，`getModel()` 已就绪，才能正确获取。

## What Changes

- 移除 `ReactECharts` 的 `notMerge` 属性，使 dataZoom 状态在 option 更新时保留
- 在 `getXAxisExtent()` 中增加 `convertFromPixel` fallback，确保 `onChartReady` 时也能获取初始轴范围

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `alignment-behavior`: 对齐操作 SHALL NOT 重置图表缩放状态；初始加载时 ROI SHALL 同步到图表实际可视范围

## Impact

- 受影响文件：`src/components/chart/WaterfallChart.tsx`
- 无 API 变更，无 breaking changes