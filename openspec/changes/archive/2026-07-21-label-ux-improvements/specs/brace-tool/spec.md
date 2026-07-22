## MODIFIED Requirements

### Requirement: 大括号整段拖拽平移

已创建的区间标签 SHALL 支持整段二维拖拽平移：横向拖拽时保持区间宽度不变，同步移动 `startX` 与 `endX`；纵向拖拽时更新 `yOffset` 字段。拖拽与点击编辑 SHALL 通过位移阈值（累计位移在 X 和 Y 方向均 < 5px 视为点击）区分。新创建的区间标签 SHALL 落在用户按下拖拽的像素 Y 位置（`yOffset = placementY - braceY`），而非默认 `braceY`。拖拽预览虚影 SHALL 同步使用 `placementY` 绘制。

#### Scenario: 拖拽平移整段区间

- **WHEN** 用户按住一个已有区间标签并横向拖动超过 5px
- **THEN** 该区间标签的 startX 与 endX 同步平移（宽度不变），释放后保留新位置，不弹出编辑浮层

#### Scenario: 纵向拖拽区间标签

- **WHEN** 用户按住一个已有区间标签并纵向拖动超过 5px
- **THEN** 该区间标签的 yOffset 随拖拽更新，标签沿纵向移动，释放后保留新位置

#### Scenario: 小幅移动视为点击

- **WHEN** 用户按住一个已有区间标签但累计位移在 X 和 Y 方向均不足 5px 即释放
- **THEN** 视为点击，SHALL NOT 弹出编辑浮层（编辑改为双击触发）

#### Scenario: 放置时落在按下 Y 位置

- **WHEN** 用户在放置模式下在图表某 Y 位置按下并拖拽选择区间
- **THEN** 创建的区间标签落在该 Y 位置（而非默认 `braceY`），拖拽预览虚影同步显示在该 Y 位置

## ADDED Requirements

### Requirement: 区间标签双击编辑

已有区间标签 SHALL 通过双击触发编辑浮层。单击 SHALL NOT 触发编辑。编辑浮层内的按钮（确认、取消、删除）SHALL 保留单击行为。

#### Scenario: 双击标签弹出编辑

- **WHEN** 用户双击已有区间标签的括号或文字
- **THEN** 弹出标签编辑浮层，可修改文字或删除

#### Scenario: 单击不弹出编辑

- **WHEN** 用户单击已有区间标签
- **THEN** SHALL NOT 弹出编辑浮层，标签保持选中状态