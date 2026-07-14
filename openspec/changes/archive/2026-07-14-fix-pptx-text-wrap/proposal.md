## Why

`fix-pptx-text-box-width` 中所有 `addText` 误设为 `wrap: true` + `fit: 'resize'`。pptxgenjs 的 `wrap: true` 生成 `wrap="square"` 使文字在框内换行,`fit: 'resize'` 生成 `<a:spAutoFit/>` 仅让 PowerPoint 运行时把框变高容纳多行,不变宽。结果文字仍换行竖向堆叠。需改为 `wrap: false` (`wrap="none"`) 禁止换行,文字保持单行横向溢出。

## What Changes

- 所有 `addText` 调用中将 `wrap: true` 改为 `wrap: false`
- 移除 `fit: 'resize'`(不再需要,`wrap: false` 下无换行可触发 resize)

## Capabilities

### Modified Capabilities
- `export-pptx`:文本框换行行为规范(SHALL NOT 换行,SHALL 设为 `wrap: false`)。

## Impact

- **代码**:`src/components/chart/exportPptx.ts` 中 7 处 `addText` 的 `wrap`/`fit` 属性。
- **spec**:`openspec/specs/export-pptx/spec.md` delta 补充 `wrap: false` 条款。