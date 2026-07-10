## Why

`normalizeYZoomRange` 在 `onDataZoom` 事件回写时对 Y 轴缩放范围做 clamp 到 `[rawDataMin, rawDataMax]` 和最小段 5% dataSpan 强制。但 dataZoom 的实际操作范围是 `[yAxisMin, yAxisMax]`（含层间距扩展和 15% 标签预留），远大于 `[rawDataMin, rawDataMax]`。当用户滚轮缩放越过 `rawDataMax` 边界时，该函数将值 clamp 回 `rawDataMax`，导致 store 与 ECharts 内部状态不一致——ECharts 在下次渲染时被迫调整到 clamp 后的值，表现为突兀的"断层"跳跃（曲线突然变高变矮）。X 轴无此问题（无 clamp 函数），平滑流畅。

## What Changes

- `normalizeYZoomRange` 移除 clamp 到 `[rawDataMin, rawDataMax]` 的行为，移除 minSeg 最小段强制（dataZoom 原生 `minValueSpan` 已在交互层阻止过窄）。
- `normalizeYZoomRange` 仅保留 min/max 顺序排列功能。
- `visibleYRange` 中的 `normalizeYZoomRange` 调用同步移除 clamp 参数传递。

## Capabilities

### New Capabilities

### Modified Capabilities

- `y-axis-zoom`: `normalizeYZoomRange` SHALL NOT clamp `startValue/endValue` 到 `[rawDataMin, rawDataMax]`；minSeg 强制 SHALL NOT 在事件回写时执行（dataZoom 原生 `minValueSpan` 在交互层已阻止）。`onDataZoom` 事件回写 SHALL 直接传递用户操作值（仅做 min/max 顺序排列），避免 store 与 ECharts 内部状态不一致。

## Impact

- `src/components/chart/yZoomRange.ts`：`normalizeYZoomRange` 精简为仅 min/max 顺序排列，移除 clamp 和 minSeg 逻辑。
- `src/components/chart/__tests__/yZoomRange.test.ts`：更新测试覆盖（移除 clamp/minSeg 测试，新增仅排序测试）。
- `src/components/chart/WaterfallChart.tsx`：`visibleYRange` 中的 `normalizeYZoomRange` 调用移除 bounds 参数（不再需要 rawDataMin/Max/dataSpan）。