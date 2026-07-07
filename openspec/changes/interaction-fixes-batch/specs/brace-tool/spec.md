## MODIFIED Requirements

### Requirement: 大括号插入工具按钮

系统 SHALL 在工具栏提供"插入大括号"按钮。点击后进入大括号放置模式，用户可通过在图表上**单次拖拽**（pointer down → move → up）选择一段 X 区间来放置大括号。放置模式下系统 SHALL 临时禁用 ECharts 的 `inside` dataZoom 以避免与拖拽冲突。

#### Scenario: 点击工具按钮进入放置模式

- **WHEN** 用户点击工具栏中的"插入大括号"按钮
- **THEN** 按钮高亮显示为激活状态，图表光标变为 crosshair，ECharts `inside` dataZoom 被临时禁用

#### Scenario: 拖拽选择区间

- **WHEN** 在放置模式下，用户在图表上按下鼠标（pointer down）并拖动到另一位置后松开（pointer up）
- **THEN** 系统以按下点与松开点之间的 X 区间为大括号范围，拖动过程中实时显示预览，松开后弹出标签输入对话框

#### Scenario: 输入标签并确认

- **WHEN** 用户在标签输入对话框中输入文字并点击确认
- **THEN** 大括号被创建并存入 store，放置模式自动退出，按钮恢复非激活状态，ECharts `inside` dataZoom 恢复启用

#### Scenario: 取消放置

- **WHEN** 在大括号放置模式下，用户按 Escape 键或再次点击工具按钮
- **THEN** 放置模式退出，拖拽中的端点被清除，按钮恢复非激活状态，ECharts `inside` dataZoom 恢复启用

#### Scenario: 工具按钮仅在图表有数据时可用

- **WHEN** 图表中没有曲线数据
- **THEN** "插入大括号"按钮显示为禁用状态

## ADDED Requirements

### Requirement: 大括号渲染在曲线顶部

已创建的大括号 SHALL 渲染在图表顶部留白区（`y = gridTop + 偏移`），位于所有曲线之上。大括号凸起 SHALL 朝向下方（指向曲线），标签文字 SHALL 位于大括号上方。

#### Scenario: 大括号位于顶部

- **WHEN** 图表中存在已创建的大括号
- **THEN** 大括号的 SVG path 绘制在 `gridTop` 之下的顶部留白区，不与任何曲线重叠，标签文字在大括号上方显示

### Requirement: 大括号路径函数共享

大括号的 SVG path 生成逻辑 SHALL 抽取为独立模块（`bracePath`），供 `BraceOverlay` 渲染与图片导出共用。

#### Scenario: 渲染与导出共用 bracePath

- **WHEN** `BraceOverlay` 渲染大括号或导出图片序列化大括号 SVG
- **THEN** 两者 SHALL 调用同一 `bracePath` 函数生成 path，保证视觉与导出一致
