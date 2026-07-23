## MODIFIED Requirements

### Requirement: 大括号随 dataZoom 联动

区间标签的纵向位置 SHALL 使用绝对数据 Y 坐标（`BraceAnnotation.y`），SHALL NOT 依赖任何曲线的像素位置或 `peak`（`rawDataMin + yRangeForLayer`）聚合值，与点标签（见 `point-label-absolute-y`）共用同一参考系。渲染时水平主线 Y SHALL 由 `convertYToPixel(brace.y)` 给出。y 轴 dataZoom 缩放/平移时 SHALL 随轴变换同步更新像素位置（数据 Y 不变，像素 Y 随轴缩放），与点标签行为一致。区间标签 SHALL NOT 自动贴近最高曲线峰值；其纵向位置由用户放置/拖拽决定（绝对数据 Y）。过渡期对携带 legacy `yOffset` 的旧 brace，渲染 SHALL 回退到旧像素公式 `braceY + yOffset`（`braceY` 仍按 `peak` 与 `gridTop + 2` 下限计算），直至首渲染迁移将其转换为 `y`。

#### Scenario: y 轴缩放时区间标签随轴同步

- **WHEN** 用户通过 y 轴 dataZoom 缩放
- **THEN** 区间标签的像素 Y 随 y 轴缩放同步更新（数据 Y 不变，像素 Y 随轴缩放），与点标签一致

#### Scenario: 上下平移图层时区间标签跟随曲线

- **WHEN** 用户上下平移某曲线图层（改 `offset.yOffset`，Y 轴随之变化）
- **THEN** 区间标签与点标签一样随轴变换跟随曲线，相对曲线不发生漂移（与点标签行为一致）

#### Scenario: 标签不自动贴近最高曲线

- **WHEN** 图表中有多条曲线且 layerSpacing > 0
- **THEN** 区间标签 SHALL NOT 自动贴向最高曲线峰值，而是保持用户放置的绝对数据 Y 位置

### Requirement: 大括号整段拖拽平移

已创建的区间标签 SHALL 支持整段二维拖拽平移：横向拖拽时保持区间宽度不变，同步移动 `startX` 与 `endX`（绝对数据 X，经 `convertPixelToX` 转换）；纵向拖拽时 SHALL 通过 `y = convertPixelToY(convertYToPixel(origY) + dy)` 更新绝对数据 Y（与点标签拖拽机制一致），SHALL NOT 使用像素级 `yOffset`。拖拽与点击编辑 SHALL 通过位移阈值（累计位移在 X 和 Y 方向均 < 5px 视为点击）区分。新创建的区间标签 SHALL 落在用户按下拖拽的像素 Y 位置对应的绝对数据 Y（`y = convertPixelToY(placementY)`），而非默认 `braceY`。拖拽预览虚影 SHALL 同步使用 `placementY` 绘制。

#### Scenario: 拖拽平移整段区间

- **WHEN** 用户按住一个已有区间标签并横向拖动超过 5px
- **THEN** 该区间标签的 startX 与 endX 同步平移（宽度不变），释放后保留新位置，不弹出编辑浮层

#### Scenario: 纵向拖拽区间标签

- **WHEN** 用户按住一个已有区间标签并纵向拖动超过 5px
- **THEN** 该区间标签的 `y` 数据坐标随鼠标像素 Y 实时更新（经 `convertPixelToY(convertYToPixel(origY) + dy)`），释放后保留新位置

#### Scenario: 小幅移动视为点击

- **WHEN** 用户按住一个已有区间标签但累计位移在 X 和 Y 方向均不足 5px 即释放
- **THEN** 视为点击，SHALL NOT 弹出编辑浮层（编辑改为双击触发）

#### Scenario: 放置时落在按下 Y 位置

- **WHEN** 用户在放置模式下在图表某 Y 位置按下并拖拽选择区间
- **THEN** 创建的区间标签 `y` 设为该 Y 位置对应的绝对数据 Y（`convertPixelToY(placementY)`），拖拽预览虚影同步显示在该 Y 位置
