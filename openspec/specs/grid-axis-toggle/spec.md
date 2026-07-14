# grid-axis-toggle Specification

## Purpose
TBD - created by archiving change split-axis-toggle-and-curve-gap. Update Purpose after archive.
## Requirements
### Requirement: X 轴显隐开关

系统 SHALL 提供独立的 X 轴显隐控制。默认开启 X 轴显示。用户可通过工具栏"X 轴"按钮切换 X 轴（含轴线、刻度、标签、轴名称）的显示/隐藏。

#### Scenario: 默认显示 X 轴

- **WHEN** 应用加载且图表有数据
- **THEN** 图表显示 X 轴（轴线、刻度、标签、轴名称"时间"）

#### Scenario: 切换隐藏 X 轴

- **WHEN** 用户点击工具栏"X 轴"toggle 按钮
- **THEN** X 轴及其刻度/标签/名称隐藏，不影响 Y 轴显隐

### Requirement: Y 轴显隐开关

系统 SHALL 提供独立的 Y 轴显隐控制。默认关闭 Y 轴显示（默认仅显示 X 轴）。用户可通过工具栏"Y 轴"按钮切换 Y 轴（含轴线、刻度、标签、轴名称）的显示/隐藏。X 轴与 Y 轴显隐 SHALL 相互独立。

#### Scenario: 默认不显示 Y 轴

- **WHEN** 应用加载且图表有数据
- **THEN** 图表不显示 Y 轴（仅显示 X 轴）

#### Scenario: 独立切换 Y 轴

- **WHEN** 用户点击工具栏"Y 轴"toggle 按钮
- **THEN** Y 轴及其刻度/标签/名称显示，不影响 X 轴显隐

### Requirement: X 轴与曲线间距

当 X 轴显示时，X 轴 SHALL 位于整体可见曲线下方（`onAxis`/`position` 使轴线落在 `yAxisMin`，SHALL NOT 贴在 y=0）。Y 轴范围底部 SHALL 预留清晰间隔（约 8% dataSpan 或按层间距比例），使最底层曲线与 X 轴之间不贴合。

#### Scenario: 底层曲线不贴 X 轴

- **WHEN** 图表加载曲线数据并显示 X 轴
- **THEN** 最底层曲线与 X 轴之间留有可见间隔，轴线位于曲线整体下方而非 y=0

#### Scenario: 数据含零/负值时间隔仍存在

- **WHEN** 曲线最小值接近或等于 0
- **THEN** 底部 padding 仍使曲线与 X 轴保持间隔

### Requirement: 网格显隐开关

系统 SHALL 提供网格显隐控制，默认开启。网格显隐 SHALL 独立于 X/Y 轴显隐。

#### Scenario: 切换网格

- **WHEN** 用户点击"网格"toggle 按钮
- **THEN** 网格线显示/隐藏，X/Y 轴显隐状态不变

### Requirement: 分轴状态持久化

`showXAxis`/`showYAxis`/`showGrid` SHALL 存于 uiStore，通过 localForage 持久化到 IndexedDB，纳入 workspace JSON。导入旧工作区仅有 `showAxes` 时 SHALL 映射为 `showXAxis=showAxes, showYAxis=showAxes`，无报错。

#### Scenario: 刷新后分轴状态保留

- **WHEN** 用户关闭 X 轴、开启 Y 轴后刷新
- **THEN** 状态保持（X 关、Y 开）

#### Scenario: 旧工作区 showAxes 兼容

- **WHEN** 导入含 `showAxes` 但无 `showXAxis`/`showYAxis` 的旧 JSON
- **THEN** 两轴按 `showAxes` 值映射，无报错

