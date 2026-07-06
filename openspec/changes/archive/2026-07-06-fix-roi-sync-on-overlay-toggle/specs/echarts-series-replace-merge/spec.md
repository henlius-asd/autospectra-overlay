## MODIFIED Requirements

### Requirement: ECharts series 替换合并

系统 SHALL 在更新 ECharts 图表 option 时使用 `replaceMerge={['series']}` 策略，确保 series 数组被完全替换而非合并，同时保持其他组件（dataZoom、xAxis、yAxis、grid、legend）的合并行为。series 更新（可见性切换/删除/对齐）SHALL NOT 触发对 `uiStore.xRange` 的覆写；`xRange` 的写入仅由 `onChartReady`、`onDataZoom` 以及"首次出现可见曲线"的初始化路径承担。

#### Scenario: 取消勾选曲线后图表移除对应 series

- **WHEN** 用户取消勾选某条可见曲线
- **THEN** 该曲线对应的 series 从图表中移除，其他可见曲线的 series 保持渲染

#### Scenario: 删除曲线后图表移除对应 series

- **WHEN** 用户删除一条曲线（单条或批量）
- **THEN** 该曲线对应的 series 从图表中移除，其他可见曲线的 series 保持渲染

#### Scenario: dataZoom 缩放状态在 series 更新后保持

- **WHEN** 用户已通过 dataZoom 滑块缩放到某个 X 轴范围，随后取消勾选或删除曲线
- **THEN** 图表的 dataZoom 缩放状态（xRange）保持不变，不触发 `onDataZoom` 事件

#### Scenario: store 中的 xRange 在可见性切换后保持

- **WHEN** 用户已缩放到特定 X 轴可视范围，随后勾选或取消勾选曲线使 series 更新
- **THEN** `uiStore.xRange` 保持为该可视范围，不被任何 series 更新触发的初始化逻辑覆写为全量数据范围

#### Scenario: 对齐算法在对齐后 series 正确更新

- **WHEN** 用户执行曲线对齐操作后，offsets 更新导致 series 数据变化
- **THEN** 图表使用新的 offsets 重新渲染 series，同时保持 dataZoom 缩放状态不变
