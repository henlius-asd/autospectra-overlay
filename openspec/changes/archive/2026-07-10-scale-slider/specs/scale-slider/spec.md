# scale-slider Specification

## Purpose
Y 轴缩放滑条，在选中曲线左侧显示垂直滑条，拖拽滑块实时缩放曲线。替代因 ECharts click 事件限制而不可用的峰值拖拽手柄。

## ADDED Requirements

### Requirement: 曲线选中机制

在 Y 缩放模式下，系统 SHALL 允许用户通过点击曲线列表中的曲线行选中曲线。选中后该曲线左侧显示垂直缩放滑条。点击另一条曲线行 SHALL 切换选中。

#### Scenario: 点击曲线行选中

- **WHEN** 用户在 Y 缩放模式下点击曲线列表中的某条曲线行
- **THEN** 该曲线被选中（`activeScaledCurveId` 更新），左侧显示滑条

#### Scenario: 点击另一条曲线切换

- **WHEN** 用户已选中曲线 A，点击曲线 B 的行
- **THEN** 曲线 A 取消选中，曲线 B 被选中，滑条移动到曲线 B 左侧

### Requirement: 滑条显示

选中曲线后，系统 SHALL 在曲线渲染区域左侧显示垂直缩放滑条。滑条 SHALL 与选中曲线的渲染区域垂直对齐。滑条 SHALL 包含轨道、圆形滑块和当前倍率数值标签。

#### Scenario: 滑条位置

- **WHEN** 曲线被选中
- **THEN** 滑条显示在 ECharts grid 左侧 24px 处，垂直范围与选中曲线渲染区域对齐

#### Scenario: 滑条显示倍率

- **WHEN** 滑条可见
- **THEN** 滑条旁显示当前缩放倍率数值（如 ×1.0）

### Requirement: 拖拽缩放

用户拖拽滑条滑块 SHALL 实时缩放曲线。向上拖拽 SHALL 放大（倍率增大），向下拖拽 SHALL 缩小（倍率减小）。缩放倍率 SHALL 钳制在 [0.1, 10.0] 范围内。

#### Scenario: 向上拖拽放大

- **WHEN** 用户向上拖拽滑条滑块
- **THEN** 曲线实时放大，倍率数值增大

#### Scenario: 向下拖拽缩小

- **WHEN** 用户向下拖拽滑条滑块
- **THEN** 曲线实时缩小，倍率数值减小

#### Scenario: 倍率范围限制

- **WHEN** 用户拖拽滑块使倍率超出 [0.1, 10.0]
- **THEN** 倍率被钳制在边界值，滑块不再移动

### Requirement: 拖拽提交

拖拽过程中 SHALL 仅更新预览显示，SHALL NOT 写入 undo 历史。mouseup 时 SHALL 提交最终倍率到 `curveScales`。

#### Scenario: 拖拽不写入历史

- **WHEN** 用户拖拽滑条滑块过程中
- **THEN** 每次 mousemove 不触发 `setCurveScale`，仅更新显示值

#### Scenario: mouseup 提交

- **WHEN** 用户松开滑条滑块
- **THEN** 最终缩放倍率写入 `curveScales`，进入 undo 历史

### Requirement: 退出 Y 缩放模式

点击工具栏 "Y缩放" 按钮 SHALL 退出 Y 缩放模式，取消选中曲线，隐藏滑条。按 Esc 键 SHALL 取消选中但不退出模式。

#### Scenario: 工具栏退出

- **WHEN** 用户在 Y 缩放模式下点击工具栏 "Y缩放" 按钮
- **THEN** 模式退出，选中取消，滑条消失

#### Scenario: Esc 取消选中

- **WHEN** 用户在 Y 缩放模式下按下 Esc 键
- **THEN** 当前选中曲线取消，滑条消失，但 Y 缩放模式保持激活