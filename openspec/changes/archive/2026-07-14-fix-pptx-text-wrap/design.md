## Context

`exportPptx.ts` 中所有 `addText` 均设为 `wrap: true, fit: 'resize'`。pptxgenjs 源码中 `wrap: true` → `wrap="square"` 使文字在框内换行;`fit: 'resize'` → `<a:spAutoFit/>` 仅在 PowerPoint 运行时把框变高容纳多行。两者组合导致文字换行后竖向堆叠,CJK 宽度估算即使准确也无法阻止换行。

## Goals / Non-Goals

**Goals:**
- 所有文本框文字保持单行,不换行、不堆叠

**Non-Goals:**
- 不改变文本框宽度/高度估算逻辑
- 不改变其他渲染逻辑

## Decisions

### D1: `wrap: false` 禁止换行

pptxgenjs 中 `wrap: false` 生成 `wrap="none"`,文字不换行,横向溢出(可见,不裁剪)。CJK 宽度估算提供合理初始框宽,`wrap: false` 保证即使估算偏窄也不换行。

**替代方案**: 调大宽度估算系数。否决: 无法 100% 准确,且不同字体/字号下字符宽度有差异,`wrap: false` 是最可靠的兜底。

### D2: 移除 `fit: 'resize'`

`wrap: false` 下无换行,`fit: 'resize'` 不会触发任何效果。移除该属性,保持代码简洁。

## Risks / Trade-offs

- [文字溢出文本框可能与其他元素重叠] → 可接受,文本框无边框/背景,溢出不可见;CJK 宽度估算已提供足够宽的框