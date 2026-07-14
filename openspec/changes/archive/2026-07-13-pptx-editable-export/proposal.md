## Why

黄萍提出需要导出"可编辑图片"。当前 `exportImage.ts` 经 ECharts `getDataURL` 输出静态位图/SVG，无图层信息，导出后无法在 PPT 中逐曲线、逐标注编辑。`package.json` 无任何 PPTX 生成库。用户明确要求走"独立 shape"路线——导出内容在 PPT 中由可独立选中、移动、改色的 shape 重建，而非一张贴死的大图。

## What Changes

- 引入 `pptxgenjs` 依赖，新增 PPTX 导出器 `exportPptx.ts`。
- 导出时按图层将每条曲线、X/Y 坐标轴、刻度标签、点标签、区间标签（大括号）分别重建为独立的 PPT shape（折线、文本框、自选图形），使其在 PPT 中可逐项编辑（改文字、改色、移动、删除）。
- 工具栏"导出图片"扩展为支持 PNG / PPTX 两种格式（下拉或新增按钮"导出 PPTX"）。
- 坐标/像素换算复用现有 `convertXToPixel` / `yToPixel`，保证 PPTX 中位置与屏幕一致。
- 样式（曲线颜色、标签字号/字体/颜色）读取 store 现有值，与屏幕一致。

## Capabilities

### New Capabilities

- `export-pptx`：以独立 shape 重建图表到 PPTX，每个元素在 PPT 中可编辑；坐标轴跟随分轴显示开关（`showXAxis`/`showYAxis`，依赖 `split-axis-toggle-and-curve-gap`）。

### Modified Capabilities

- `chart-image-export`：新增"导出格式选择"需求（PNG / PPTX 两种格式），不修改既有"导出画面跟随分轴开关"需求（该需求由 `split-axis-toggle-and-curve-gap` 维护），避免两个变更对同一需求的修改冲突；PPTX 格式 SHALL 复用同一缩放视图与样式源。

## Impact

- `package.json` — 新增 `pptxgenjs` 依赖。
- `src/components/chart/exportPptx.ts`（新）— PPTX 重建器：曲线→折线 shape、轴→线 shape、刻度/标签→文本框、大括号→自选图形。
- `src/components/chart/exportImage.ts` — 抽出共享的视图/样式解析（缩放范围、可见曲线、标注列表）供 PNG 与 PPTX 复用。
- `src/components/toolbar/Toolbar.tsx` — 导出入口增加 PPTX 选项。
- 复用 `WaterfallChart` 的 `convertXToPixel` / `yPixelMath.ts` 的 `yToPixel`。
