## 1. 实时图例样式

- [x] 1.1 `WaterfallChart.tsx` legend 配置加 `icon:'line'`、`itemWidth:20`、`itemHeight:2`，验证线段颜色与曲线一致、无圆点
- [x] 1.2 回归单曲线不显示图例逻辑不受影响

## 2. 导出含图例开关

- [x] 2.1 `uiStore` 新增 `exportWithLegend: boolean`（默认 false）+ setter
- [x] 2.2 `persistence/index.ts` 持久化 `exportWithLegend`，纳入 workspace JSON
- [x] 2.3 `exportImage.ts` 导出按开关决定 `legend.show`，开启时同步 `icon:'line'` 与曲线色
- [x] 2.4 `Toolbar.tsx` 导出入口加"含图例"勾选项
- [~] 3.1 `exportPptx.ts` 在 `exportWithLegend` 开启时以独立文本框+线段 shape 重建图例

## 4. 验证与回归

- [x] 4.1 `npx tsc --noEmit` 干净
- [x] 4.2 `npx vitest run` 全绿
- [x] 4.3 `npm run build` 成功
- [ ] 4.4 人工回归：多曲线图例为线段无圆点、颜色与曲线一致；默认导出无图例；开启后导出含图例；刷新保留开关
