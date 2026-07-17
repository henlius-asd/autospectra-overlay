## MODIFIED Requirements

### Requirement: 手动横向移动曲线

系统 SHALL 提供"手动移动"模式，该按钮 SHALL 位于「曲线分布」分组中。点击后 `interactionMode` 设置为 `'move'`。进入该模式并选中一条曲线后，用户 SHALL 可通过拖拽将曲线左右移动，拖拽 SHALL 将水平位移换算为数据坐标并写入该曲线的 `xOffset`。拖拽时光标为 move 样式，释放后位置保存。移动模式下，ECharts 原生画布平移 SHALL 被禁用。

#### Scenario: 横向拖拽移动单条曲线

- **WHEN** 用户点击"手动移动"按钮进入模式、选中一条曲线并左右拖拽后释放
- **THEN** 该曲线水平移动到新位置，`xOffset` 更新，其他曲线不受影响

#### Scenario: 移动纳入撤销

- **WHEN** 用户手动横向移动一条曲线后按 Ctrl+Z
- **THEN** 该曲线 `xOffset` 恢复为移动前

#### Scenario: Esc 退出移动模式

- **WHEN** 在 `'move'` 模式下按 Escape
- **THEN** `interactionMode` 变为 `'select'`

#### Scenario: 再次点击按钮回到 select

- **WHEN** 当前 `interactionMode` 为 `'move'`，用户再次点击"手动移动"按钮
- **THEN** `interactionMode` 变为 `'select'`

#### Scenario: 移动模式下画布不平移

- **WHEN** 在 `'move'` 模式下拖拽未选中曲线的区域
- **THEN** 画布不平移，仅执行曲线移动操作（若拖拽在选中曲线上）

### Requirement: 锁定按钮显示逻辑

锁定按钮（LockIcon）SHALL 仅在 `interactionMode === 'move'` 且 `selectedCurveId !== null` 时显示，位于「手动移动」按钮旁边。SHALL NOT 在其他模式下显示。

#### Scenario: 手动移动模式下选中曲线时显示锁定按钮

- **WHEN** `interactionMode` 为 `'move'` 且 `selectedCurveId` 不为 null
- **THEN** 锁定按钮在手动移动按钮旁边显示

#### Scenario: 非手动移动模式下隐藏锁定按钮

- **WHEN** `interactionMode` 为 `'select'` 或 `'brace'` 等其他模式
- **THEN** 锁定按钮不显示

## ADDED Requirements

### Requirement: 按住空格临时平移

在 `'move'` 模式下，按住空格键 SHALL 临时恢复 ECharts 原生画布平移，光标变为 `grab`。松开空格键后 SHALL 恢复 `'move'` 模式的行为和光标。

#### Scenario: 按住空格临时平移

- **WHEN** 在 `'move'` 模式下按住空格键并拖拽图表
- **THEN** 画布随拖拽平移，工具栏仍然显示手动移动按钮为激活状态；松开空格后恢复曲线移动行为