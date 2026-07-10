# y-axis-zoom Specification

## MODIFIED Requirements

### Requirement: Y 轴框选范围状态同步与持久化

Y 轴框选范围 SHALL 以 `yZoomRange: [number, number] | null` 存于 `uiStore`（`null` = 全量）。`datazoom` 事件 SHALL 将 Y dataZoom 的 `startValue/endValue` 经 `normalizeYZoomRange` 规整（仅 min/max 顺序排列）后回写 `yZoomRange`。`onDataZoom` 事件处理器 SHALL 在**单次渲染周期**内完成 X 与 Y 范围的 store 同步。Y dataZoom 的 `startValue`/`endValue` SHALL NOT 在 option 配置中设置——用户交互期间 SHALL 由 ECharts 内部管理，`replaceMerge` 合并时 SHALL 保留 ECharts 内部状态。外部变更（workspace 加载、reset）SHALL 通过 `dispatchAction` 命令式设置 Y dataZoom 范围。图表渲染 SHALL 用 `yZoomRange` 存储值直接设置 Y dataZoom 的 `startValue/endValue`。`yZoomRange` SHALL 随工作区 JSON 导出/导入（格式不变，旧存档缺失该字段时回落 `null`）。Y dataZoom SHALL 设 `minValueSpan = 0.05 × dataSpan` 以阻止过窄选择。

#### Scenario: 框选范围回写 store

- **WHEN** 用户拖动 Y slider 改变可见范围
- **THEN** `uiStore.yZoomRange` 被 `normalizeYZoomRange` 规整（仅 min/max 排序）后的 `[startValue, endValue]` 更新

#### Scenario: 滚轮缩放平滑无断层

- **WHEN** 用户在图表区快速连续滚轮缩放 Y 轴
- **THEN** Y 可见范围平滑变化，不出现范围突然回退的断层跳跃；option 配置不含 `startValue`/`endValue`，ECharts 内部状态不被覆盖

#### Scenario: Workspace 加载时恢复 Y 范围

- **WHEN** 导入含有 `yZoomRange` 的 workspace
- **THEN** 通过 `dispatchAction` 设置 Y dataZoom 的 `startValue`/`endValue` 为 `yZoomRange` 值，图表显示对应的可见范围

#### Scenario: 双击复位时 Y 范围恢复默认

- **WHEN** 用户双击 slider 复位 Y 轴
- **THEN** `yZoomRange` 变为 `null`，通过 `dispatchAction` 设置 Y dataZoom 范围为默认可见范围（`[rawDataMin, rawDataMax]`）

#### Scenario: 旧工作区导入兼容

- **WHEN** 导入不含 `yZoomRange` 字段的旧工作区 JSON
- **THEN** `yZoomRange` 为 `null`，Y 轴显示默认可见范围（`[rawDataMin, rawDataMax]`），无报错