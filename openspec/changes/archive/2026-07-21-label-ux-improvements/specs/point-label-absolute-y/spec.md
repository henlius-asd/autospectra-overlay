## ADDED Requirements

### Requirement: 点标签使用绝对数据 Y 坐标

点标签的纵向位置 SHALL 使用绝对数据 Y 坐标（`PointLabel.y`），SHALL NOT 依赖任何曲线的像素位置。放置时 SHALL 通过 `convertPixelToY` 将点击像素 Y 转换为数据 Y。渲染时 SHALL 通过 `convertYToPixel` 将数据 Y 转换为像素 Y。拖动时 SHALL 通过 `convertPixelToY(origPixelY + dy)` 将鼠标像素 Y 转换为数据 Y。

#### Scenario: 放置点标签

- **WHEN** 用户在放置模式下点击图表某像素位置
- **THEN** 点标签创建在该像素位置对应的数据 Y 坐标，不依赖任何曲线

#### Scenario: 拖动点标签

- **WHEN** 用户拖动点标签
- **THEN** 标签的 `y` 数据坐标随鼠标像素 Y 实时更新，横向拖动经过峰顶时标签 Y 不跳跃

#### Scenario: y 轴缩放时标签跟随

- **WHEN** 用户通过 y 轴 dataZoom 缩放
- **THEN** 点标签的像素 Y 随 y 轴缩放同步更新（数据 Y 不变，像素 Y 随轴缩放）

### Requirement: 旧格式标签迁移

导入旧工作区 JSON 时，系统 SHALL 将缺失 `y` 字段的点标签（旧格式使用 `yOffset`）迁移为 `y: 0`。迁移后的标签 SHALL 可被用户拖拽到正确位置。

#### Scenario: 导入旧格式工作区

- **WHEN** 导入包含 `yOffset` 但无 `y` 字段的点标签的旧工作区 JSON
- **THEN** 标签的 `y` 被设为 0，渲染在数据 Y=0 位置，无报错