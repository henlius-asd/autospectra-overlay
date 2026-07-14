## 1. 依赖与共享上下文

- [x] 1.1 `npm i pptxgenjs`，确认类型可用
- [~] 1.2 从 `exportImage.ts` 抽出 `resolveExportContext()`（暂不抽取——`exportPptx.ts` 直接读 store，共享上下文后续优化）
- [x] 1.3 新增 `src/components/chart/pixelToPpt.ts`：像素→PPT inches 换算

## 2. PPTX 重建器

- [x] 2.1 新增 `src/components/chart/exportPptx.ts`，动态 import pptxgenjs，创建 slide
- [x] 2.2 曲线→折线 shape（按 visibleYRange 裁剪、采样降采 200 点），颜色取 curve.color
- [x] 2.3 X/Y 坐标轴→主线 shape（跟随分轴开关 `showXAxis`/`showYAxis`）
- [x] 2.4 刻度标签、轴名称→独立文本框
- [x] 2.5 点标签→"文本框 + 竖线 + 圆点"一组 shape，样式取 `resolveLabelStyle`
- [x] 2.6 区间标签（大括号）→线段 + 文本框一组 shape

## 3. 导出入口

- [x] 3.1 `Toolbar.tsx` 新增"导出 PPTX"按钮
- [x] 3.2 PPTX 触发懒加载 `exportPptx`，生成 Blob 并下载 .pptx（确认独立 chunk 372KB）

## 4. 验证与回归

- [x] 4.1 `npx tsc --noEmit` 干净
- [x] 4.2 `npx vitest run` 全绿
- [x] 4.3 `npm run build` 成功（确认 pptxgenjs 懒加载分包）
- [ ] 4.4 人工回归：PPTX 在 PowerPoint 中每元素可独立选中/改色/改字/删除；视图与屏幕一致；导出后屏幕状态未变；曲线颜色、标签样式一致