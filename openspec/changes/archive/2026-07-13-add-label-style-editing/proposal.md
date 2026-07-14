## Why

点标签与区间标签（大括号）的文字样式（字号、字体、字重、颜色、背景）当前全部硬编码：`PointLabelOverlay.tsx` `fontSize={10}`、`BraceOverlay.tsx` `fontSize={11}`、`exportImage.ts` 同样写死 10/11px。用户（黄萍）提出标签字体大小需要可调整，且希望有一套独立、完整的标签编辑能力放在工具栏中，而非散落在各处。

## What Changes

- 在 uiStore 新增 `labelStyle` 默认样式状态（字号、字体、字重、文字颜色、背景色），并持久化到 IndexedDB / workspace JSON。
- 在工具栏新增"标签样式"编辑入口（按钮 + 浮层面板），集中调整默认标签样式；选中某个标签时可对该标签单独覆盖样式。
- 点标签、区间标签的渲染（Overlay SVG）与导出（`exportImage.ts`）SHALL 读取样式值替代硬编码。
- 样式变更纳入 zundo undo/redo。

## Capabilities

### Modified Capabilities

- `point-label-tool`：点标签渲染 SHALL 读取 `labelStyle`（含字号、字体、字重、文字色、背景色）；新增"标签样式编辑"能力（工具栏入口、默认样式、单标签覆盖、持久化、undo）。
- `brace-tool`：区间标签文字渲染 SHALL 读取 `labelStyle`；样式编辑与点标签共用同一套能力。

## Impact

- `src/store/uiStore.ts` — 新增 `labelStyle` 状态、setters、toggle action。
- `src/components/toolbar/Toolbar.tsx` — 新增"标签样式"按钮 + `LabelStylePanel` 浮层。
- `src/components/toolbar/LabelStylePanel.tsx`（新）— 字号滑块、字体下拉、字重 toggle、颜色拾取器。
- `src/components/chart/PointLabelOverlay.tsx` — 渲染读取 `labelStyle`，单标签覆盖优先于默认。
- `src/components/chart/BraceOverlay.tsx` — 同上。
- `src/components/chart/exportImage.ts` — 导出时读取 `labelStyle` 写入 font-size/font-family/color。
- `src/persistence/index.ts` — `labelStyle` 纳入 uiSnapshot 持久化与恢复。
- `src/types/curve.ts` / 标签类型 — 新增可选 `labelStyle` 覆盖字段。
