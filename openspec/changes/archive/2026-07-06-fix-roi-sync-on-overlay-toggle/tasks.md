## 1. 改造 `WaterfallChart` 的 `xRange` 写入逻辑

- [x] 1.1 在 `src/components/chart/WaterfallChart.tsx` 中，定位初始化 effect（当前依赖 `[curves, visibleCurves]`，写入数据首尾点取整范围），改为：仅当"可见曲线集合由空变为非空"且"store 中 `xRange` 仍为默认 `[0, 10]` 且未被 `onChartReady`/`onDataZoom` 写过"时才执行写入。 *(实现备注：采用 `hasInitializedXRange` ref 作为"是否已初始化"判据，比"store xRange 是否仍为默认 [0,10]"更鲁棒——避免数据范围恰好为 [0,10] 或 onChartReady 已写入真实范围时的误判。ref 在 visibleIds 归零时重置。)*
- [x] 1.2 写入时优先调用 `getXAxisExtent()` 读取真实可视范围；返回 `null` 或读到的范围与当前 store `xRange` 一致时回退到既有"数据首尾点取整"逻辑（`Math.floor(data[0][0])` / `Math.ceil(data[last][0])`），确保首次加载仍能给出合理初始值。
- [x] 1.3 确保读取 `getXAxisExtent()` 的时机在本次 option 落地之后；若 effect 内读到旧视口，则改为依赖 `onChartReady` 兜底修正（`onChartReady` 已调用 `getXAxisExtent()` 写入），effect 内仅在确实需要初始化时写入。
- [x] 1.4 移除"任意 `visibleCurves` 引用变化即覆写 `xRange`"的副作用，保证可见性切换（加入/移出叠图、全选/取消全选）不再触发 `setXRange`。
- [x] 1.5 检查 `xAxis` 的 `min`/`max` 取整数据范围逻辑保持不变（仍由 `option` 的 `xMin`/`xMax` 显式设置），不受本变更影响。

## 2. 验证 `AlignmentControls` ROI 同步无需改动

- [x] 2.1 确认 `src/components/toolbox/AlignmentControls.tsx` 的 ROI 同步 effect（`useEffect(..., [xRange])`）逻辑不变；仅依赖 store `xRange`，无需修改源码。
- [x] 2.2 在变更说明中记录"ROI 修正源于 `xRange` 不再被覆写"，避免后续误改 ROI effect。 *(已记录于 design.md 决策 1 与本任务备注：ROI effect 本身正确，根因在 WaterfallChart 覆写 xRange。)*

## 3. 回归验证（手测，覆盖 spec 场景）

- [x] 3.1 加载曲线并勾选显示：ROI 自动设置为取整后的数据范围，与 xAxis 范围一致（覆盖 `alignment-behavior` "加载曲线后 ROI 自动设置"）。 *(人工验证通过)*
- [x] 3.2 缩放到特定 X 轴范围（如 `[500, 1500]`）后，将一条未叠图曲线加入叠图区：`xRange` 与 ROI 均保持 `[500, 1500]`，图表视口不变（覆盖 "加入叠图后 ROI 不被重置"）。 *(人工验证通过)*
- [x] 3.3 缩放后取消勾选某条可见曲线（保留至少一条可见）：`xRange` 与 ROI 保持当前可视范围（覆盖 "移出叠图后 ROI 不被重置"）。 *(人工验证通过)*
- [x] 3.4 缩放后点击"全选"/"取消全选"：`xRange` 与 ROI 保持当前可视范围（覆盖 "全选切换后 ROI 不被重置"）。 *(人工验证通过)*
- [x] 3.5 缩放后切换基线曲线：ROI 自动更新为当前可视范围（覆盖 "切换基线后 ROI 更新"）。 *(人工验证通过)*
- [x] 3.6 缩放后点击"一键对齐"：图表 dataZoom 视口与 ROI 保持不变（覆盖 `alignment-behavior` "对齐后缩放状态不变" 与 `echarts-series-replace-merge` "对齐算法在对齐后 series 正确更新"）。 *(人工验证通过)*
- [x] 3.7 通过 `rtk tsc` / `rtk lint` 确认无类型与 lint 回归。 *(`rtk tsc` 无错误；`vite build` 通过；项目未配置 ESLint，lint 不适用。)*
