## Context

`WaterfallChart.tsx:237-241` legend 仅设 `show/top/type`，未设 `icon`/`itemStyle`，ECharts line 系列默认图例带圆点图标且 marker 颜色可能与线条不一致。`exportImage.ts:72` 直接 `legend:{show:false}`。无独立图例规范能力。

## Goals / Non-Goals

**Goals:**
- 图例去除圆点，仅以线段颜色表示，与曲线颜色一致。
- 导出可选含图例（默认保持现状不含图例）。
- 开关持久化。

**Non-Goals:**
- 不改图例位置/排版（保持 `top:8, type:'scroll'`）。
- 不改"单曲线不显示图例"逻辑。

## Decisions

### D1: `legend.icon = 'line'` + `itemHeight` 小值去圆点

设 `icon:'line'`、`itemWidth:20`、`itemHeight:2`，使 marker 为细横线段；颜色继承 series lineStyle.color（即 `curve.color`），天然一致，无需逐项设 `itemStyle.color`。

**理由**：`icon:'line'` 是 ECharts 原生"仅线段"图例样式，最直接满足"删圆圈只体现线条颜色"。

### D2: 导出开关默认关闭

`exportWithLegend` 默认 `false`，保持现有导出无图例的现状，避免破坏已发布行为；需要图例的用户显式开启。

### D3: PNG 与 PPTX 共用开关

`exportImage.ts` 与 `exportPptx.ts` 均读 `exportWithLegend`；PPTX 含图例时以独立文本框/线段 shape 重建图例（仍走独立 shape 路线）。

## Risks / Trade-offs

- [部分用户依赖旧的无图例导出] → 默认关闭，行为不变。
- [图例线段过细在某些显示器不明显] → `itemHeight:2` 可调；非阻断。
