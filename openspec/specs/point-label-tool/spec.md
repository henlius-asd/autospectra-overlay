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

