## Why

当前图例使用 `icon: 'line'` 仅显示线段，视觉效果单调。改用 `icon: 'inherit'` 并配合 `symbol: 'circle'` + `showSymbol: false`，可使图例同时展示线段和圆点，且 `itemStyle.color` 与 `lineStyle.color` 统一，圆点颜色不再突兀。曲线本身不渲染圆点。

## What Changes

- 图例 `icon` 从 `'line'` 改为 `'inherit'`，图例图标继承系列样式（线段 + 圆点）
- 系列 `symbol` 从 `'none'` 改为 `'circle'`，同时设置 `showSymbol: false` 确保曲线不渲染圆点
- 新增 `itemStyle.color` 与 `lineStyle.color` 一致，统一图例圆点和线段颜色
- 导出图片时图例同步使用 `icon: 'inherit'`

## Capabilities

### New Capabilities

- `legend-icon-inherit`: 图例图标使用 `icon: 'inherit'` 继承系列样式，同时展示线段和圆点，颜色统一

### Modified Capabilities

- `legend-display`: 图例 marker 从仅线段（`icon: 'line'`）改为线段+圆点（`icon: 'inherit'`），圆点颜色与线段颜色一致

## Impact

- `src/components/chart/WaterfallChart.tsx` — legend.icon、series.symbol、series.showSymbol、series.itemStyle
- `src/components/chart/exportImage.ts` — legend.icon