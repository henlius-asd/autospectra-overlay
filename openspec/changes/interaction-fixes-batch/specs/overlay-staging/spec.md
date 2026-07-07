## MODIFIED Requirements

### Requirement: 叠图区拖拽排序

叠图区中的曲线 SHALL 支持通过拖拽改变顺序。`stagingOrder` SHALL 定义为自上而下对应图表视觉自上而下：`stagingOrder[0]` 对应画面最顶层曲线，`stagingOrder` 最后一个元素对应画面最底层曲线（即基准线）。拖拽顺序 SHALL 直接对应图表中曲线的渲染层位置。

#### Scenario: 拖拽改变顺序

- **WHEN** 用户在叠图区拖拽一条曲线到另一条曲线的位置
- **THEN** `stagingOrder` 数组顺序更新，图表中曲线渲染层位置同步更新（列表顶部 = 画面顶部）

#### Scenario: 列表与画面方向一致

- **WHEN** 叠图区自上而下显示 `stagingOrder[0], stagingOrder[1], ...`
- **THEN** 图表中对应曲线自下而上的渲染顺序为 `stagingOrder[last], ..., stagingOrder[1], stagingOrder[0]`，列表顶部曲线出现在画面最顶层

#### Scenario: 拖拽仅限叠图区内

- **WHEN** 用户尝试将叠图区曲线拖拽到未叠图区（或反之）
- **THEN** 拖拽操作无效，曲线保持在原区域

### Requirement: 基准线渲染位置

基准线 SHALL 始终为叠图区最底层的曲线（`stagingOrder` 中最后一个可见曲线），其 `layerYOffset = 0`。其他曲线按 `stagingOrder` 顺序自底向上叠加 Y 偏移：层号 `layerIndex = (visibleCount - 1 - visibleIndex)`，`visibleIndex` 为曲线在 `stagingOrder`（自顶向底）中的下标。

#### Scenario: 基准线在最底层

- **WHEN** 叠图区中有多条可见曲线
- **THEN** `stagingOrder` 最后一个可见曲线为基准线，`layerYOffset = 0`（画面最底），其余曲线 `layerIndex > 0` 向上叠加

#### Scenario: 拖拽到末尾成为基准线

- **WHEN** 用户将某曲线拖拽到 `stagingOrder` 末尾
- **THEN** 该曲线成为基准线（`baselineId` 更新为其 id），`layerYOffset = 0`，原基准线按新位置重新计算层号

## ADDED Requirements

### Requirement: 曲线列表行不显示数据点数

曲线列表的每一行 SHALL NOT 显示该曲线的数据点数。点数信息 SHALL NOT 占用列表行空间。

#### Scenario: 列表行无点数

- **WHEN** 用户查看曲线列表中任意一行
- **THEN** 该行不显示"点"或数据点计数字样，行内仅包含拖拽柄、勾选框、基准线星标、颜色块、名称与删除按钮
