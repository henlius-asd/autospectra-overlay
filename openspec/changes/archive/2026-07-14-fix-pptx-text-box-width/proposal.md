## Why

PPTX 导出中文本框的宽度(w)通过 `toPptW(pixelWidth) = pixelWidth * scale` 从像素宽度换算,但 PPT 字号 `fontSize` 不随 `scale` 同步缩放。当 `scale × 72 < 1`(图表宽度 > 720px 时几乎总是成立),文本框宽度仅为文字实际所需宽度的 40%–60%,导致中文字符竖向堆叠、英文单词换行。

## What Changes

- **文本框尺寸从 PPT 字号直接计算**:文本框的 w/h 不再经过 `toPptW`/`toPptH` 缩放,改为从 `fontSize` 直接换算英寸:`w = label.length × fontSize × 0.55 / 72`,`h = fontSize × 1.5 / 72`。
- **固定像素宽度文本框**:轴名(40px)、刻度(30px)、图例(60px)等固定像素宽度改为从字号直接计算所需宽度。
- **文本框位置保持缩放**:x/y 坐标仍使用 `toPptX`/`toPptY` 定位。

## Capabilities

### Modified Capabilities
- `export-pptx`:文本框宽度计算规范(尺寸从字号换算式,位置从像素缩放)。

## Impact

- **代码**:`src/components/chart/exportPptx.ts`(所有 `addText` 的 w/h 参数)。
- **spec**:`openspec/specs/export-pptx/spec.md` delta 补充文本框尺寸计算条款。
- **依赖**:无需新增。