## 1. 标签文字文本框宽度

- [x] 1.1 新增 `ptToInch(pt: number): number` helper: `pt / 72`
- [x] 1.2 大括号标签 `addText` 的 w/h 改为: `w = ptToInch(labelText.length * style.fontSize * 0.55)`, `h = ptToInch(style.fontSize * 1.5)`
- [x] 1.3 点标签 `addText` 的 w/h 同上,用 `pl.labelStyle` 或 `labelStyle` 的字号
- [x] 2.1 X 轴名 "时间" 的 w 改为 `ptToInch(2 * 10 * 0.55)`, h 改为 `ptToInch(14)`
- [x] 2.2 Y 轴名 "强度" 的 w 改为 `ptToInch(2 * 10 * 0.55)`, h 改为 `ptToInch(20)`
- [x] 2.3 X 轴刻度标签 w 改为 `ptToInch(6 * 8 * 0.55)`, h 改为 `ptToInch(10)`
- [x] 2.4 Y 轴刻度标签 w 改为 `ptToInch(8 * 8 * 0.55)`, h 改为 `ptToInch(12)`
- [x] 2.5 图例文字 w 改为 `ptToInch(maxNameLen * 8 * 0.55)`, h 改为 `ptToInch(10)`
- [x] 3.1 `npx tsc --noEmit` 通过
- [x] 3.2 `npx vitest run` 通过
- [x] 3.3 `openspec validate fix-pptx-text-box-width --strict` 通过
- [ ] 3.4 手动验证: PPTX 导出后中文标签横向排列、图例完整显示、轴名不截断