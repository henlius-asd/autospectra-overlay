# y-scale-tool Specification

## Purpose
Y 轴缩放工具，允许用户在图表区域通过点击曲线并拖拽峰值手柄来独立缩放每条曲线的 Y 轴比例，实现 per-curve 独立 Y 轴缩放。

## ADDED Requirements

### Requirement: Y 缩放工具模式切换

系统 SHALL 在工具栏提供 "Y缩放" 按钮，点击后进入/退出 Y 轴缩放模式。Y 缩放模式 SHALL 与区间标签放置模式（bracePlacementMode）和点标签放置模式（pointLabelPlacementMode）互斥——进入 Y 缩放模式时自动退出其他模式。

#### Scenario: 进入 Y 缩放模式

- **WHEN** 用户点击工具栏 "Y缩放" 按钮，且当前不在其他交互模式中
- **THEN** `yScaleToolMode` 变为 true，按钮高亮显示，图表区域进入曲线可选中状态

#### Scenario: 退出 Y 缩放模式

- **WHEN** 用户在 Y 缩放模式下再次点击 "Y缩放" 按钮
- **THEN** `yScaleToolMode` 变为 false，按钮恢复默认样式，选中曲线被取消，手柄消失

#### Scenario: 模式互斥

- **WHEN** 用户在 Y 缩放模式下点击 "区间标签" 或 "点标签" 按钮
- **THEN** Y 缩放模式自动退出，进入对应的标签放置模式

### Requirement: 曲线选中与取消选中

在 Y 缩放模式下，系统 SHALL 允许用户通过点击图表中的曲线来选中该曲线。选中后该曲线高亮显示，并在其当前可见 X 范围峰值处渲染拖拽手柄。点击图表空白区域或按 Esc 键 SHALL 取消选中。

#### Scenario: 点击曲线选中

- **WHEN** 用户在 Y 缩放模式下点击图表中某条曲线
- **THEN** 该曲线被选中（`activeScaledCurveId` 更新为该曲线 ID），曲线高亮，峰值处出现拖拽手柄

#### Scenario: 点击空白区域取消选中

- **WHEN** 用户在 Y 缩放模式下点击图表空白区域（无曲线处）
- **THEN** 当前选中曲线被取消（`activeScaledCurveId` 变为 null），手柄消失

#### Scenario: 按 Esc 取消选中

- **WHEN** 用户在 Y 缩放模式下按下 Esc 键
- **THEN** 当前选中曲线被取消，手柄消失

#### Scenario: 点击其他曲线切换选中

- **WHEN** 用户已选中曲线 A，在 Y 缩放模式下点击曲线 B
- **THEN** 曲线 A 取消选中，曲线 B 被选中，手柄移动到曲线 B 的峰值处

### Requirement: 拖拽缩放交互

选中曲线后，系统 SHALL 在曲线峰值像素位置渲染一个可拖拽的 HTML 覆盖层手柄。用户上下拖拽手柄时，系统 SHALL 实时计算新的缩放倍率并更新曲线渲染。缩放倍率 SHALL 以 `y * scale` 的方式应用于曲线数据（以 y=0 为基准点）。

#### Scenario: 拖拽手柄放大

- **WHEN** 用户选中曲线后，向上拖拽峰值手柄
- **THEN** 曲线 Y 轴缩放倍率增大，曲线波形在视觉上被拉伸，手柄旁显示当前倍率（如 ×1.5）

#### Scenario: 拖拽手柄缩小

- **WHEN** 用户选中曲线后，向下拖拽峰值手柄
- **THEN** 曲线 Y 轴缩放倍率减小，曲线波形在视觉上被压缩，手柄旁显示当前倍率

#### Scenario: 缩放倍率范围限制

- **WHEN** 用户拖拽手柄使缩放倍率超出 [0.1, 10.0] 范围
- **THEN** 缩放倍率被钳制在边界值（0.1 或 10.0），手柄不再继续移动

#### Scenario: 缩放实时生效

- **WHEN** 用户拖拽手柄过程中
- **THEN** 曲线渲染实时更新，Y 轴范围根据缩放后数据重新计算，其他曲线不受影响

### Requirement: 缩放倍率存储

每条曲线的缩放倍率 SHALL 存储在 `curveScales: Record<string, number>` 中，默认值为 1.0。工作区导出/导入时 SHALL 包含 `curveScales` 字段。

#### Scenario: 默认缩放倍率

- **WHEN** 新曲线被添加到图表
- **THEN** 该曲线的缩放倍率为 1.0（原始大小）

#### Scenario: 缩放倍率持久化

- **WHEN** 用户导出工作区 JSON
- **THEN** 导出的 JSON 包含 `curveScales` 字段，记录每条曲线的当前缩放倍率

#### Scenario: 导入工作区恢复缩放倍率

- **WHEN** 用户导入包含 `curveScales` 的工作区 JSON
- **THEN** 各曲线恢复导入文件中的缩放倍率

### Requirement: Y 轴范围适配缩放

Y 轴范围计算 SHALL 考虑每条曲线的独立缩放因子。`computeYAxisRange` 在遍历可见曲线数据点 SHALL 将 `y * scale` 纳入 min/max 计算，确保缩放后的曲线不会超出 Y 轴可视范围。

#### Scenario: 缩放后 Y 轴自动调整

- **WHEN** 用户将某条曲线缩放至 2.0x
- **THEN** Y 轴 max 自动扩展以容纳缩放后的曲线峰值

#### Scenario: 多曲线不同缩放

- **WHEN** 图表中有 3 条可见曲线，缩放倍率分别为 1.0、2.0、0.5
- **THEN** Y 轴范围基于缩放后的实际数据值计算，确保所有曲线均在可视范围内