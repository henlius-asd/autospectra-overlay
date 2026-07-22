## Why

当前曲线线条样式在 `WaterfallChart.tsx` 中写死：`lineStyle.width: 1.5`、`smooth: false`、`symbol: 'circle'`、`showSymbol: false`，仅颜色来自 `CurveData.color`（且 `addCurves` 强制设为 `#000000`）。用户无法统一或单独调整曲线粗细、线型，也无法让全局默认颜色真正生效（每条曲线都已有明确颜色）。色谱叠图场景下，不同曲线常需用不同粗细/线型（实/虚/点）区分通道，而当前只能靠颜色区分。

## What Changes

- **新增「曲线样式」级联系统**：全局默认 `LineStyle`（粗细/线型/颜色）+ 每条曲线按字段覆盖；渲染时按字段合并（覆盖优先，未覆盖字段回落全局）。
- **数据模型迁移**：`CurveData.color`（顶层）→ `CurveData.lineStyle?: Partial<{width,type,color}>`（统一覆盖对象）；`addCurves` 不再强制 `color:'#000000'`，新曲线走全局默认；持久化快照 version 2→3 迁移。
- **全局默认归属 uiStore**：镜像 `LabelStyle` 机制，进 UI 快照持久化，不纳入 zundo 撤销；每条覆盖在 curveStore 上，随 zundo 自动可撤销。
- **工具箱新增「曲线样式」面板**：顶部全局控件（粗细 slider / 线型 3 按钮 / 颜色），下方复用 `selectedCurveId` 的「当前选中曲线覆盖」子区，每字段「使用全局默认」开关 + 「重置为全局」按钮。Accordion 位置插在「标签样式」之后。
- **左侧 CurveList 色点保留**：重指向写 `lineStyle.color`，作为快速调色入口。
- **PPTX 导出同步**：`addCustGeom` 与 legend `addLine` 接收级联解析后的 width/type/color；dash 映射 solid→省略 / dashed→`dash` / dotted→`dot`。

## Capabilities

### New Capabilities
- `curve-line-style`: 级联式曲线线条样式系统（全局默认 + 每条覆盖），覆盖粗细、线型、颜色三项

### Modified Capabilities
- `three-column-layout`: 右栏工具箱内容新增「曲线样式」面板（位于「标签样式」之后）
- `export-pptx`: PPTX 曲线折线 shape 与图例 SHALL 读取级联解析后的粗细/线型/颜色
- `workspace-persistence`: 持久化快照 version 升级至 3，迁移旧 `CurveData.color` → `lineStyle.color`；UI 快照新增 `lineStyle`
- `color-panel`: 颜色面板确认时写入 `CurveData.lineStyle.color`（颜色覆盖字段），不再写顶层 `color`

## Impact

- `src/types/curve.ts` — 新增 `LineStyle`/`DEFAULT_LINE_STYLE`/`LineType`；`CurveData` 删 `color` 加 `lineStyle`
- `src/types/index.ts` — re-export 新类型
- `src/components/chart/resolveLineStyle.ts`（新建）— 级联解析 + PPTX dash 映射
- `src/store/uiStore.ts` — `lineStyle` 状态 + `setLineStyle` action
- `src/store/curveStore.ts` — `setCurveLineStyle`/`clearCurveLineStyle`；`addCurves` 去除 `color:'#000000'`；移除 `setCurveColor`
- `src/components/chart/WaterfallChart.tsx` — series.map 用 `resolveLineStyle`；deps 增 `lineStyle`
- `src/components/toolbox/CurveStylePanel.tsx`（新建）— 全局控件 + 选中曲线覆盖子区
- `src/components/layout/RightPanel.tsx` — Accordion 插入曲线样式；折叠态加 `CurveStyleIcon` 快捷入口
- `src/components/ui/icons.tsx` — 新增 `CurveStyleIcon`
- `src/components/data/CurveList.tsx` — 色点重指向 `setCurveLineStyle`
- `src/components/chart/exportPptx.ts` — `addCustGeom` 加 dashType 参数；读全局 `lineStyle` 解析覆盖；legend width 跟随
- `src/persistence/index.ts` — v2→3 迁移；UI 快照 `lineStyle` 往返；subscribe diff 增 `lineStyle`
- 测试：新建 `resolveLineStyle.test.ts`；补 `curveStore.test.ts`、`persistence` 测试；修 `curveScaleMath.test.ts` 等旧 `color` 引用
