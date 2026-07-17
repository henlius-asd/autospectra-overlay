## MODIFIED Requirements

### Requirement: uiStore 初始状态

uiStore 初始状态 SHALL 包含以下字段：

- `leftPanelCollapsed: boolean` — false
- `rightPanelCollapsed: boolean` — false
- `selectionMode: 'none' | 'roi'` — 'none'
- `alignmentProgress: number | null` — null
- `xRange: [number, number]` — [0, 10]
- `interactionMode: InteractionMode` — `'select'`

uiStore SHALL NOT 包含 `bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode` 这些 boolean flag。

#### Scenario: 初始 UI 状态验证

- **WHEN** 应用首次加载
- **THEN** 左右面板均为展开状态，选取模式为 none，对齐进度为 null，xRange 为 [0, 10]，interactionMode 为 `'select'`

#### Scenario: 旧 boolean flag 不存在

- **WHEN** 应用首次加载
- **THEN** `uiStore` 中不存在 `bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode` 字段

## REMOVED Requirements

### Requirement: uiStore 交互模式 boolean flag

**Reason**: 6 个 boolean flag 的互斥逻辑分散且难以维护，替换为单一 `interactionMode` 枚举。

**Migration**: 所有引用 `bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode` 的代码替换为 `interactionMode` 枚举和 `setInteractionMode` action。

## ADDED Requirements

### Requirement: setInteractionMode action

uiStore SHALL 提供 `setInteractionMode(mode: InteractionMode)` action，用于设置当前交互模式。

#### Scenario: 设置交互模式

- **WHEN** 调用 `setInteractionMode('brush')`
- **THEN** `interactionMode` 变为 `'brush'`

### Requirement: 新建工作区重置 interactionMode

`resetUiForNewWorkspace` action SHALL 将 `interactionMode` 重置为 `'select'`。

#### Scenario: 新建工作区后工具重置

- **WHEN** 调用 `resetUiForNewWorkspace()`
- **THEN** `interactionMode` 变为 `'select'`