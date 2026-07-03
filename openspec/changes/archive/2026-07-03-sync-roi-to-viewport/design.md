## Context

`WaterfallChart` 和 `AlignmentControls` 是兄弟组件，分别位于 `CenterPanel` 和 `RightPanel`。当前 `WaterfallChart` 用本地 `useState` 追踪 `xRange`，`AlignmentControls` 无法访问。需要将 `xRange` 提升到共享的 `uiStore`，使两者能通过 zustand store 通信。

## Goals / Non-Goals

**Goals:**
- 用户缩放/平移图表时，ROI 输入框自动更新为当前可视范围
- 改动最小化，不破坏现有组件封装

**Non-Goals:**
- 不修改对齐算法
- 不更改 ROI 输入框的交互方式（仍可手动编辑）
- 不添加"锁定 ROI"等高级功能

## Decisions

**Decision: `xRange` 放入 `uiStore` 而非 `curveStore`**

`xRange` 是纯 UI 状态（图表视口），与曲线数据无关，放入 `uiStore` 语义正确。`curveStore` 已有 zundo 中间件，放入会产生不必要的撤销历史。

**Decision: `WaterfallChart` 使用 `useUiStore.getState().setXRange()` 而非 hook selector**

`onDataZoom` 是高频回调（缩放时连续触发），使用 `getState()` 直接写入避免不必要的组件重渲染。`xRange` 的读取仍通过 `useUiStore(s => s.xRange)` selector，确保 `convertXToPixel` 等函数使用最新值。

**Decision: ROI 跟随 `xRange` 自动同步，手动编辑在下次 zoom 时覆盖**

简化实现：`useEffect([xRange])` 同步 `roiStart`/`roiEnd`。用户手动输入的值保留到下次 zoom 事件。这符合"ROI = 当前可视范围"的语义。

## Risks / Trade-offs

- [Risk] 高频 zoom 事件触发 store 更新 → zustand 的 selector 比对机制确保仅 `xRange` 订阅者重渲染，性能影响可忽略
- [Risk] 初始加载时 `xRange` 为 `[0, 10]`，ROI 短暂显示错误值 → 图表 `onChartReady` 很快更新为实际范围，用户几乎不可见