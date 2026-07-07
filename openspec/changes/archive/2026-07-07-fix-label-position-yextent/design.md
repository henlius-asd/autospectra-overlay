## Context

当前 WaterfallChart 组件使用瀑布图模式渲染多条谱线，通过 `layerSpacing` 滑块控制 Y 轴层间距。区域标签（brace）和点标签（point label）需要定位在所有可见曲线的上方。

当前实现中，`layerYOffset` 和 `maxY` 的计算使用 `uiStore.yRange`（初始值 `[0, 1]`，仅在 `onChartReady` 和 `onDataZoom` 时更新），而像素坐标转换使用 ECharts 实际 `yExtent`（从 `getModel()` 读取）。两者不一致导致标签位置错误。

**关键代码位置**:
- `WaterfallChart.tsx:120-129` — series 数据的 `layerYOffset` 计算
- `WaterfallChart.tsx:248-264` — `maxY` 计算
- `WaterfallChart.tsx:235-246` — `convertYToPixel` 使用 ECharts `yExtent`
- `exportImage.ts:91-110` — 导出时的 `maxY` 和像素转换
- `uiStore.ts:36` — `yRange` 初始值 `[0, 1]`

## Goals / Non-Goals

**Goals:**
- 统一 `layerYOffset` 和 `maxY` 计算使用 ECharts 实际 `yExtent`
- 网站渲染和导出渲染使用完全一致的计算逻辑
- 区域标签和点标签始终定位在所有可见曲线的上方
- 窗口 resize 时 Y 轴范围正确同步

**Non-Goals:**
- 不改变瀑布图的视觉分层效果
- 不改变 `layerSpacing` 滑块的行为和范围
- 不引入新的状态管理方案（不重构 zustand store）

## Decisions

### Decision 1: 从 ECharts 模型读取实际 yExtent 替代 store yRange

**选择**: 在 `useMemo` 中通过 `chartInstance` 读取 ECharts 实际 `yExtent`，用它替代 `yRange` 计算 `layerYOffset` 和 `maxY`。

**备选方案**:
- A) 在每次 render 前强制同步 `yRange` 到 ECharts 实际值 → 需要额外的副作用，可能导致闪烁
- B) 给 yAxis 设置显式 `min`/`max` → 限制了 ECharts 的 auto-scale 灵活性

**理由**: 方案 1 最简洁——直接读取权威数据源（ECharts 模型），避免 store 与渲染状态不同步。

### Decision 2: 提取共享的 yExtent 读取为独立函数

**选择**: 将 `getYAxisExtent()` 的调用结果 memoize，在 `useMemo` 的依赖中加入 `chartInstance` 变化检测。

**备选方案**: 每次重新计算 → 性能开销大

**理由**: `yExtent` 仅在图表初始化、dataZoom、resize 时变化，memoize 避免重复计算。

### Decision 3: 添加 resize 监听同步 yRange

**选择**: 在 `onChartReady` 中添加 `window.addEventListener('resize', ...)` 监听，在 resize 时更新 `yRange`。

**备选方案**: 依赖 ECharts 内置 resize 事件 → ECharts 的 `resize` 事件不一定在容器尺寸变化时触发

**理由**: 直接监听 window resize 更可靠，确保 store 中的 `yRange` 始终反映最新状态。

### Decision 4: 导出逻辑复用网站的水印计算

**选择**: `exportImage.ts` 的 `maxY` 和像素转换逻辑与 `WaterfallChart.tsx` 保持一致，都从 ECharts 实例读取实际 `yExtent`。

**备选方案**: 导出时使用独立的计算 → 可能再次产生不一致

**理由**: 单一数据源原则，导出与网站共享相同的计算路径。

## Risks / Trade-offs

- **[chartInstance 在 useMemo 中可能为 null]** → 在 `useMemo` 开始时检查 `chartInstance` 是否可用，若不可用则 fallback 到 store `yRange` 计算，确保首次渲染不会崩溃
- **[ECharts getModel() 是私有 API]** → 已有 `as any` 类型断言处理，风险可控；ECharts 6.x 中此 API 稳定
- **[resize 监听可能过于频繁]** → 使用与 `onDataZoom` 相同的防抖模式，避免性能问题
