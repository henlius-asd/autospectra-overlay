## Why

将曲线从未叠图（staging）加入叠图区后，ROI 区间会被重置为全量数据范围（"默认区间"），而不是用户当前缩放后的 X 轴可视范围。根因在于 `WaterfallChart` 的初始化 effect（依赖 `[curves, visibleCurves]`）在每次可见性切换时都用**曲线数据首尾点算出的全量范围**覆写 `uiStore.xRange`，而 ECharts 的 dataZoom 视口本身被 `replaceMerge` 保留——导致 store 里的 `xRange` 与屏幕真实可视范围脱钩，`AlignmentControls` 的 ROI 同步 effect 跟着把 ROI 抄成全量范围。用户必须再次缩放/平移（触发 `onDataZoom`）才能让 ROI 重新对齐可视范围。

## What Changes

- 修改 `WaterfallChart` 中负责写 `uiStore.xRange` 的初始化 effect：不再用曲线数据首尾点（`Math.floor(data[0][0])` / `Math.ceil(data[last][0])`）计算全量范围写入，改为通过既有 `getXAxisExtent()` 读取 ECharts 真实可视范围后写入。
- 该 effect 的写入时机收敛为：仅在没有有效 `xRange`、或可见曲线集合从空变非空（首次出现可见曲线）时执行初始化写入；纯可见性切换（已有可视范围、且视口被 `replaceMerge` 保留）不再覆写 `xRange`。
- 由于读取 ECharts 实例需要在 chart 更新落地之后，effect 的依赖与取值时机相应调整（例如在 `onChartReady` / `onDataZoom` 既有路径之外，确保初始化写入读的是更新后的真实视口，而非旧视口或数据首尾点）。
- `AlignmentControls` 的 ROI 同步 effect 不再需要改动——只要 store 的 `xRange` 不被错误覆写，ROI 即可与可视范围保持一致。

## Capabilities

### New Capabilities
<!-- 无新增能力，仅修正现有能力的实现行为。 -->

### Modified Capabilities
- `alignment-behavior`: "ROI 范围跟随 X 轴可视范围"需求调整——`xRange` 的来源由"曲线数据首尾点取整"改为"ECharts 真实可视范围"；并明确可见性切换（加入/移出叠图）不得重置 `xRange` 与 ROI。
- `echarts-series-replace-merge`: 补充一条场景，明确 series 更新（可见性切换/删除）后，store 中的 `xRange` 与 dataZoom 视口一同保持不变，不被初始化逻辑覆写。

## Impact

- 代码：`src/components/chart/WaterfallChart.tsx`（初始化 effect 与 `getXAxisExtent` 的使用时机）、可能涉及 `src/components/toolbox/AlignmentControls.tsx`（无需逻辑改动，但验证 ROI 同步）。
- 依赖：无新增依赖；复用既有 `getXAxisExtent()` 与 `useUiStore.setXRange`。
- 风险：ECharts 实例在 effect 执行时可能尚未完成本次 option 落地，需确保读取可视范围的时机在 chart 更新之后，避免读到旧视口；首次加载（无既有 `xRange`）仍应正确初始化为数据范围。
- 测试：当前相关符号均无覆盖测试，本变更应在 `tasks.md` 中纳入手测/回归验证步骤（加载→缩放→加入叠图→确认 ROI 与可视范围一致）。
