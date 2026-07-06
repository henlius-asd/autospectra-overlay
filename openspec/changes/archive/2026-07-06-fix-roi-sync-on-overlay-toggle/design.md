## Context

当前 `WaterfallChart` 中存在一个初始化 effect（`useEffect(..., [curves, visibleCurves])`），它在 `curves` 或 `visibleCurves` 引用变化时，取第一条可见曲线的数据首尾点（`Math.floor(data[0][0])` / `Math.ceil(data[last][0])`）作为全量数据范围写入 `uiStore.xRange`。该 effect 把两个职责混在了一起：

1. 首次出现可见曲线时，给 `xRange` 一个合理的初始值；
2. 在任意可见性切换（加入/移出叠图、全选/取消全选）后，覆写 `xRange`。

职责 2 是 bug 来源：ECharts 因 `replaceMerge={['series']}` 会保留 dataZoom 视口（屏幕真实可视范围不变），但 store 里的 `xRange` 被覆写成全量范围，于是 `AlignmentControls` 的 ROI 同步 effect（`useEffect(..., [xRange])`）把 ROI 抄成全量范围，与屏幕可视范围脱钩。

既有读取真实可视范围的工具函数 `getXAxisExtent()`（`WaterfallChart.tsx` 内）已存在，`onChartReady` 与 `onDataZoom` 均通过它写入 `xRange`。本变更复用它。

## Goals / Non-Goals

**Goals:**
- 让 `uiStore.xRange` 始终代表 ECharts 的真实可视范围，而非全量数据范围。
- 可见性切换不再覆写既有 `xRange`，ROI 因此与可视范围保持一致。
- 首次出现可见曲线时仍能正确初始化 `xRange`（取真实可视范围，回退到数据首尾点取整）。

**Non-Goals:**
- 不改动 `AlignmentControls` 的 ROI 同步 effect 逻辑（它本身是正确的被动同步，根因不在它）。
- 不改动 `replaceMerge` 策略本身（保留 series 替换合并、dataZoom 合并的既有行为）。
- 不引入新的状态管理库或新的 store 字段。
- 不解决"曲线数据 x 范围不一致时 xAxis min/max 取哪条"的次要问题（仍用既有"所有可见曲线全局 min/max"逻辑）。

## Decisions

### 决策 1：用 `getXAxisExtent()` 替代数据首尾点作为 `xRange` 写入来源

**选择**：初始化 effect 写 `xRange` 时，调用 `getXAxisExtent()` 读取 ECharts 真实可视范围；读取失败（返回 `null`，例如 chart 实例尚未就绪）时回退到既有"数据首尾点取整"逻辑。

**理由**：`getXAxisExtent()` 已被 `onChartReady` / `onDataZoom` 使用，是既有的"真实可视范围"来源，语义一致、零新增依赖。直接复用避免引入第二条读取路径。

**备选**：
- 方向 A（仅在"无 xRange"时写入）——能止住覆写，但首次初始化仍写全量范围，与真实视口可能不一致（若 ECharts 默认 nice 取整或 dataZoom 有初始 start/end）。本变更选择"读真实视口"以更准确。
- 方向 C（ROI 直接读 chart 实例、绕过 store）——消除 `xRange` 语义混用，但改动面更大，且 `xRange` 还被 `BraceOverlay` 的坐标换算消费，不能轻易绕过 store。留作未来重构。

### 决策 2：收敛 effect 的写入时机——仅"首次出现可见曲线"时初始化

**选择**：将"职责 2（任意可见性切换都覆写）"移除。effect 仍以 `[curves, visibleCurves]` 为依赖（或等价的"可见曲线集合"信号），但内部仅当"此前无可见曲线、本次出现可见曲线"且"store 中尚无有效 `xRange`（或 `xRange` 仍为默认 `[0, 10]` 且未由 dataZoom 写过）"时才执行写入。

**理由**：可见性切换后真实视口由 ECharts 保留，store 不应再插一次值；唯一需要写入的时点是"从无图到有图"的初次落地。

**实现要点**：用一个 ref（如 `hasInitializedXRange`）或检查 `useUiStore.getState().xRange` 是否已被 `onChartReady`/`onDataZoom` 写过，避免重复写。具体判定在 `tasks.md` 落实。

### 决策 3：读取时机必须在 chart 完成 option 落地之后

**选择**：初始化写入若读 `getXAxisExtent()`，需确保读的是本次 option 更新后的视口。React effect 在渲染提交后执行，但 ECharts 异步渲染可能尚未完成；必要时改用 `onChartReady` 路径或 `setOption` 回调/`setTimeout(..., 0)` 延后一拍，或退化为"首次初始化用数据首尾点取整、由随后 `onChartReady` 的 `getXAxisExtent()` 修正"。

**理由**：读旧视口会把 `xRange` 写成上一次的范围，引入新的不一致。`onChartReady` 已能在 chart 就绪时写入真实视口，可作为兜底修正路径。

## Risks / Trade-offs

- [读 `getXAxisExtent()` 拿到旧视口或 `null`] → 增加回退分支：读取失败时回退到数据首尾点取整，并由 `onChartReady` 随后修正；`onChartReady` 已是既有兜底路径。
- [判定"是否首次初始化"的状态不准，导致该写时没写、或不该写时仍写] → 优先用 store 内 `xRange` 是否仍为默认值 `[0, 10]` 且未被 dataZoom 改过作为判据；保持判定逻辑简单可测。
- [回归：加载首条曲线后 ROI 不再自动设置] → 在 `tasks.md` 与 spec 场景"加载曲线后 ROI 自动设置"中显式覆盖手测。
- [回归：对齐操作后 ROI 漂移] → 对齐不触发可见性变化，不经过本 effect；但仍纳入回归手测。

## Migration Plan

- 仅前端代码变更，无数据迁移、无 API 变更。
- 部署即生效；旧 `xRange` 行为被新行为直接替换。
- 回滚策略：还原 `WaterfallChart` 初始化 effect 至数据首尾点取整写法即可。

## Open Questions

- "首次出现可见曲线"的判据是用 ref 标记，还是读 `useUiStore.getState().xRange` 是否仍为默认 `[0, 10]`？倾向后者（无新增状态），在 `tasks.md` 中确定。
