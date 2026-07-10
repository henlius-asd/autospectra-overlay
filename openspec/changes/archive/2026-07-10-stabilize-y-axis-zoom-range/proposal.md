## Why

Y 轴缩放范围在用户未操作 Y slider 时自动变化：X 轴缩放会改变 `computeYAxisRange` 的窗口统计（`rawDataMin/Max`），导致 `yAxis.min/max` 漂移，进而使 dataZoom 的可见范围随之改变。同时，每次 option 重建时 `normalizeYZoomRange` 重新 clamp `yZoomRange`，以及 `replaceMerge` 未包含 `dataZoom` 导致组件被销毁重建，都加剧了非用户触发的 Y 轴可见范围抖动。这违反了"缩放仅由用户显式操作触发"的直觉。

## What Changes

- **Fix 1**: 新增 `yAxisFullRange` useMemo，计算全量数据（不按 `xRange` 过滤）的 Y 轴范围，使 `yAxis.min/max` 稳定，阻断 X→Y 的耦合链路。
- **Fix 2**: 移除 option useMemo 中 dataZoom 配置的 `normalizeYZoomRange` 二次 clamp，`startValue/endValue` 直接使用 `yZoomRange` 存储值（已在 `onDataZoom` 中规整），仅在用户操作 Y slider 时更新。
- **Fix 3**: `replaceMerge` 加入 `'dataZoom'`，使 ECharts 按 `id` 原地更新 dataZoom 组件而非销毁重建，消除切换状态时的闪烁。

## Capabilities

### New Capabilities

### Modified Capabilities

- `y-axis-zoom`: Y 轴全量范围（`yAxis.min/max`）改为基于全量数据计算，不再随 `xRange` 变化；`yZoomRange` 到 dataZoom `startValue/endValue` 的传递移除二次 clamp，仅在 `onDataZoom` 用户操作时规整；`replaceMerge` 包含 `dataZoom` 防止组件销毁重建。

## Impact

- `src/components/chart/WaterfallChart.tsx`：新增 `yAxisFullRange` useMemo；`yAxis.min/max` 改用 `yAxisFullRange`；移除 option 中 `normalizeYZoomRange` 调用；`replaceMerge` 改为 `['series', 'dataZoom']`。
- `src/components/chart/computeYAxisRange.ts`：`rangeResult` 仍用于 `yRangeForLayer` 等层间距计算（依赖 `xRange` 是合理的），但不再用于 `yAxis.min/max`。

(End of file - total 25 lines)