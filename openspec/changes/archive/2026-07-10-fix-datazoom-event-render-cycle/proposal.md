## Why

`onDataZoom` 事件处理器中两次独立的 zustand store 写入（`setXRange` + `setYZoomRange`）触发了两次 React 渲染周期。第一次渲染用**滞后的** `yZoomRange` 作为 dataZoom `startValue/endValue` 发送给 ECharts，ECharts 通过 `replaceMerge` 将内部状态回退到旧值——**撤销了用户刚完成的滚轮缩放**。用户在滚轮放大 Y 轴时看到曲线突然变小（范围扩大），即为此中间状态被浏览器绘制所致。

## What Changes

- `onDataZoom` 中 `setXRange` 添加值相等检查，X 范围未变时跳过 store 写入，消除无意义的渲染。
- `onDataZoom` 将 X 与 Y 的 store 更新合并为单次 `useUiStore.setState({ xRange, yZoomRange })` 调用，确保 React 只渲染一次，避免滞后值覆盖 ECharts 内部状态。

## Capabilities

### New Capabilities

### Modified Capabilities

- `y-axis-zoom`: dataZoom 事件处理 SHALL 在单次渲染周期内完成 X 与 Y 范围的 store 同步，SHALL NOT 因分步写入导致 ECharts 接收滞后的 `startValue/endValue`。
- `echarts-series-replace-merge`: `replaceMerge` 从 `['series']` 扩展为 `['series', 'dataZoom']`，dataZoom 组件按 `id` 原地更新；`onDataZoom` SHALL 仅在 X 范围实际变化时写入 `xRange`。

## Impact

- `src/components/chart/WaterfallChart.tsx`：`onDataZoom` 重构——值相等检查 + 合并 setState。
- `src/store/uiStore.ts`：无接口变化，`setState` 已由 zustand 原生支持。