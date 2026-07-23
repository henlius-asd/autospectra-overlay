# scale-slider Specification

## ADDED Requirements

### Requirement: 面板内全局缩放值显示

系统 SHALL 在工具箱「自动叠图」面板的「缩放」分区标题旁显示当前 `globalScale` 值，格式为 `缩放 ×{globalScale.toFixed(1)}`。显示 SHALL 通过 `useCurveStore` 订阅实时更新。当 `globalScale` 为 1 时 SHALL 显示 `×1.0`，不隐藏。

#### Scenario: 默认值显示

- **WHEN** 页面加载，`globalScale` 为默认值 1
- **THEN** 「缩放」标题旁显示 `×1.0`

#### Scenario: 全局缩放后实时更新

- **WHEN** 用户在全局缩放模式下滚轮将 `globalScale` 调至 2.5
- **THEN** 「缩放」标题旁显示 `×2.5`

#### Scenario: 双击复位后更新

- **WHEN** 用户在全局缩放模式下双击复位，`globalScale` 回到 1
- **THEN** 「缩放」标题旁显示 `×1.0`
