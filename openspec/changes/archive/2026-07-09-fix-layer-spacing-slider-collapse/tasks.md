## 1. 修复滑块高度塌缩

- [x] 1.1 在 `src/components/chart/WaterfallChart.tsx` 中，为滑块包裹层 div（`absolute top-1/2 right-1 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-none`）添加 `h-3/5` class
- [x] 1.2 将同一处 `<input class="layer-slider h-3/5 w-3 pointer-events-auto">` 的 `h-3/5` 改为 `flex-1`（保留 `w-3 pointer-events-auto`）

## 2. 验证

- [x] 2.1 运行 `npm run build`（含 `tsc --noEmit`）确认无类型/编译错误
- [x] 2.2 在浏览器中复现原操作路径（导入数据 → 调整颜色 → 拖动滑块），确认滑块轨道可见、可拖动到 0.15 等中间值
- [x] 2.3 用 DevTools 选中 `<input class="layer-slider">`，确认 Computed `height` 为非零值（远大于 14px）
- [x] 2.4 确认滑块在最右侧不与 BraceOverlay / PointLabelOverlay 产生视觉或交互冲突
