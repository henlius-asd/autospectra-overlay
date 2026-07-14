## Context

当前点标签 `fontSize={10}`、区间标签 `fontSize={11}` 在 Overlay 组件与 `exportImage.ts` 中硬编码，无用户配置入口。`uiStore` 仅有 `showGrid`/`showAxes` 等布尔状态，无样式状态。标签数据（点标签、区间标签）已存于 curveStore 并参与 zundo undo/redo。

## Goals / Non-Goals

**Goals:**
- 工具栏提供独立、完整的标签样式编辑面板（字号、字体、字重、文字色、背景色）。
- 一套样式同时驱动点标签与区间标签，屏幕渲染与导出一致。
- 支持默认样式 + 单标签覆盖两层；纳入 undo/redo 与持久化。

**Non-Goals:**
- 不做富文本/多行格式、不做字号自动避让算法。
- 不调整标签的位置交互逻辑（已有拖拽能力）。

## Decisions

### D1: 默认样式存 uiStore，单标签覆盖存标签数据

`uiStore.labelStyle` 作为全局默认；每条标签数据新增可选 `labelStyle?: Partial<LabelStyle>` 字段，渲染时合并 `{ ...default, ...override }`。导出 workspace 时两者分别随 uiSnapshot / 标签数据序列化。

**理由**：默认样式跨标签共享应放 UI 层；单标签覆盖是数据属性，随标签走 undo/redo 与 curveStore 持久化，语义清晰。

### D2: 工具栏单一"标签样式"入口，随选中态切换作用域

无选中标签时面板编辑默认样式；选中标签时面板编辑该标签覆盖。不拆成两个按钮，减少工具栏拥挤。

**理由**：点标签与区间标签共用一套样式能力，单一入口更"独立完善"且学习成本低。

### D3: 渲染与导出共用一个 `resolveLabelStyle(label)` 工具函数

`PointLabelOverlay`、`BraceOverlay`、`exportImage.ts` 均调用同一 resolver，避免字号在不同路径产生分歧（即 #4 类颜色不一致问题在字号上重演）。

## Risks / Trade-offs

- [工具栏按钮增多] → "标签样式"与现有"点标签/区间标签"按钮并列，可接受；后续可分组收纳。
- [旧工作区无 labelStyle 字段] → resolver 回退到内置默认，向后兼容。
- [字号过大导致标签重叠] → 非本变更目标，后续可加避让；当前由用户自行调整。
- [区间标签字号 11→10 统一] → 设计 D1/D3 采用单一共享 `labelStyle`，故内置默认统一为 10（与点标签一致）。区间标签当前硬编码 11px 将变为 10px（用户可经新面板调回任意值，这正是本变更目的）。已在 brace-tool spec 标注统一后的默认值。
