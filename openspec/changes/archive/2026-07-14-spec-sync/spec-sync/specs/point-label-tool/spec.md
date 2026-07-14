# point-label-tool Delta Specification

## MODIFIED Requirements

### Requirement: 点标签渲染

点标签 SHALL 仅渲染文字，SHALL NOT 渲染外框矩形、对齐原点圆点或连接虚线。屏幕端渲染与导出端渲染 SHALL 一致。字号、字体、字重、文字颜色 SHALL 取自 `uiStore.labelStyle` 默认值，回退到内置默认（字号 10）。SHALL NOT 使用硬编码字号。

#### Scenario: 标签视觉样式

- **WHEN** 一个点标签被创建并显示在图表上
- **THEN** 标签仅渲染 `<text>` 元素，不出现 `<rect>` 外框、`<circle>` 原点或 `<line>` 连接线；字号/字体/字重/颜色取自当前 `labelStyle`

#### Scenario: 调整默认字号后实时更新

- **WHEN** 用户在工具栏"标签样式"面板将默认字号从 10 改为 14
- **THEN** 所有点标签立即以 14px 重渲染

### Requirement: 标签样式编辑

系统 SHALL 在工具栏提供"标签样式"按钮，点击后弹出样式编辑面板，支持调整默认标签样式：字号（范围 6–28）、字体、字重（常规/加粗）、文字颜色、背景色。该面板 SHALL 仅编辑全局默认 `LabelStyle` 存储在 `uiStore` 中，不支持编辑单个标签的样式覆盖。样式变更 SHALL NOT 纳入 zundo undo/redo。

#### Scenario: 打开样式编辑面板

- **WHEN** 用户点击工具栏"标签样式"按钮
- **THEN** 弹出样式面板，显示当前默认字号/字体/字重/颜色，可调整

#### Scenario: 调整默认字号后实时更新

- **WHEN** 用户在样式面板调整字号从 10 改为 14
- **THEN** 所有点标签立即以 14px 重渲染

### Requirement: 标签样式持久化

默认 `labelStyle` SHALL 存储在 uiStore 中，通过 localForage 持久化到 IndexedDB，并纳入 workspace JSON 导入/导出。单标签无样式覆盖，无需持久化单标签样式。

#### Scenario: 刷新后样式保留

- **WHEN** 用户将默认字号改为 16 后刷新页面
- **THEN** 默认字号仍为 16

#### Scenario: 旧工作区导入兼容

- **WHEN** 导入不含 `labelStyle` 字段的旧工作区 JSON
- **THEN** 使用内置默认样式，无报错

## REMOVED Requirements

### Requirement: 点标签无装饰外框 (removed — superseded by MODIFIED Requirement `点标签渲染`)

**Reason:** This requirement's content (no frame/origin-dot/dashed-line) is now merged into the MODIFIED `点标签渲染` requirement, which is the single source of truth for the rendering specification. The two requirements contradicted each other; the "无装饰外框" content is preserved in the revised `点标签渲染`.

**Migration:** All references to "no frame/origin-dot/dashed-line" requirements SHOULD use the revised `点标签渲染` requirement instead.