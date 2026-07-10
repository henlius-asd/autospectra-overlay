## Why

Y dataZoom 的 `startValue`/`endValue` 在 option 配置中从 store 取值，每次 React 渲染时发回 ECharts。当用户快速滚动缩放时，`onDataZoom` 事件写入 store 的延迟导致 option 携带**滞后值**覆盖 ECharts 内部已更新的状态，ECharts 被迫回退到滞后值，表现为可见范围突然扩大（"间隔变大"）的断层跳跃。X dataZoom 无此问题——option 中不含 `start`/`end`，ECharts 内部自主管理，`onDataZoom` 仅读取不回写。

## What Changes

- 从 dataZoom option 配置中移除 `startValue`/`endValue` 的赋值，与 X 轴对齐，让 ECharts 内部管理 Y dataZoom 范围。
- 新增 `useEffect` 监听 `yZoomRange` 外部变更（workspace 加载、reset），通过 `dispatchAction` 命令式设置 Y dataZoom 范围。
- 使用 ref 标记 `yZoomRange` 的变更来源（事件回写 vs 外部变更），跳过事件回写后的 `dispatchAction`。

## Capabilities

### Modified Capabilities

- `y-axis-zoom`: Y dataZoom 的 `startValue`/`endValue` SHALL NOT 在 option 配置中设置；图表渲染 SHALL 通过 `dispatchAction` 仅在外部变更（workspace 加载、reset）时设置范围；用户交互时 SHALL 由 ECharts 内部管理，`onDataZoom` 仅读取事件值写入 store。

## Impact

- `src/components/chart/WaterfallChart.tsx`：option dataZoom 配置移除 `startValue`/`endValue`；新增 `yZoomRangeSource` ref 和 `useEffect` 处理外部变更。
- `src/store/uiStore.ts`：无变化。