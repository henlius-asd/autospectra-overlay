## Context

`WaterfallChart.tsx` 的 `option` useMemo 依赖 `interactionMode` 与 `spaceHeld`。这两个值变化时，dataZoom 构造器（`:284-305`）按 `disableInside = interactionMode !== 'select' && !spaceHeld` 翻转各 dataZoom 项的 `type`：`select`（或按住空格）下为 `type: 'inside'`，其余模式下为隐藏 `type: 'slider'`（`show: false`）。`ReactECharts` 以 `replaceMerge={['series','dataZoom','brush']}`（`:590`）应用新 option。

翻转 `type` 使 ECharts 重建受影响的 dataZoom 组件并丢弃其内部 `start/end`；新 option 不含 `startValue/endValue`，故重建后回退到默认全量数据范围——即用户观察到的"每次点击框选缩放工具都回到原始视角"。该复位在所有结构相同的模式切换（`select` ↔ `brush`/`pointLabel`/`move`/`zoomGlobal`/`zoomCurve`）以及 `spaceHeld` 翻转时均会发生；`brace` 仅保留 `xZoomSlider`，进入/退出同样复位 X。

既有约束（`y-axis-zoom` spec）：Y dataZoom 的 `startValue/endValue` SHALL NOT 写入 option（"用户交互期间 SHALL 由 ECharts 内部管理"，scenario "滚轮缩放平滑无断层 — option 不含 startValue/endValue，ECharts 内部状态不被覆盖"）。既有 zoom-apply 模式（`box-select-zoom` spec）：框选完成后用 `requestAnimationFrame` 延迟 `dispatchAction` 重派发，以穿越 `replaceMerge` 重渲染周期。

观察（非本变更范围）：当前代码 `replaceMerge={['series','dataZoom','brush']}` 与归档的 `fix-echarts-series-replace-merge` 设计意图 `replaceMerge={['series']}`（dataZoom 走 merge、按 id 原地保持）存在分歧——`'dataZoom'`/`'brush'` 系后期（toolbar-tool-system 前后）加入。这可能是回归引入源之一，但本变更不改动 `replaceMerge` 列表（见 Decision 7 / Open Questions）。

## Goals / Non-Goals

**Goals:**
- 任何 `interactionMode` 变更与 `spaceHeld` 翻转之后，X/Y dataZoom 视口保持不变
- 覆盖全部结构相同模式（`select` ↔ `brush`/`pointLabel`/`move`/`zoomGlobal`/`zoomCurve`）+ `spaceHeld` 翻转
- `brace` 的 X 视口保持；Y 在 `brace` 下按既有设计移除、退出后由 store 恢复
- 不违反 `y-axis-zoom` 的"option 不含 Y `startValue/endValue`"约束
- 不在用户滚轮/滑块缩放期间触发重派发（避免抖动）

**Non-Goals:**
- 不改动 `replaceMerge` 配置
- 不改动 `box-select-zoom` 框选完成后的既有 rAF 重派发逻辑
- 不改动 `uiStore`（字段已具备）
- 不解决 `replaceMerge` spec/code 分歧（`'brush'` 是否应在列表中）
- 不引入 `pointLabel`/`move`/`zoomGlobal`/`zoomCurve` 各自的 spec 修改——视口保持由统一的新能力 `viewport-preservation` 覆盖

## Decisions

### 1. 选择 Strategy B（rAF 延迟重派发）而非 Strategy A（option 注入 start/end）

**方案**：新增 `[interactionMode, spaceHeld]` 的 `useEffect`，在 option 重渲染后用 `requestAnimationFrame` 延迟 `dispatchAction` 把 store 中的 `xRange`/`yZoomRange` 重派发到 `xZoom`/`xZoomSlider`/`yZoom`/`yZoomSlider`。

**理由**：
- `y-axis-zoom` spec 明确禁止在 option 中写 Y `startValue/endValue`（避免滚轮缩放时 option 覆盖 ECharts 内部状态导致抖动）。Strategy A（向 option 注入 start/end）会违反该约束并可能重新引入 Y 滚轮抖动。
- 代码库既有的 zoom-apply 模式即为 rAF 延迟 `dispatchAction`（`box-select-zoom` 的 `handleBrushSelected`），Strategy B 与之一致。
- Strategy B 对根因的两个竞争理论均成立：无论 ECharts 是因 `replaceMerge` 含 `'dataZoom'` 销毁重建（T1）、还是因 `type` 翻转重建（T2）而丢 `start/end`，重渲染后重派发都能恢复视口。无需先确认精确机制即可保证修复正确。

**替代方案**：
- Strategy A（option 注入）：被拒——违反 `y-axis-zoom`、有抖动风险。
- Strategy D（把 `replaceMerge` 改回 `['series','brush']`，让 dataZoom 走 merge）：被搁置——未经验证（merge 下 `type` 翻转是否仍重建、是否遗留陈旧 dataZoom 如 `brace` 进入时），且改动 `replaceMerge` 影响面更大。留作 Open Question，未来可用回归测试探针评估。

### 2. effect 依赖仅为 `[interactionMode, spaceHeld]`，重派发时用 `useUiStore.getState()` 读值

**方案**：effect 依赖数组只含 `[interactionMode, spaceHeld]`；rAF 回调内通过 `useUiStore.getState().xRange` / `.yZoomRange` 读取最新值。

**理由**：
- 依赖不含 `xRange`/`yZoomRange`，则用户滚轮/滑块缩放（`xRange`/`yZoomRange` 频繁变化）时 effect 不重跑、不重派发——ECharts 内部状态不被覆盖，缩放平滑无抖动。重派发只在"确实发生了 type 翻转重建"的模式/空格切换时触发，精准命中根因。
- 用 `getState()` 而非闭包变量，避免闭包过期读到旧值。

### 3. useLayoutEffect 同步重派发（无 rAF），在 paint 前恢复

**方案**：视口保持 effect 使用 `useLayoutEffect`（而非 `useEffect`），且 `dispatchAction` 同步执行（不包 `requestAnimationFrame`）。

**理由**：`echarts-for-react` 是 class component，`componentDidUpdate` 在 DOM commit 后、浏览器 paint 前同步调用 `setOption`（重建 dataZoom → 全量）。React 的 effect 执行顺序为子→父，故 `useLayoutEffect` 在 `componentDidUpdate` 之后、paint 之前运行 → 同步 dispatch 恢复视口 → 用户看不到中间的全量帧。若用 `useEffect`（paint 后异步）或包 `rAF`（下一帧），则 setOption 的全量帧会先 paint → 闪烁。

**替代方案**：`requestAnimationFrame` 延迟重派发——被拒，rAF 在下一帧执行，setOption 的全量帧先 paint 导致闪烁。`useEffect` 同步——被拒，useEffect 在 paint 后运行，同样闪烁。

**`handleBrushSelected` 的 rAF 保留**：`handleBrushSelected` 是 ECharts 事件回调（非 React effect），在 setOption 之前同步执行，其 rAF 确保 dispatch 在 setOption 重渲染之后执行——与视口 effect 的 `useLayoutEffect` 场景不同，rAF 仍是必要的。

### 4. `brace` 的处理

**方案**：effect 对 `brace` 一视同仁——重派发 `xZoom`/`xZoomSlider`/`yZoom`/`yZoomSlider`。`brace` 下仅 `xZoomSlider` 存在，对其余 id 的 `dispatchAction` 为 no-op（由 `try-catch` 吞掉 ECharts 对未知 dataZoomId 的处理）。X 经 `xZoomSlider` 保持；Y 组件在 `brace` 下按既有设计被移除，退出 `brace` 后由 store 中 `yZoomRange` 恢复。

**理由**：避免为 `brace` 写特判分支；统一逻辑覆盖更广，且与"Y 在 brace 按设计保留现状"一致（不在 brace 期间额外造 Y 组件）。

### 5. 跳过首次挂载运行

**方案**：effect 用一个 `hasMounted` ref，首次（挂载）运行时只置位、不调度 rAF；仅自第一次 `interactionMode`/`spaceHeld` 真实变化起才重派发。

**理由**：挂载时 `onChartReady` 已负责应用 `yZoomRange`；effect 若在挂载即重派发，可能与 `onChartReady` 竞态且无意义。仅对真实过渡重派发即可。

### 6. 与 `handleBrushSelected` 既有 rAF 并存

**方案**：不改动 `handleBrushSelected` 的 rAF 重派发。框选完成时 `setInteractionMode('select')` 触发新 effect 调度一次 rAF，与 `handleBrushSelected` 自身 rAF 读取同一 store 值（已被同步更新）重派发同值。

**理由**：两者一致、不冲突。移除 `handleBrushSelected` 的 rAF 属额外重构，超出本变更范围；仅在 design 标注未来可简化。

### 7. 不改动 `replaceMerge` 列表

**方案**：保持 `replaceMerge={['series','dataZoom','brush']}` 不变。

**理由**：Strategy B 不依赖 `replaceMerge` 的具体内容；改动列表影响面大（series 移除语义、brush 销毁、陈旧 dataZoom 残留等），且 spec/code 在 `'brush'` 是否应入列表上已有分歧，需独立评估。本变更聚焦视口保持，不耦合该问题。

### 8. onDataZoom Y 轴同步改为模型直读（getYAxisExtent）

**方案**：新增 `getYAxisExtent()` 函数（对称于 `getXAxisExtent()`），从 ECharts 模型直读 Y 轴实时视口。`onDataZoom` 不再解析 `event.batch` 获取 Y 范围（无法捕获滚轮/滑块缩放事件的 batch），改为调用 `getYAxisExtent()` 并与 `currentYZoom` 比较，Y 范围变化时写入 `yZoomRange`（设置 `yZoomRangeSource='event'` 守卫防回环）。

**理由**：诊断（栈追踪 + 订阅日志）证实 `yZoomRange` 仅被框选（`handleBrushSelected`）和持久化（`loadWorkspace`）写入，不被滚轮/滑块缩放写入——导致 `yZoomRange` 陈旧。X 轴通过 `getXAxisExtent()` 在 `onDataZoom` 中实时同步 `xRange` 已验证有效；Y 轴对称使用同一机制。`yZoomRange` 实时后：持久化跨刷新生效（修复预存 bug）；`[yZoomRange]` effect 的 `yZoomRangeSource` 守卫保证滚轮缩放时 `dispatchAction` 被跳过（`'event'`），workspace 加载恢复时正常执行（`'external'`）；视口保持 effect 重派发的是实时值 → 不再缩 Y。

**替代方案**：在视口 effect 中只重派发 X（跳过 Y）——被拒，Y 模式切换仍会复位（回退原始 bug）。effect 中读 ECharts 实时 Y 状态——被拒，post-recreation 已丢失实时态。使 `yZoomRange` 跟踪实时 Y 是唯一治本方案。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| rAF 时序脆弱（重派发早于重渲染完成则被覆盖） | 镜像 `box-select-zoom` 已验证的 rAF 模式；回归测试断言重派发后视口正确 |
| 框选完成后双 rAF 重派发 | 两者读同一 store 值、重派发同值，无闪烁；如需可后续移除 `handleBrushSelected` rAF |
| 精确 ECharts 机制（T1 销毁重建 vs T2 type 翻转重建）未实证 | Strategy B 对两者均成立；实现阶段的回归测试（首次失败、修复后通过）即反馈环，将顺带确认机制 |
| `brace` 下对不存在 id 的 `dispatchAction` 可能产生异常 | `try-catch` 吞掉；与既有 `handleBrushSelected` 的容错策略一致 |
| 挂载竞态 `onChartReady` | `hasMounted` ref 跳过首次运行；rAF 回调内 `if (!chartInstance) return` |

## Open Questions

- ECharts 在 `replaceMerge` 含 `'dataZoom'` 时究竟是"销毁重建"（T1）还是"按 id 原地更新、仅 type 翻转时重建"（T2）？实现阶段用回归测试确认；若证实为 T1 且仅移除 `'dataZoom'` 即可修复，可在后续变更评估 Strategy D 作为更小修复。
- `replaceMerge` 中 `'brush'` 是否应保留（spec 写 `['series','dataZoom']`，代码写 `['series','dataZoom','brush']`）？为既有 spec/code 分歧，与本变更解耦，留待独立处理。
