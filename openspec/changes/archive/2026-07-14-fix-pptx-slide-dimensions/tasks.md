## 1. 修正幻灯片尺寸

- [x] 1.1 修改 `pixelToPpt.ts`:移除硬编码 `PPT_SLIDE_W`/`PPT_SLIDE_H`,改为 `getSlideDimensions(presLayout)` 从 pptxgenjs 实例的 `_presLayout` 读取实际尺寸
- [x] 1.2 更新 `pixelToPptX`/`pixelToPptY` 接收 `slideW`/`slideH` 参数(或通过 `getSlideDimensions` 返回的对象)
- [x] 1.3 更新 `exportPptx.ts` 中 `getSlideDimensions()` 调用,传入 `pptx._presLayout`
- [x] 2.1 在 `exportPptx.ts` 中计算统一缩放因子 `scale = Math.min(slideW / chartWidth, slideH / chartHeight)`
- [x] 2.2 计算图表实际 PPT 尺寸 `contentW = chartWidth * scale`, `contentH = chartHeight * scale`
- [x] 2.3 计算居中偏移 `offsetX = (slideW - contentW) / 2`, `offsetY = (slideH - contentH) / 2`
- [x] 2.4 更新 `addCustGeom` 的 `x`/`y`/`w`/`h` 为 `offsetX`/`offsetY`/`contentW`/`contentH`
- [x] 2.5 更新所有曲线 `points` 坐标换算: `x * scale + offsetX`, `y * scale + offsetY`
- [x] 2.6 更新所有 `addLine`/`addEllipse`/`addText` 坐标,在 `toX`/`toY` 基础上加上 `offsetX`/`offsetY`: `scale * (px / chartWidth) * slideW + offsetX`
- [x] 2.7 删除 `toX`/`toY`/`toW`/`toH` 中的 `pixelToPpt` 旧路径,统一使用 `scale` 换算
- [x] 3.1 `npx tsc --noEmit` 通过
- [x] 3.2 `npx vitest run` 通过
- [x] 3.3 `openspec validate fix-pptx-slide-dimensions --strict` 通过
- [x] 3.4 手动验证: PPTX 导出后内容不溢出、曲线比例与屏幕一致、居中显示