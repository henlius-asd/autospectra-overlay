## Context

当前图例使用 `icon: 'line'` 仅渲染线段，系列 `symbol: 'none'` 不渲染数据点标记。ECharts 的 `icon: 'inherit'` 可从系列继承样式，同时展示线段和符号形状。

## Goals / Non-Goals

**Goals:**
- 图例展示线段 + 圆点的组合图标，颜色统一
- 曲线本身不渲染圆点（`showSymbol: false`）
- 导出图片时图例同步使用 `icon: 'inherit'`

**Non-Goals:**
- 不改变图例开关/持久化逻辑
- 不改变 PPTX 手动绘制图例（PPTX 不走 ECharts legend）

## Decisions

1. **`symbol: 'circle'` + `showSymbol: false`**  
   `symbol` 定义为 `'circle'` 供 legend 使用，`showSymbol: false` 阻止曲线渲染圆点。  
   *替代方案*: 仅改 `icon: 'inherit'` 不改 `symbol` → 图例不显示圆点，无法展示统一的点线组合。

2. **`itemStyle.color` 与 `lineStyle.color` 一致**  
   图例圆点颜色由 `itemStyle` 派生，显式设置与 `lineStyle` 相同的 `curve.color`，避免 ECharts 默认序列色板与曲线颜色不一致。

3. **`icon: 'inherit'` 而非 `icon: 'roundRect'`**  
   `'inherit'` 继承系列完整样式（线型 + 符号），比单独指定圆角矩形更准确地反映曲线外观。

## Risks / Trade-offs

- [Risk] `symbol: 'circle'` 使系列对象携带符号定义，若 `showSymbol` 被意外覆盖可能显示圆点 → 依赖 `showSymbol: false` 始终生效，风险低
- [Risk] 大数据量下 `icon: 'inherit'` 图例渲染略微增加像素 → 图例仅渲染少量项，可忽略