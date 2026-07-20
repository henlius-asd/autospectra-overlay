## Why

切换交互模式（如点击「框选放大」/「手动移动」/「全局缩放」等工具）或按住/松开空格临时平移时，图表 dataZoom 视口会被重置回全量数据范围（原始视角）。根因：这些过渡会翻转 dataZoom 的 `type`（`'inside'` ↔ 隐藏 `'slider'`），ECharts 重建受影响的 dataZoom 组件并丢弃其内部 `start/end`，而新 option 不含 `startValue/endValue`，于是回退到默认全量。用户每次点击框选缩放工具都会看到视角跳回原始范围，体验断裂。

## What Changes

- 新增视口保持能力：任何 `interactionMode` 变更、以及 `spaceHeld` 翻转，SHALL 保持当前 X 轴（`xRange`）与 Y 轴（`yZoomRange`）的 dataZoom 视口
- 实现方式为「option 重渲染后重派发」：在 `[interactionMode, spaceHeld]` 变化的 `useEffect` 中，用 `requestAnimationFrame` 延迟 `dispatchAction` 把 store 中的 `xRange` 与 `yZoomRange`（非 null 时）重新应用到 `xZoom`/`xZoomSlider`/`yZoom`/`yZoomSlider`，镜像现有 `box-select-zoom` 的 rAF 模式
- **修复 Y 轴实时同步**：`onDataZoom` 不再依赖 `event.batch` 解析 Y 范围（无法捕获滚轮/滑块缩放），改为新增 `getYAxisExtent()` 直读 ECharts Y 轴模型实时视口，对称于 X 轴的 `getXAxisExtent()` 机制；使 `yZoomRange` 滚轮/滑块缩放后实时更新，持久化跨刷新生效
- SHALL NOT 在 option 中设置 Y dataZoom 的 `startValue/endValue`（保持 `y-axis-zoom` 既有约束，避免滚轮缩放抖动）；视口恢复仅经 `dispatchAction` 完成
- 覆盖全部结构相同的模式切换：`select` ↔ `brush` / `pointLabel` / `move` / `zoomGlobal` / `zoomCurve`，以及 `spaceHeld` 在非 `select` 模式下的 A↔B 翻转
- `brace` 模式顺带保持 X 轴视口（重派发至 `xZoomSlider`）；Y 轴 dataZoom 组件在 `brace` 下按既有设计被移除，离开 `brace` 后由 store 中的 `yZoomRange` 恢复
- 无 API 变更，无 breaking changes

## Capabilities

### New Capabilities

- `viewport-preservation`: 交互模式切换与空格临时平移时保持 dataZoom 视口——通过 rAF 延迟 `dispatchAction` 在 option 重渲染后重派发当前 `xRange`/`yZoomRange`，覆盖全部结构相同模式及 `spaceHeld` 翻转

### Modified Capabilities

- `y-axis-zoom`: `dispatchAction` 的触发时机从「仅 workspace 加载恢复」扩展为「workspace 加载恢复 + 交互模式切换/空格平移触发 option 重渲染之后（rAF 延迟）」；保持「option 不含 Y `startValue/endValue`」「`yZoomRange === null` 时不执行 dispatchAction」不变；`onDataZoom` 中 Y 范围同步机制从解析 `event.batch` 改为直读 `getYAxisExtent()` 模型（对称于 X 轴的 `getXAxisExtent()`），使 `yZoomRange` 实时跟踪滚轮/滑块缩放

## Impact

- **WaterfallChart** (`src/components/chart/WaterfallChart.tsx`): 新增 `[interactionMode, spaceHeld]` `useEffect`，rAF 延迟重派发 `xRange`/`yZoomRange`；复用既有 `brushRafId` 取消机制或独立 ref 管理新 rAF
- **uiStore** (`src/store/uiStore.ts`): 无变更（`xRange`/`yZoomRange`/`interactionMode`/`spaceHeld` 已存在）
- **测试**：新增回归测试，覆盖「加载曲线→dataZoom 缩放→切换模式→断言视口未回全量」
- 不变更 `replaceMerge` 配置、不变更 `box-select-zoom` 的框选完成后 rAF 重派发逻辑（与新 effect 并存且一致）
