## Why

`getXAxisExtent()` 在 `onChartReady` 时无法获取初始轴范围——`getModel()` 未就绪，`convertFromPixel` 坐标系统未校准，`getOption()` 不包含动态 `min`/`max`。导致 `xRange` 保持默认 `[0, 10]`，ROI 不反映实际数据范围。

本质上这是在和 ECharts 渲染时序赛跑。曲线数据的范围从一开始就是已知的，不需要等 ECharts。

## What Changes

- 在 `WaterfallChart` 中新增 `useEffect([curves])`：当曲线数据加载后，直接从 `curveStore` 的数据中读取 x 范围，写入 `uiStore.xRange`
- 简化 `getXAxisExtent()`：移除无效的 `convertFromPixel` 和 `getOption()` fallback，仅保留 `getModel()` 主路径（用于 `onDataZoom` 获取精确范围）

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `alignment-behavior`: 初始 ROI 范围 SHALL 从曲线数据计算，而非等待 ECharts 渲染

## Impact

- 受影响文件：`src/components/chart/WaterfallChart.tsx`
- 无 API 变更，无 breaking changes