## Why

当 `yZoomRange === null`（未缩放状态）时，`useEffect` 中的 `dispatchAction` 将 Y dataZoom 范围强制设置为 `[rawDataMin, rawDataMax]`，这比 ECharts 默认的完整轴范围 `[yAxisMin, yAxisMax]`（含层间距扩展和 15% 标签预留区）更窄。用户拖拽 Y slider 平移时被限制在 `[rawDataMin, rawDataMax]` 内，无法自由移动到数据上方的空白区（标签预留区）或下方。同时 `visibleYRange` 在 null 时也返回 `[rawDataMin, rawDataMax]`，与 ECharts 实际显示的轴范围不一致。

## What Changes

- `useEffect` 中当 `yZoomRange === null` 时不执行 `dispatchAction`，让 ECharts 使用默认的完整轴范围 `[yAxisMin, yAxisMax]`，用户可在全轴范围内自由平移。
- `visibleYRange` 在 `yZoomRange === null` 时返回 `[yAxisFullRange.yAxisMin, yAxisFullRange.yAxisMax]`，与 ECharts 实际显示范围一致。

## Capabilities

### Modified Capabilities

- `y-axis-zoom`: 未缩放状态下 SHALL 不通过 `dispatchAction` 限制 dataZoom 范围；默认可见范围 SHALL 为 `[yAxisMin, yAxisMax]`（完整轴范围），用户 SHALL 可在全轴范围内自由平移。

## Impact

- `src/components/chart/WaterfallChart.tsx`：`useEffect` 中 null 检查跳过 dispatch；`visibleYRange` null 分支改为 `yAxisFullRange`。