## MODIFIED Requirements

### Requirement: 全局缩放与单曲线缩放

系统 SHALL 在工具栏「曲线分布」分组中提供"全局缩放"和"单曲线缩放"按钮。点击后分别设置 `interactionMode` 为 `'zoomGlobal'` 或 `'zoomCurve'`。缩放模式下，ECharts 原生画布平移 SHALL 被禁用。

- 全局缩放：滚轮缩放所有曲线 Y 轴，双击复位
- 单曲线缩放：点击曲线选中，滚轮缩放，Shift+拖拽平移，双击复位

#### Scenario: 全局缩放模式激活

- **WHEN** 用户点击"全局缩放"按钮
- **THEN** `interactionMode` 变为 `'zoomGlobal'`，按钮高亮，画布平移被禁用

#### Scenario: 单曲线缩放模式激活

- **WHEN** 用户点击"单曲线缩放"按钮
- **THEN** `interactionMode` 变为 `'zoomCurve'`，按钮高亮，画布平移被禁用

#### Scenario: 再次点击按钮回到 select

- **WHEN** 当前 `interactionMode` 为 `'zoomGlobal'` 或 `'zoomCurve'`，用户再次点击对应按钮
- **THEN** `interactionMode` 变为 `'select'`

#### Scenario: Esc 退出缩放模式

- **WHEN** 在 `'zoomGlobal'` 或 `'zoomCurve'` 模式下按 Escape
- **THEN** `interactionMode` 变为 `'select'`

#### Scenario: 全局缩放模式与单曲线缩放模式互斥

- **WHEN** 当前 `interactionMode` 为 `'zoomGlobal'`，用户点击"单曲线缩放"按钮
- **THEN** `interactionMode` 变为 `'zoomCurve'`，全局缩放按钮非激活，单曲线缩放按钮激活

## ADDED Requirements

### Requirement: 按住空格临时平移

在 `'zoomGlobal'` 或 `'zoomCurve'` 模式下，按住空格键 SHALL 临时恢复 ECharts 原生画布平移，光标变为 `grab`。松开空格键后 SHALL 恢复缩放模式的行为和光标。

#### Scenario: 按住空格临时平移

- **WHEN** 在 `'zoomGlobal'` 模式下按住空格键并拖拽图表
- **THEN** 画布随拖拽平移，工具栏仍然显示全局缩放按钮为激活状态；松开空格后恢复缩放行为