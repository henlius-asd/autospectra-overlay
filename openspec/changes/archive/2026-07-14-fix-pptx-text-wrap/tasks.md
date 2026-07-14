## 1. 修改 `wrap` 和 `fit` 属性

- [x] 1.1 X 轴名 "时间" 的 `addText`: `wrap: true, fit: 'resize'` → `wrap: false`
- [x] 1.2 X 轴刻度标签的 `addText`: `wrap: true, fit: 'resize'` → `wrap: false`
- [x] 1.3 Y 轴名 "强度" 的 `addText`: `wrap: true, fit: 'resize'` → `wrap: false`
- [x] 1.4 Y 轴刻度标签的 `addText`: `wrap: true, fit: 'resize'` → `wrap: false`
- [x] 1.5 大括号标签的 `addText`: `wrap: true, fit: 'resize'` → `wrap: false`
- [x] 1.6 点标签的 `addText`: `wrap: true, fit: 'resize'` → `wrap: false`
- [x] 1.7 图例文字的 `addText`: `wrap: true, fit: 'resize'` → `wrap: false`
- [x] 2.1 `npx tsc --noEmit` 通过
- [x] 2.2 `npx vitest run` 通过
- [x] 2.3 `openspec validate fix-pptx-text-wrap --strict` 通过
- [x] 2.4 手动验证: PPTX 导出后所有文字横向单行排列,无换行/堆叠