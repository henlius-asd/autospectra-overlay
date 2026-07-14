## 1. 状态拆分

- [x] 1.1 `uiStore` 新增 `showXAxis: true`、`showYAxis: false` + `toggleShowXAxis`/`toggleShowYAxis`，移除/弃用 `showAxes`
- [x] 1.2 `persistence/index.ts` 持久化 `showXAxis`/`showYAxis`；导入旧 `showAxes` 映射为两轴同值，无报错
- [x] 1.3 兼容现有读 `showAxes` 处临时派生或逐处替换为分旗

## 2. 渲染分旗与间距

- [x] 2.1 `WaterfallChart.tsx` xAxis 读 `showXAxis`、yAxis 读 `showYAxis`；axisLine/axisTick/axisLabel/name 各自分旗
- [x] 2.2 xAxis 设 `onZero:false`；grid.top/bottom 依显隐自适应
- [x] 2.3 `computeYAxisRange.ts` 底部 padding 由 `0.02` 提升至 `0.08`（或 layerSpacing 自适应）
- [x] 2.4 回归：含负值数据时轴仍在曲线下方、间隔存在

## 3. 工具栏与导出

- [x] 3.1 `Toolbar.tsx` 将"坐标轴"按钮拆为"X 轴"、"Y 轴"两个 toggle
- [x] 3.2 `exportImage.ts` 按 `showXAxis`/`showYAxis` 重建对应轴（`exportPptx.ts` 待 #3 实现）

## 4. 验证与回归

- [x] 4.1 `npx tsc --noEmit` 干净
- [x] 4.2 `npx vitest run` 全绿（更新 computeYAxisRange 相关测试）
- [x] 4.3 `npm run build` 成功
- [ ] 4.4 人工回归：默认仅 X 轴、底层曲线与轴有间隔；独立切换 X/Y；导出跟随；刷新保留；旧 workspace 含 showAxes 兼容