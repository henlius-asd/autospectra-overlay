## Why

张嫱、于璐提出曲线与坐标刻度轴需有间隔、不要贴线。当前 `WaterfallChart` 的 xAxis 未设 `onZero`/`position`，ECharts 默认 `onZero:true` 使 X 轴贴在 y=0；`computeYAxisRange.ts` 底部仅 `dataSpan*0.02` padding，底层曲线（`layerYOffset=0`）数据近 0 时紧贴轴线。同时用户要求将 Y 轴与 X 轴显示选项分开，默认只显示 X 轴——当前 `uiStore` 仅一个 `showAxes` 布尔同时控两轴，无法独立切换。

## What Changes

- `uiStore` 将 `showAxes: boolean` 拆为 `showXAxis: boolean`（默认 true）与 `showYAxis: boolean`（默认 false）；保留 `showGrid`。
- `WaterfallChart` 的 xAxis/yAxis 配置分别读取 `showXAxis`/`showYAxis`；xAxis 设 `onZero: false` 使 X 轴落至 `yAxisMin`（整体曲线下方），不再贴 y=0。
- `computeYAxisRange` 底部 padding 由 2% 提升至约 8%（或按 layerSpacing 比例），使底层曲线与 X 轴之间有清晰间隔。
- 导出（PNG/PPTX）与持久化跟随分轴开关。

## Capabilities

### New Capabilities

- `grid-axis-toggle`：网格显隐 + X/Y 轴独立显隐（默认仅 X 轴）+ X 轴与曲线间距 + 持久化。

### Modified Capabilities

- `chart-image-export`：导出 SHALL 分别跟随 `showXAxis`/`showYAxis`（替代原单一 `showAxes`），避免移除 `showAxes` 后规范遗留对已删字段的引用。

## Impact

- `src/store/uiStore.ts` — 移除 `showAxes`，新增 `showXAxis`/`showYAxis` + 各自 toggle action。
- `src/components/chart/WaterfallChart.tsx` — xAxis/yAxis `show`/axisLine/axisTick/axisLabel 分旗读取；xAxis `onZero:false`；grid top/bottom 依显隐调整。
- `src/components/chart/computeYAxisRange.ts` — 底部 padding 提升（`rawDataMin - dataSpan*ratio`，ratio≈0.08）。
- `src/components/chart/exportImage.ts` / `exportPptx.ts` — 导出按分轴开关重建对应轴。
- `src/components/toolbar/Toolbar.tsx` — 拆为"X 轴"/"Y 轴"两个 toggle 按钮。
- `src/persistence/index.ts` — 持久化 `showXAxis`/`showYAxis`，兼容旧 `showAxes`。
- `openspec/specs/chart-image-export/spec.md` — 同步"导出跟随"需求为分轴开关（随归档 sync）。
