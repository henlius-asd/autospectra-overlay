# manual-curve-move Delta Specification

## MODIFIED Requirements

### Requirement: 横向移动锁定

每条曲线 SHALL 可标记 `locked`（横向锁定）。锁定后该曲线的横向拖拽 SHALL 被禁用（拖拽不改变 `xOffset`，给出锁定视觉/光标提示），纵向拖拽仍可用。锁定状态 SHALL 仅可通过工具栏按钮切换（在手动移动模式下选中曲线后显示锁定/解锁按钮）。右键菜单 SHALL NOT 提供锁定切换项。

#### Scenario: 锁定后无法横向移动

- **WHEN** 曲线被标记 `locked` 且用户在手动移动模式下尝试横向拖拽
- **THEN** 横向 `xOffset` 不变，光标/视觉提示该曲线已锁定

#### Scenario: 工具栏按钮切换锁定

- **WHEN** 用户在手动移动模式下选中一条曲线，点击工具栏锁定按钮
- **THEN** 该曲线 `locked` 翻转，立即生效

### Requirement: 与自动对齐协同

执行"一键对齐"（指工具箱 `AlignmentControls` 组件中的对齐操作）时 SHALL 尊重 `locked` 曲线：锁定曲线的 `xOffset` SHALL NOT 被对齐算法修改（其余非锁定曲线正常对齐）。手动移动写入的 `xOffset`/`yOffset` SHALL 作为对齐算法的当前偏移基线参与增量计算（与"对齐不累积偏移"一致）。`normalizeAllPeak`（归一化所有曲线峰值）是独立功能，与本要求无关。

#### Scenario: 对齐不改变锁定曲线

- **WHEN** 存在锁定曲线且用户在工具箱中点击"一键对齐"
- **THEN** 锁定曲线 `xOffset` 不变，非锁定曲线正常对齐