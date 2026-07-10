# y-axis-zoom Specification

## Purpose

Y 轴可见范围框选——通过 ECharts 原生 dataZoom 实现全局 Y 轴缩放与平移，范围持久化于工作区 JSON。

## Requirements

### Requirement: Y 轴框选范围状态同步与持久化

Y 轴框选范围 SHALL 以 `yZoomRange: [number, number] | null` 存于 `uiStore`（`null` = 全量）。`datazoom` 事件 SHALL 将 Y dataZoom 的 `startValue/endValue` 经 `normalizeYZoomRange` 规整（仅 min/max 顺序排列）后回写 `yZoomRange`。`onDataZoom` 事件处理器 SHALL 在**单次渲染周期**内完成 X 与 Y 范围的 store 同步。图表渲染时 Y dataZoom 的 `startValue`/`endValue` SHALL NOT 在 option 配置中设置——用户交互期间 SHALL 由 ECharts 内部管理。`dispatchAction` SHALL 仅在 `yZoomRange` 非 null 时（workspace 加载恢复）执行；`yZoomRange === null` 时 SHALL NOT 执行 `dispatchAction`，使用 ECharts 默认的完整轴范围 `[yAxisMin, yAxisMax]`。`visibleYRange` 在 `yZoomRange === null` 时 SHALL 返回 `[yAxisFullRange.yAxisMin, yAxisFullRange.yAxisMax]`，与 ECharts 实际显示范围一致。Y dataZoom SHALL 设 `minValueSpan = 0.05 × dataSpan` 以阻止过窄选择。

#### Scenario: 未缩放时全轴范围自由平移

- **WHEN** `yZoomRange` 为 null 且用户拖拽 Y slider 中间区域平移
- **THEN** Y 可见范围在 `[yAxisMin, yAxisMax]` 全轴范围内自由移动，不受 `[rawDataMin, rawDataMax]` 限制

#### Scenario: Workspace 加载时恢复 Y 范围

- **WHEN** 导入含有 `yZoomRange` 的 workspace
- **THEN** 通过 `dispatchAction` 设置 Y dataZoom 范围为用户保存的值

#### Scenario: 滚轮缩放平滑无断层

- **WHEN** 用户在图表区快速连续滚轮缩放 Y 轴
- **THEN** Y 可见范围平滑变化，option 不含 `startValue`/`endValue`，ECharts 内部状态不被覆盖

#### Scenario: 旧工作区导入兼容

- **WHEN** 导入不含 `yZoomRange` 字段的旧工作区 JSON
- **THEN** `yZoomRange` 为 null，不执行 `dispatchAction`，Y 轴使用 ECharts 默认全轴范围，无报错