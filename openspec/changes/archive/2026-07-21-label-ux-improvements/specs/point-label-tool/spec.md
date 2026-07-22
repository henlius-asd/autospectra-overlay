## MODIFIED Requirements

### Requirement: 点标签贴近曲线放置

点标签 SHALL 使用绝对数据 Y 坐标（`PointLabel.y`），SHALL NOT 依赖任何曲线的像素位置。放置时 SHALL 通过 `convertPixelToY` 将点击像素 Y 转换为数据 Y 坐标。渲染时 SHALL 通过 `convertYToPixel` 将数据 Y 转换为像素 Y。

#### Scenario: 新建点标签落在点击位置

- **WHEN** 用户在放置模式下点击图表某像素位置创建一个点标签
- **THEN** 该标签的 `y` 数据坐标对应点击的像素 Y，标签渲染在该位置

#### Scenario: 多曲线时标签不绑定曲线

- **WHEN** 图表中有多条可见曲线且 layerSpacing > 0
- **THEN** 点标签的纵向位置 SHALL NOT 受任何曲线位置影响，仅由 `y` 数据坐标和 y 轴范围决定

### Requirement: 点标签可拖动

已创建的点标签 SHALL 支持拖拽改变位置。横向拖拽改变标签的 X 数据坐标，纵向拖拽通过 `convertPixelToY(origPixelY + dy)` 将鼠标像素 Y 转换为数据 Y 坐标。拖动 SHALL NOT 受曲线位置影响。

#### Scenario: 拖拽点标签改变位置

- **WHEN** 用户按住一个已有点标签并拖动
- **THEN** 标签的 X 与 Y 数据坐标随拖拽实时更新，横向拖动经过峰顶时标签 Y 不跳跃，释放后保留新位置

## ADDED Requirements

### Requirement: 点标签双击编辑

已有点标签 SHALL 通过双击触发编辑浮层。单击 SHALL NOT 触发编辑。编辑浮层内的按钮（确认、取消、删除）SHALL 保留单击行为。

#### Scenario: 双击标签弹出编辑

- **WHEN** 用户双击已有点标签的文字或命中区域
- **THEN** 弹出标签编辑浮层，可修改文字或删除

#### Scenario: 单击不弹出编辑

- **WHEN** 用户单击已有点标签
- **THEN** SHALL NOT 弹出编辑浮层