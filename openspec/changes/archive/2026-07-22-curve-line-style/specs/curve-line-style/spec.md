## ADDED Requirements

### Requirement: 曲线线条样式级联模型

系统 SHALL 采用级联模型解析每条曲线的线条样式：全局默认 `LineStyle`（`width`/`type`/`color`）存放于 `uiStore`，每条曲线可持有 `CurveData.lineStyle?: Partial<LineStyle>` 覆盖对象。渲染时 SHALL 通过纯函数 `resolveLineStyle(override, defaultStyle)` 按字段合并——覆盖对象中存在的字段优先，缺失字段回落全局默认。`addCurves` 创建新曲线时 SHALL NOT 设置 `lineStyle` 或顶层 `color`，使新曲线完全走全局默认。

#### Scenario: 全局改粗细对所有曲线生效

- **WHEN** 用户在「曲线样式」面板将全局粗细从 1.5 改为 3
- **THEN** 所有未覆盖粗细的曲线渲染粗细变为 3；覆盖了粗细的曲线保持其覆盖值

#### Scenario: 单曲线覆盖粗细不影响其他曲线

- **WHEN** 用户选中曲线 A 并取消勾选「使用全局默认·粗细」，设为 2
- **THEN** 仅曲线 A 渲染粗细为 2，其他曲线仍为全局默认值

#### Scenario: 新建曲线走全局默认

- **WHEN** 用户导入新曲线（全局默认颜色为 `#000000`、粗细 1.5、线型 solid）
- **THEN** 新曲线渲染为黑色、粗细 1.5、实线，无单独覆盖对象

### Requirement: 线型可选集合

线型 `type` 字段 SHALL 仅支持三个枚举值：`solid`（实线）、`dashed`（虚线）、`dotted`（点线）。SHALL NOT 支持 dashdot 等数组型自定义线型。默认值为 `solid`。

#### Scenario: 切换线型为虚线

- **WHEN** 用户将某曲线线型覆盖为 `dashed`
- **THEN** 该曲线渲染为虚线

#### Scenario: 线型回落全局

- **WHEN** 某曲线未覆盖线型，全局线型为 `dotted`
- **THEN** 该曲线渲染为点线

### Requirement: 全局默认样式存储于 uiStore

全局默认 `LineStyle` SHALL 存储于 `uiStore`（与 `LabelStyle` 并列），由 `setLineStyle(patch)` 按 patch 合并更新。SHALL 纳入 UI 快照持久化（IndexedDB + JSON）。SHALL NOT 纳入 zundo 撤销/重做历史（与 `LabelStyle` 一致）。

#### Scenario: 刷新后恢复全局线条样式

- **WHEN** 用户将全局粗细设为 2.5、线型虚线后刷新页面
- **THEN** 刷新后全局粗细为 2.5、线型为虚线

#### Scenario: 全局线条样式不被撤销

- **WHEN** 用户改全局粗细后按撤销
- **THEN** 全局粗细不被撤销回退（与标签样式行为一致）

### Requirement: 每条覆盖存储与可撤销

每条曲线的覆盖对象 `CurveData.lineStyle` SHALL 存储于 `curveStore`，通过 `setCurveLineStyle(id, patch)` 按 patch 合并、`clearCurveLineStyle(id)` 整体删除。覆盖变更 SHALL 纳入 zundo 撤销/重做历史。

#### Scenario: 撤销单曲线覆盖

- **WHEN** 用户为曲线 A 设置粗细覆盖后按撤销
- **THEN** 曲线 A 的粗细覆盖被回退

#### Scenario: 重置为全局

- **WHEN** 用户点击某曲线的「重置为全局」按钮
- **THEN** 该曲线的 `lineStyle` 覆盖对象被整体删除，所有字段回落全局默认

### Requirement: 工具箱曲线样式面板交互

「曲线样式」面板 SHALL 位于右侧工具箱 Accordion 的「标签样式」之后。面板顶部为全局默认控件：粗细 slider（范围 0.5–6，步长 0.5）、线型 3 按钮（实/虚/点）、颜色（内联 color input + 历史色块）。面板下方为「当前选中曲线覆盖」子区，复用 `selectedCurveId`：无选中时显示「点击曲线以编辑单条覆盖」提示；有选中时为粗细/线型/颜色每字段一行「使用全局默认」复选框——勾选表示该字段不覆盖（覆盖对象中存在则删除该字段），取消勾选表示覆盖（以当前全局值为初值，无视觉跳跃）。子区底部 SHALL 有「重置为全局」按钮。

#### Scenario: 折叠态快捷入口

- **WHEN** 右栏折叠时用户点击「曲线样式」图标
- **THEN** 右栏展开并滚动到「曲线样式」面板

#### Scenario: 无选中曲线时提示

- **WHEN** 未选中任何曲线时展开「曲线样式」面板
- **THEN** 覆盖子区显示「点击曲线以编辑单条覆盖」提示

#### Scenario: 取消勾选字段以当前全局值为初值

- **WHEN** 全局粗细为 2，用户取消勾选选中曲线的「使用全局默认·粗细」
- **THEN** 该曲线粗细覆盖初值为 2，渲染无视觉跳跃，控件激活可继续调整

#### Scenario: 勾选字段删除覆盖

- **WHEN** 用户勾选已覆盖粗细的曲线的「使用全局默认·粗细」
- **THEN** 该曲线 `lineStyle.width` 字段被删除，粗细回落全局默认
