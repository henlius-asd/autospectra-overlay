## MODIFIED Requirements

### Requirement: Y 轴框选范围状态同步与持久化

Y 轴框选范围 SHALL 以 `yZoomRange: [number, number] | null` 存于 `uiStore`（`null` = 全量）。`datazoom` 事件触发时 SHALL 通过 `getYAxisExtent()` 直读 ECharts Y 轴模型实时视口范围并按 min/max 规整后回写 `yZoomRange`（对称于 X 轴使用 `getXAxisExtent()` 的同步机制），不再依赖 `event.batch` 解析。`onDataZoom` 事件处理器 SHALL 在**单次渲染周期**内完成 X 与 Y 范围的 store 同步。图表渲染时 Y dataZoom 的 `startValue`/`endValue` SHALL NOT 在 option 配置中设置——用户交互期间 SHALL 由 ECharts 内部管理。`dispatchAction` SHALL 在 `yZoomRange` 非 null 时执行——包括 workspace 加载恢复，以及交互模式切换 / `spaceHeld` 翻转触发 option 重渲染之后（经 `requestAnimationFrame` 延迟重派发，详见 `viewport-preservation`）；`yZoomRange === null` 时 SHALL NOT 对 Y 执行 `dispatchAction`，使用 ECharts 默认的完整轴范围 `[yAxisMin, yAxisMax]`。`visibleYRange` 在 `yZoomRange === null` 时 SHALL 返回 `[yAxisFullRange.yAxisMin, yAxisFullRange.yAxisMax]`，与 ECharts 实际显示范围一致。Y dataZoom SHALL 设 `minValueSpan = 0.05 × dataSpan` 以阻止过窄选择。`onDataZoom` 写入 `yZoomRange` 时 SHALL 设置 `yZoomRangeSource='event'` 守卫，使 `[yZoomRange]` effect 跳过 `dispatchAction`（防回环），仅 workspace 加载恢复（`'external'`）触发 `dispatchAction`。

#### Scenario: 未缩放时全轴范围自由平移

- **WHEN** `yZoomRange` 为 null 且用户拖拽 Y slider 中间区域平移
- **THEN** Y 可见范围在 `[yAxisMin, yAxisMax]` 全轴范围内自由移动，不受 `[rawDataMin, rawDataMax]` 限制

#### Scenario: Workspace 加载时恢复 Y 范围

- **WHEN** 导入含有 `yZoomRange` 的 workspace
- **THEN** 通过 `dispatchAction` 设置 Y dataZoom 范围为用户保存的值

#### Scenario: 滚轮缩放平滑无断层

- **WHEN** 用户在图表区快速连续滚轮缩放 Y 轴
- **THEN** Y 可见范围平滑变化，option 不含 `startValue`/`endValue`，ECharts 内部状态不被覆盖；`onDataZoom` 通过 `getYAxisExtent()` 直读模型实时视口并回写 `yZoomRange`，`yZoomRangeSource='event'` 守卫使 `dispatchAction` 被跳过

#### Scenario: Y 滚轮缩放跨刷新生效

- **WHEN** 用户滚轮缩放到 Y∈[50, 150]（`yZoomRange` 被 `onDataZoom` 同步为 `[50, 150]`），随后刷新页面
- **THEN** 持久化恢复的 `yZoomRange` 为 `[50, 150]`，`onChartReady` 或 `[yZoomRange]` effect 通过 `dispatchAction` 恢复，Y 视口仍为 `[50, 150]` 而非回退到全量或陈旧框选范围

#### Scenario: 旧工作区导入兼容

- **WHEN** 导入不含 `yZoomRange` 字段的旧工作区 JSON
- **THEN** `yZoomRange` 为 null，不执行 `dispatchAction`，Y 轴使用 ECharts 默认全轴范围，无报错

#### Scenario: 模式切换或空格平移后恢复 Y 视口

- **WHEN** 用户已缩放到 Y∈[50, 150]（`yZoomRange` 非 null），随后切换 `interactionMode`（如进入 `brush`/`move`/`zoomGlobal`）或按住/松开空格触发 `spaceHeld` 翻转
- **THEN** option 重渲染完成后，经 `requestAnimationFrame` 延迟的 `dispatchAction` 将 Y dataZoom 重派发为 `[50, 150]`，Y 视口不回退到全量
