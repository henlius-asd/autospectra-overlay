## Why

`computeYAxisRange` 从复合缩放后数据计算 Y 轴范围，导致轴范围与曲线数据同比例缩放。`globalScale` 增大时曲线和轴同时放大，视觉上互相抵消——badge 显示倍率变化但曲线实际位置不变。同时 ECharts `click` 事件的 `seriesId` 参数未正确传递，导致图表渲染区点击选中与实际曲线 ID 不对齐。

## What Changes

- **BREAKING**: `computeYAxisRange` 改回从原始未缩放数据计算 Y 轴范围（移除 `normalizeFactors`、`globalScale`、`curveScales`、`curveScaleOffsets` 参数），使缩放曲线在固定轴上可见变化。
- 设置 `clip: false`，让缩放后曲线可溢出轴范围（恢复原始设计意图）。
- 修复 ECharts `click` 事件：`seriesId` 不可靠，改用 `seriesIndex` 映射 `visibleIds[seriesIndex]` 获取正确的 curve store ID。
- 更新 `WaterfallChart.tsx` 中 `computeYAxisRange` 调用，移除 scale 参数。
- 更新 `exportImage.ts` 中 `computeYAxisRange` 调用，移除 scale 参数。

## Capabilities

### Modified Capabilities

- `curve-composite-scale`：Y 轴范围自适应需求改为「Y 轴范围用原始数据，缩放曲线通过 clip:false 溢出轴范围」；ECharts click 选中改用 seriesIndex 映射
- `metadata-panel`：图表渲染区点击选中改用 seriesIndex 映射 visibleIds，确保与列表选中一致

## Impact

- `src/components/chart/computeYAxisRange.ts` — 移除 scale 参数，恢复原始数据计算
- `src/components/chart/WaterfallChart.tsx` — 更新调用方，移除 scale 参数；`clip: false`；ECharts click 改用 seriesIndex
- `src/components/chart/exportImage.ts` — 更新调用方，移除 scale 参数
- `src/components/chart/__tests__/computeYAxisRange.test.ts` — 移除 scaled-data 测试用例