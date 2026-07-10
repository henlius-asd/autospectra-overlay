## Context

当前系统有单曲线缩放工具（`CurveScaleOverlay` + `curveScaleMath`），通过 Y 缩放模式选中曲线后用滚轮/拖拽调节 `curveScales` 和 `curveScaleOffsets`。但这套工具只能逐条调节，缺少「所有曲线一起缩放」和「一键归一化」的能力。

渲染公式现状（`WaterfallChart.tsx:225`）：
```
rendered_y = y * scale + scaleOffset + layerYOffset + offset.yOffset
```
其中 `scale = curveScales[id] ?? 1`，`scaleOffset = curveScaleOffsets[id] ?? 0`。

Y 轴范围计算（`computeYAxisRange.ts`）仅用原始未缩放数据，而 `WaterfallChart` 已改为 `clip: true`，缩放曲线可能被裁剪。

## Goals / Non-Goals

**Goals:**
- 三层复合缩放模型：归一化层 × 全局层 × 手动层 = 最终倍率
- 归一化：一次性动作，各曲线峰值对齐到基准线峰值
- 全局缩放：滚轮调节所有曲线共享的倍率
- 单曲线缩放：滚轮调节单条曲线的手动倍率（保留 Shift+拖拽平移）
- Y 轴范围自动跟随缩放数据，避免裁剪
- 持久化新字段到 workspace JSON

**Non-Goals:**
- 标注（brace/point-label）几何跟随缩放（既有 gap，后续处理）
- 全局偏移（平移所有曲线）
- 多基准归一化（面积/参考曲线/自定义 target）
- 拖拽缩放（显式弃用）

## Decisions

### D1: 三层字段进现有 curveStore（方案 A）

**选择**：在 `curveStore` 新增 `normalizeFactors`（`Record<string, number>`）和 `globalScale`（`number`），复用 `curveScales` 为手动层。渲染时相乘。

**替代方案**：
- 烘焙归一进手动层：违反「三层各自倍率共同作用」的用户需求，无法单独清除/重算归一层。
- 新建独立 scaleStore：undo 需另套 zundo 并跨 store 协调，复杂度高，且现有 curveStore 统一 undo 会被拆碎。

**理由**：最小改动，undo 统一在现有 zundo 中，完全符合三层各自倍率的数据模型。

### D2: 两个独立缩放按钮（非三态循环）

**选择**：用 `globalScaleMode: boolean` 和 `perCurveScaleMode: boolean` 两个独立开关替代三态 `scaleMode`。工具栏两个按钮各自独立 on/off，可同时激活。缩放仅用滚轮（`scaleByWheel`），弃用拖拽缩放（`scaleByDrag`）。保留 Shift+拖拽做单曲线平移（`offsetByDrag`）。

**当两者同时激活时**：滚轮优先作用于单曲线（如有选中曲线），否则作用于全局。

**替代方案**：三态循环 off→split→merge→off（已实现但用户反馈：需点两次才能到全局、两个工具不应互斥、无法同时调两层）。独立按钮让用户直接跳到任一工具，两个倍率独立持久、相乘生效。

**理由**：用户明确要求「两个工具分开，分别控制一个缩放比率，然后相乘」。独立开关比三态循环更符合此意图。

### D3: 归一基准 = 基准线峰值（非 1）

**选择**：`normalizeAllPeak(xRange)` 计算 `baselinePeak`（最底可见曲线峰值），然后每条可见曲线 `factor = baselinePeak / curvePeak`。按可见 X 范围计算（与 `CurveScaleOverlay` 算 `originalMin/Max` 一致）。

**理由**：用户明确要求「整体高度一致」而非「归一为 1」；基准线是瀑布图锚点，以其为参照最自然。

### D4: 归一因子不钳制

**选择**：`normalizeFactors` 不经过 `clampScale`（`[0.1, 10]`），全局层和手动层仍钳制。

**理由**：归一因子是数据驱动的精确校正（`targetPeak / curvePeak`），若峰值极小则因子需极大。钳制会破坏归一精度。用户通过滚轮调 global/manual 时钳制已在上层起作用。

### D5: computeYAxisRange 扩展为按缩放数据计算

**选择**：`computeYAxisRange` 接受 `normalizeFactors`、`globalScale`、`curveScales`、`curveScaleOffsets` 参数，从缩放后数据（`y * composite + scaleOffset`）算 `rawDataMin/Max`，使 Y 轴范围容纳缩放曲线。

**理由**：`clip:true` 下，缩放放大曲线会被裁剪，归一（小峰拉到基准）一般不超原始范围，但全局缩放和手动放大必须轴范围跟随。若统一 span 假设破坏，回退为按每曲线缩放后取全局 max。

### D6: 移除全屏覆盖层，改用原生事件监听

**选择**：删除 `CurveScaleOverlay` 的 `<div className="absolute inset-0 z-20" pointerEvents: 'auto'>` 全屏覆盖层。改用 `useRef` 获取图表容器，在 `useEffect` 中 `addEventListener('wheel', handler, { passive: false })` 挂载滚轮监听，`addEventListener('mousedown', ...)` 挂载 shift+drag 平移。Badge 改为 `pointerEvents: 'none'` 的纯展示元素。

**根因**：React 17+ 的合成 `onWheel` 是 passive listener，`e.preventDefault()` 无效，ECharts 的 `inside` dataZoom 抢占滚轮事件导致全局缩放无反应（Bug 2）。同时覆盖层 z-20 拦截了图表点击，阻止曲线选中（Bug 1 根因之一）。

**理由**：原生 `addEventListener` 可指定 `{ passive: false }`，`preventDefault` 有效；移除覆盖层让 ECharts click 事件正常触发，图表渲染区可点击选中曲线。

### D7: 统一曲线选中态

**选择**：删除 `activeScaledCurveId`，`selectedCurveId` 成为唯一选中态，同时驱动：MetadataPanel 显示、CurveList 高亮、缩放目标。CurveList 点击始终设 `selectedCurveId`（不再分支模式）。ECharts series 加 `id: curveId`，`onEvents` 加 `click` 处理器 `setSelectedCurveId(params.seriesId)`。

**根因**：`activeScaledCurveId`（缩放选中）与 `selectedCurveId`（元数据选中）是两个独立状态，split 模式点击只设前者、普通点击只设后者，导致元数据面板不跟随缩放选中、缩放目标不跟随元数据选中。图表渲染区无 click 事件，无法点曲线选中。

**理由**：单一选中态消除碎片化，任何来源的选中（列表、图表）都更新同一个 `selectedCurveId`，所有面板自动同步。

## Risks / Trade-offs

**R1: clip:true + Y 轴范围按原始数据算** → 任务 4 必须让 Y 范围跟随缩放数据，否则缩放放大曲线不可见。需对照 `fix-negative-y-rendering` 既有改动验证不回归。

**R2: undo 粒度** → 滚轮每次事件写 store（与现有 per-curve 行为一致），归一为单次 `set()` 一条目。可接受。

**R3: 标注不跟随缩放** → `getTopCurvePixelYAtX` / brace 几何用原始数据，标注在缩放曲线上位置偏移。列为后续，不在本方案核心范围。

**R4: 原生事件监听器生命周期** → `addEventListener` 必须在 `useEffect` cleanup 中 `removeEventListener`，否则组件卸载后泄漏。需确保 chart 容器 ref 稳定。

**R5: ECharts click 与 wheel 竞争** → 原生 wheel listener 的 `preventDefault` 在非 passive 模式下有效，能阻止 ECharts 的 dataZoom。但 click 事件由 ECharts 正常处理（不再被覆盖层拦截）。需验证两者不互相干扰。