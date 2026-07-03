## ADDED Requirements

### Requirement: uiStore 包含 X 轴可视范围

uiStore SHALL 包含 `xRange: [number, number]` 字段表示当前图表 X 轴可视范围，默认值为 `[0, 10]`。SHALL 提供 `setXRange` action 用于更新该字段。

#### Scenario: 初始值

- **WHEN** 应用首次加载
- **THEN** `uiStore.getState().xRange` 为 `[0, 10]`

#### Scenario: 更新可视范围

- **WHEN** 调用 `uiStore.getState().setXRange([5, 15])`
- **THEN** `uiStore.getState().xRange` 为 `[5, 15]`