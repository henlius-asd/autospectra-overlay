## Why

`pixelToPpt.ts` 写死幻灯片高度 `PPT_SLIDE_H = 7.5`（4:3），但 pptxgenjs 默认布局为 `screen16x9`（10 × 5.625 英寸）。Y 坐标映射到 0–7.5 英寸，实际幻灯片仅 5.625 英寸，底部 1/3 内容溢出画布。同时 X/Y 独立缩放导致纵横比变形，曲线与屏幕渲染比例不一致。

## What Changes

- **修正幻灯片尺寸**:`pixelToPpt.ts` 的 `PPT_SLIDE_H` 从 7.5 改为 5.625，或从 pptxgenjs 实例动态读取实际的 `_presLayout` 尺寸。
- **统一纵横比缩放**:X/Y 使用相同的 `in/px` 比例（取 `min(PPT_SLIDE_W / chartWidth, PPT_SLIDE_H / chartHeight)`），保持图表原始纵横比不变形，内容在幻灯片中居中。
- **居中偏移**:计算 X/Y 居中偏移量，所有坐标加上偏移，使图表在幻灯片中居中显示而非贴边。
- **形状边界框**:`addCustGeom` 的 `w`/`h` 改为实际图表的 PPT 尺寸（非全幻灯片），避免空白的形状区域。

## Capabilities

### Modified Capabilities
- `export-pptx`:幻灯片尺寸与纵横比保持要求（SHALL 使用 pptxgenjs 默认 16:9 尺寸、SHALL 保持图表原始纵横比、SHALL 居中显示）。

## Impact

- **代码**:`src/components/chart/pixelToPpt.ts`（常量修正）、`src/components/chart/exportPptx.ts`（统一缩放 + 居中 + 形状边界框修正）。
- **spec**:`openspec/specs/export-pptx/spec.md` delta 补充幻灯片尺寸与纵横比条款。
- **依赖**:无需新增。
- **测试**:验证 PPTX 导出后内容不溢出画布、曲线比例与屏幕一致、居中显示。