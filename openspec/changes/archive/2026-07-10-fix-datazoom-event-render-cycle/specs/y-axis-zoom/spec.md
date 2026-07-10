# y-axis-zoom Specification

## MODIFIED Requirements

### Requirement: Y 轴框选范围状态同步与持久化

Y 轴框选范围 SHALL 以 `yZoomRange: [number, number] | null` 存于 `uiStore`（`null` = 全量）。`datazoom` 事件 SHALL 将 Y dataZoom 的 `startValue/endValue` 经 `normalizeYZoomRange` 规整（min/max 顺序、clamp 到 `[rawDataMin, rawDataMax]`、最小段 5% dataSpan）后回写 `yZoomRange`。`onDataZoom` 事件处理器 SHALL 在**单次渲染周期**内完成 X 与 Y 范围的 store 同步——X 与 Y 的更新 SHALL 合并为单次 `setState` 调用，SHALL NOT 分步写入导致 ECharts 接收滞后的 `startValue/endValue`。当 X 范围未实际变化时（仅 Y 缩放触发的事件），`onDataZoom` SHALL 跳过 `xRange` 的 store 写入。图表渲染 SHALL 用 `yZoomRange` 存储值直接设置 Y dataZoom 的 `startValue/endValue`，**不在 option 构建时做二次 clamp**。`yZoomRange` SHALL 随工作区 JSON 导出/导入（格式不变，旧存档缺失该字段时回落 `null`）。Y dataZoom SHALL 设 `minValueSpan = 0.05 × dataSpan` 以阻止过窄选择。

#### Scenario: 框选范围回写 store

- **WHEN** 用户拖动 Y slider 改变可见范围
- **THEN** `uiStore.yZoomRange` 被 `normalizeYZoomRange` 规整后的 `[startValue, endValue]` 更新

#### Scenario: 滚轮缩放无闪烁

- **WHEN** 用户在图表区滚轮缩放 Y 轴
- **THEN** Y 可见范围平滑变化，无短暂回退或闪烁；ECharts 始终接收最新的 `startValue/endValue`，不接收滞后值

#### Scenario: Y-only 缩放不触发 X 写入

- **WHEN** 用户仅滚轮缩放 Y 轴（X 范围未变）
- **THEN** `uiStore.xRange` 不被写入，不触发由 X 同步引起的额外渲染

#### Scenario: 旧工作区导入兼容

- **WHEN** 导入不含 `yZoomRange` 字段的旧工作区 JSON
- **THEN** `yZoomRange` 为 `null`，Y 轴显示全量范围，无报错

#### Scenario: X 缩放或其他状态变化不触发 Y range 更新

- **WHEN** X 轴缩放、showGrid 切换、bracePlacementMode 切换等非 Y 操作发生
- **THEN** `uiStore.yZoomRange` 保持不变，option 的 dataZoom `startValue/endValue` 直接使用 `yZoomRange` 存储值，不做二次 clamp

#### Scenario: Workspace 加载的越界 yZoomRange 被 ECharts 自行 clamp

- **WHEN** 导入的 workspace 中 `yZoomRange` 值越出当前数据边界
- **THEN** ECharts 内部 clamp 到 `[yAxisMin, yAxisMax]` 范围内显示，`uiStore.yZoomRange` 不变，下次用户操作 Y slider 时由 `onDataZoom` 更新