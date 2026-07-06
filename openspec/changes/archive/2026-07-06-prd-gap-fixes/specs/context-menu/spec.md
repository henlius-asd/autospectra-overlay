## ADDED Requirements

### Requirement: 右键菜单触发

系统 SHALL 在曲线列表项上支持右键点击（contextmenu 事件），弹出上下文菜单。菜单 SHALL 包含以下选项：
- 设为对齐基准线
- 删除曲线

#### Scenario: 右键弹出菜单

- **WHEN** 用户在曲线列表项上点击鼠标右键
- **THEN** 系统在鼠标位置弹出上下文菜单，显示"设为对齐基准线"和"删除曲线"选项

#### Scenario: 设为基准线

- **WHEN** 用户在上下文菜单中点击"设为对齐基准线"
- **THEN** 该曲线被设为当前基准线，store 中 `baselineId` 更新为该曲线 ID，菜单关闭

#### Scenario: 删除曲线

- **WHEN** 用户在上下文菜单中点击"删除曲线"
- **THEN** 该曲线从 `curves`、`offsets`、`visibleCurves` 和 `stagingOrder` 中移除，菜单关闭

#### Scenario: 点击其他区域关闭菜单

- **WHEN** 上下文菜单打开后，用户点击菜单外的任何区域
- **THEN** 上下文菜单关闭

#### Scenario: 当前已是基准线的曲线

- **WHEN** 用户在已是基准线的曲线项上右键
- **THEN** "设为对齐基准线"选项显示为禁用状态或带有 ★ 标识