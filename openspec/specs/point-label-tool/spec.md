# point-label-tool Specification

## Purpose
TBD - created by archiving change polish-annotations-and-export. Update Purpose after archive.
## Requirements
### Requirement: 点标签贴近曲线放置

点标签 SHALL 以最高曲线（staging 顺序最顶曲线）在标签 X 位置处的实际像素 y 为纵向基线，标签默认落在该点曲线上方约 10px（`yOffset = -10`）。点标签 SHALL NOT 压在曲线上，也 SHALL NOT 悬在预留区顶部远离曲线。

#### Scenario: 新建点标签默认贴近曲线上方

- **WHEN** 用户在放置模式下于某 X 位置创建一个点标签并确认标签文字
- **THEN** 该标签渲染在最高曲线在该 X 处的像素点上方约 10px，文字不覆盖曲线

#### Scenario: 多曲线分层时基线跟随最高曲线

- **WHEN** 图表中有多条可见曲线且 layerSpacing > 0
- **THEN** 点标签的纵向基线为最顶曲线（`visibleIds[0]`）在该 X 处的渲染像素 y（含该层 layerYOffset 与 offset.yOffset），而非全局 maxY 线

### Requirement: 点标签无装饰外框

点标签 SHALL 仅渲染文字，SHALL NOT 渲染外框矩形、对齐原点圆点或连接虚线。屏幕端渲染与导出端渲染 SHALL 一致。

#### Scenario: 屏幕与导出均无外框原点虚线

- **WHEN** 图表中存在已创建的点标签
- **THEN** 屏幕显示与导出 PNG 中均只出现标签文字，不出现 rect 外框、circle 原点或 dashed line

### Requirement: 点标签可拖动

已创建的点标签 SHALL 支持拖拽改变位置。横向拖拽改变标签的 X 数据坐标，纵向拖拽改变 `yOffset`。

#### Scenario: 拖拽点标签改变位置

- **WHEN** 用户按住一个已有点标签并拖动
- **THEN** 标签的 X 坐标与 yOffset 随拖拽实时更新，释放后保留新位置

### Requirement: 点标签完整显示在绘图区内

点标签文字 SHALL 完整显示在 grid 绘图区域内，不被上/下/左/右边界裁切。竖直方向 SHALL 夹取到 `[gridTop + labelHalfH, plotBottom - labelHalfH]`，水平方向 SHALL 夹取到 `[gridLeft + textW/2, chartWidth - gridRight - textW/2]`。

#### Scenario: 标签靠近上边界时竖直夹取

- **WHEN** 一个点标签的曲线基线接近绘图区顶部，使标签默认位置会越过 gridTop
- **THEN** 标签竖直位置被夹取，文字完整显示在 gridTop 下方，不被裁切

#### Scenario: 长标签靠近侧边时水平夹取

- **WHEN** 一个点标签的 X 位置接近 grid 左/右边界且文字较长
- **THEN** 标签水平位置被夹取，文字完整显示在绘图区内，不溢出 canvas 边

### Requirement: 点标签放置与编辑交互

系统 SHALL 在工具栏提供点标签放置入口，点击后进入放置模式；在图表上点击 X 位置后弹出标签编辑浮层。已有点标签点击后 SHALL 进入编辑（可改文字或删除）。Escape SHALL 退出放置模式或关闭编辑浮层。

#### Scenario: 放置模式下点击创建并编辑

- **WHEN** 用户进入放置模式后在图表某 X 位置点击
- **THEN** 在该位置创建一个空标签并弹出编辑浮层，用户输入文字确认后保存，放置模式退出

#### Scenario: Escape 退出放置或编辑

- **WHEN** 在放置模式或编辑浮层打开时按 Escape
- **THEN** 放置模式退出或编辑浮层关闭，不产生残留状态

### Requirement: 点标签渲染

点标签 SHALL 以"标签框 + 竖线 + 圆点"的形式渲染：上方为带背景的标签文字框，中间一条竖线连接到曲线上的小圆点标记。标签框字号、字体、字重、文字颜色、背景色 SHALL 取自 `labelStyle`——优先使用该标签自身的样式覆盖（若存在），否则回退到 `uiStore.labelStyle` 默认值，再回退到内置默认（字号 10）。SHALL NOT 使用硬编码字号。

#### Scenario: 标签视觉样式

- **WHEN** 一个点标签被创建并显示在图表上
- **THEN** 标签由三部分组成：上方圆角矩形背景的文字标签、中间竖直连接线、下方在曲线上的小圆点，字号/字体/字重/颜色取自当前 `labelStyle`

#### Scenario: 调整默认字号后实时更新

- **WHEN** 用户在工具栏"标签样式"面板将默认字号从 10 改为 14
- **THEN** 所有未单独覆盖样式的点标签立即以 14px 重渲染

### Requirement: 标签样式编辑

系统 SHALL 在工具栏提供"标签样式"按钮，点击后弹出样式编辑面板，支持调整默认标签样式：字号（范围 6–28）、字体、字重（常规/加粗）、文字颜色、背景色。当用户选中某一点标签时，同一面板 SHALL 切换为编辑该标签的单独样式覆盖（可清空覆盖回退到默认）。样式变更 SHALL 纳入 zundo undo/redo。

#### Scenario: 打开样式编辑面板

- **WHEN** 用户点击工具栏"标签样式"按钮
- **THEN** 弹出样式面板，显示当前默认字号/字体/字重/颜色，可调整

#### Scenario: 选中单个标签编辑其样式

- **WHEN** 用户选中一个点标签后打开样式面板
- **THEN** 面板显示该标签的样式（或"跟随默认"），用户调整 SHALL 仅作用于该标签

#### Scenario: 清除单标签覆盖

- **WHEN** 用户在单标签样式面板点击"恢复默认"
- **THEN** 该标签样式覆盖被清除，回退到默认 `labelStyle`

#### Scenario: 撤销样式变更

- **WHEN** 用户修改默认字号后按 Ctrl+Z
- **THEN** 字号恢复为修改前的值

### Requirement: 点标签导出

导出图片时 SHALL 包含所有可见的点标签，且字号/字体/字重/颜色 SHALL 与屏幕渲染一致（读取同一 `labelStyle`）。

#### Scenario: 导出包含点标签并保留样式

- **WHEN** 用户调整默认字号为 14 后点击"导出图片"
- **THEN** 导出图片中的点标签以 14px 渲染

### Requirement: 标签样式持久化

默认 `labelStyle` SHALL 存储在 uiStore 中，通过 localForage 持久化到 IndexedDB，并纳入 workspace JSON 导入/导出。单标签的样式覆盖 SHALL 随标签数据持久化。

#### Scenario: 刷新后样式保留

- **WHEN** 用户将默认字号改为 16 后刷新页面
- **THEN** 默认字号仍为 16

#### Scenario: 旧工作区导入兼容

- **WHEN** 导入不含 `labelStyle` 字段的旧工作区 JSON
- **THEN** 使用内置默认样式，无报错

