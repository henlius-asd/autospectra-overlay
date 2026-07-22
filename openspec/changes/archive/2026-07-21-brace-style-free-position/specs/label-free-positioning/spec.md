## ADDED Requirements

### Requirement: 区间标签自由纵向定位

区间标签 SHALL 支持自由纵向定位。每个区间标签的 Y 基线 SHALL 独立计算为 `braceY + (brace.yOffset ?? 0)`，其中 `braceY` 为默认基线（水平主线贴近顶曲线峰值），`yOffset` 为像素偏移（正值向下，默认 0）。`yOffset` SHALL 存储在 `BraceAnnotation.yOffset` 字段中，通过 IndexedDB 持久化并纳入 workspace JSON 导入/导出。

#### Scenario: 纵向拖拽区间标签

- **WHEN** 用户按住一个已有区间标签并纵向拖动超过 5px
- **THEN** 该区间标签的 yOffset 随拖拽实时更新，标签沿纵向移动，释放后保留新位置

#### Scenario: 新旧快照兼容

- **WHEN** 导入不含 `yOffset` 字段的旧工作区 JSON
- **THEN** 该字段默认为 0，区间标签渲染在默认基线位置，无报错

### Requirement: 区间标签和点标签无位置约束

区间标签和点标签的文字位置 SHALL NOT 被 clamp 约束到 grid 绘图区域内。标签文字 SHALL 渲染在计算出的原始像素坐标上，不进行边界裁切。用户可通过拖拽将标签放置在画布任意位置。

#### Scenario: 标签拖到画布边缘外

- **WHEN** 用户拖拽区间标签或点标签到画布 grid 边界之外
- **THEN** 标签文字 SHALL 渲染在原始坐标上，不被 clamp 回 grid 内，可能部分或完全不可见

#### Scenario: 拖拽回画布内

- **WHEN** 用户拖拽已移出画布的标签回到画布内
- **THEN** 标签文字重新可见，位置由拖拽决定

### Requirement: 点标签自由放置

点标签在放置时 SHALL 落在用户点击的像素 Y 位置，而非固定的顶曲线 Y-10 偏移。系统 SHALL 计算 `yOffset = 点击像素Y - 基线Y`（基线为顶曲线在该 X 处的像素 Y），将标签放置在点击位置。

#### Scenario: 点击曲线下方创建点标签

- **WHEN** 用户在放置模式下于某 X 位置点击，且点击点位于顶曲线下方
- **THEN** 点标签创建在点击的像素 Y 位置，而非顶曲线 Y-10 处

#### Scenario: 点击曲线上方创建点标签

- **WHEN** 用户在放置模式下于某 X 位置点击，且点击点位于顶曲线上方
- **THEN** 点标签创建在点击的像素 Y 位置