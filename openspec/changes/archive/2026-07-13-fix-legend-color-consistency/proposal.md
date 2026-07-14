## Why

张嫱提出左栏数据区曲线旁的原点颜色、图例上的圆点与线条颜色三者不一致，且历史遗留使导出图当前完全不显示图例。现有 `WaterfallChart` 的 legend 配置未设 `icon`/`itemStyle`，使用 ECharts 默认图例（line 系列默认带圆点图标），与曲线线条颜色不统一；`exportImage.ts` 直接 `legend:{show:false}` 隐藏图例。诉求：统一颜色表示、删除图例圆圈只保留线条颜色，并让导出图可选地包含图例。

## What Changes

- 实时图例 `legend.icon` 设为 `'line'`（仅线段、无圆点），并使图例线段颜色与各曲线 `lineStyle.color`（`curve.color`）一致。
- 提供"导出含图例"开关（uiStore `exportWithLegend`，默认关闭以保持现状），PNG 导出与 PPTX 导出均遵循。
- 图例显隐保持现有"仅多条曲线时显示"逻辑不变。

## Capabilities

### New Capabilities

- `legend-display`：图例仅以线条颜色表示（无圆点）；颜色与曲线一致；导出可选含图例。

## Impact

- `src/components/chart/WaterfallChart.tsx` — legend 配置加 `icon:'line'`、`itemWidth`/`itemHeight`，确保颜色取曲线色。
- `src/components/chart/exportImage.ts` — 导出按 `exportWithLegend` 决定 `legend.show`，开启时同步 `icon:'line'` 与曲线色。
- `src/store/uiStore.ts` — 新增 `exportWithLegend: boolean`（默认 false）。
- `src/components/toolbar/Toolbar.tsx` — 导出入口增加"含图例"勾选项。
- `src/persistence/index.ts` — `exportWithLegend` 持久化。
