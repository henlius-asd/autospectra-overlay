## Context

当前 `WaterfallChart.tsx` 使用 `echarts-for-react` 的 `ReactECharts` 组件渲染色谱图，未设置 `notMerge` 属性（默认 `false`）。ECharts 的 `setOption` 在 `notMerge: false` 模式下会合并新旧 option，其中 series 数组的合并行为是：新 option 中未包含的旧 series 会被保留。这导致曲线取消勾选或删除后，对应的 series 仍残留在图表中。

直接使用 `notMerge={true}` 会完全替换 option，导致 dataZoom 组件也被重置，触发 `onDataZoom` 事件 → `setXRange` → `AlignmentControls` 的 ROI 同步链，破坏对齐算法的正确性。

## Goals / Non-Goals

**Goals:**
- 取消勾选曲线后，对应的 series 从图表中移除
- 删除曲线后，对应的 series 从图表中移除
- 保持 dataZoom 缩放状态不丢失
- 保持对齐算法（ROI 峰值对齐和互相关对齐）的行为不变
- 保持 `BraceOverlay` 坐标转换正常工作

**Non-Goals:**
- 不改变曲线的上传/加载行为（`addCurves` 默认可见性保持与 spec 一致）
- 不改变对齐算法的计算逻辑
- 不改变 undo/redo 功能

## Decisions

### Decision 1: 使用 `replaceMerge={['series']}` 替代 `notMerge={true}`

**选择**: 在 `ReactECharts` 上设置 `replaceMerge={['series']}`

**理由**:
- `replaceMerge` 是 ECharts 5.x 提供的精确替换机制，允许指定哪些组件类型使用替换而非合并
- `replaceMerge={['series']}` 仅替换 series 数组，其他组件（dataZoom、xAxis、yAxis、grid、legend）仍走 merge 逻辑
- 完全避免了 `notMerge={true}` 的副作用（dataZoom 重置 → xRange 被覆盖 → ROI 被重置）

**替代方案考虑**:
- `notMerge={true}`: 已排除，会导致 dataZoom 重置，破坏对齐算法
- 手动清理: 在 `option` 中跟踪旧 series 并手动清除，方案复杂且易出错
- 使用 ECharts 的 `chartInstance.clear()` + `setOption`: 等同于 `notMerge={true}`，同样有副作用

### Decision 2: 回退 `addCurves` 中 `visibleCurves` 的初始化修改

**选择**: 从 `addCurves` 中移除 `visibleCurves[id] = true` 的初始化逻辑

**理由**:
- 现有 spec `curve-visibility-control` 明确规定"上传曲线默认不渲染"（Requirement: 上传曲线默认不渲染）
- 之前的修改是为了让曲线加载后立即可见，但这与 spec 矛盾
- 用户通过"全选"按钮即可一次性显示所有曲线

### Decision 3: 不修改 `curveStore` 的其他逻辑

**选择**: `toggleCurveVisibility`、`removeCurve`、`removeSelectedCurves` 保持现有实现不变

**理由**:
- 这些 action 的 store 更新逻辑是正确的（创建新对象引用，触发 React 重渲染）
- 问题出在 ECharts 层的 series 合并行为，而非 store 层的状态更新

## Risks / Trade-offs

- **Risk**: `replaceMerge` 是 ECharts 5.x 的特性，需要确认当前 echarts 版本支持
  - **Mitigation**: 项目使用 `echarts-for-react@^3.0.6`，底层依赖 echarts 5.x，`replaceMerge` 已在 5.3.0+ 中稳定支持

- **Risk**: 如果 ECharts 合并行为有其他依赖（如某些组件依赖 series 的合并语义）
  - **Mitigation**: `replaceMerge` 仅影响 series 组件，其他组件行为不变。当前图表配置中其他组件（xAxis、yAxis、dataZoom、grid）不依赖 series 的合并语义

- **Trade-off**: 曲线数量变化时 dataZoom 滑块保持原位，可能显示不直观的缩放范围
  - **Mitigation**: 这是预期行为，用户可以通过 dataZoom 滑块手动调整。比 `notMerge={true}` 的强制重置更友好