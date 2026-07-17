## 1. 图例图标继承

- [x] 1.1 WaterfallChart.tsx 图例 `icon` 从 `'line'` 改为 `'inherit'`
- [x] 1.2 exportImage.ts 导出图例 `icon` 同步改为 `'inherit'`

## 2. 系列符号与颜色统一

- [x] 2.1 WaterfallChart.tsx 系列 `symbol` 从 `'none'` 改为 `'circle'`
- [x] 2.2 新增 `showSymbol: false` 确保曲线不渲染圆点
- [x] 2.3 新增 `itemStyle: { color: curve.color }` 与 `lineStyle.color` 统一