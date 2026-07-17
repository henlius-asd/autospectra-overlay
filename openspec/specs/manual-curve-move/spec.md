# manual-curve-move Specification

## Purpose
手动移动曲线工具。通过工具栏按钮进入移动模式，拖拽移动选中曲线（X/Y 方向），支持横向锁定。移动模式下禁用画布平移，按住空格可临时平移。

## Requirements
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

### Requirement: 手动纵向移动曲线

在手动移动模式下，选中一条曲线后 SHALL 可纵向拖拽调整其与相邻曲线的间距，拖拽 SHALL 写入该曲线的 `yOffset`。纵向移动 SHALL 不受横向锁定限制。

#### Scenario: 纵向拖拽调间距

- **WHEN** 用户在手动移动模式下纵向拖拽一条曲线
- **THEN** 该曲线纵向位置变化、`yOffset` 更新，相邻曲线不受影响

### Requirement: 横向移动锁定

每条曲线 SHALL 可标记 `locked`（横向锁定）。锁定后该曲线的横向拖拽 SHALL 被禁用（拖拽不改变 `xOffset`，给出锁定视觉/光标提示），纵向拖拽仍可用。锁定状态 SHALL 仅可通过工具栏按钮切换（在手动移动模式下选中曲线后显示锁定/解锁按钮）。右键菜单 SHALL NOT 提供锁定切换项。

#### Scenario: 锁定后无法横向移动

- **WHEN** 曲线被标记 `locked` 且用户在手动移动模式下尝试横向拖拽
- **THEN** 横向 `xOffset` 不变，光标/视觉提示该曲线已锁定

#### Scenario: 工具栏按钮切换锁定

- **WHEN** 用户在手动移动模式下选中一条曲线，点击工具栏锁定按钮
- **THEN** 该曲线 `locked` 翻转，立即生效

### Requirement: 锁定按钮显示逻辑

锁定按钮（LockIcon）SHALL 仅在 `interactionMode === 'move'` 且 `selectedCurveId !== null` 时显示，位于「手动移动」按钮旁边。SHALL NOT 在其他模式下显示。

#### Scenario: 手动移动模式下选中曲线时显示锁定按钮

- **WHEN** `interactionMode` 为 `'move'` 且 `selectedCurveId` 不为 null
- **THEN** 锁定按钮在手动移动按钮旁边显示

#### Scenario: 非手动移动模式下隐藏锁定按钮

- **WHEN** `interactionMode` 为 `'select'` 或 `'brace'` 等其他模式
- **THEN** 锁定按钮不显示

### Requirement: 按住空格临时平移

在 `'move'` 模式下，按住空格键 SHALL 临时恢复 ECharts 原生画布平移，光标变为 `grab`。松开空格键后 SHALL 恢复 `'move'` 模式的行为和光标。

#### Scenario: 按住空格临时平移

- **WHEN** 在 `'move'` 模式下按住空格键并拖拽图表
- **THEN** 画布随拖拽平移，工具栏仍然显示手动移动按钮为激活状态；松开空格后恢复曲线移动行为

### Requirement: 与自动对齐协同

执行"一键对齐"（指工具箱 `AlignmentControls` 组件中的对齐操作）时 SHALL 尊重 `locked` 曲线：锁定曲线的 `xOffset` SHALL NOT 被对齐算法修改（其余非锁定曲线正常对齐）。手动移动写入的 `xOffset`/`yOffset` SHALL 作为对齐算法的当前偏移基线参与增量计算（与"对齐不累积偏移"一致）。`normalizeAllPeak`（归一化所有曲线峰值）是独立功能，与本要求无关。

#### Scenario: 对齐不改变锁定曲线

- **WHEN** 存在锁定曲线且用户在工具箱中点击"一键对齐"
- **THEN** 锁定曲线 `xOffset` 不变，非锁定曲线正常对齐

### Requirement: 手动移动持久化

`xOffset`/`yOffset`/`locked` SHALL 随 curve 数据通过 localForage 持久化到 IndexedDB，纳入 workspace JSON，参与 zundo undo/redo。

#### Scenario: 刷新后手动位移与锁定保留

- **WHEN** 用户手动移动并锁定若干曲线后刷新
- **THEN** 曲线位置与锁定状态从 IndexedDB 恢复