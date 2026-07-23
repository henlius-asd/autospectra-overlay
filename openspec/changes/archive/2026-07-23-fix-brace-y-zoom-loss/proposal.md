## Why

用户在放大 Y 轴后进入区间标签放置模式（`brace`）时，Y 轴缩放视图会坍塌回全量范围，放置完成自动切回 `select` 后又恢复。根因是 `brace` 分支的 `dataZoom` 配置只返回 `xZoomSlider`，**移除了 `yZoom`/`yZoomSlider` 组件**，ECharts `setOption(replaceMerge)` 重建时 Y 缩放随之消失；而负责补救的 viewport restore `useLayoutEffect` 虽在模式切换时运行，但其 `dispatchAction` 打到的 `yZoom`/`yZoomSlider` ID 此刻已不存在，被 ECharts 静默忽略，无法恢复。这与已记录的 `datazoom_type_switch_resets_zoom` correction 同族——该方案（保持 `type` 不变、用 `disabled: true` 保留组件）已应用于 `select`/`zoomGlobal` 切换分支，但 `brace` 分支仍走"移除组件"的老路，所以 bug 在该路径上漏网。

## What Changes

- `brace` 模式分支不再移除 `yZoom`/`yZoomSlider` dataZoom 组件，改为保留它们并设 `disabled: true`（与 `select`↔`zoomGlobal` 切换已采用的方案对齐），使 ECharts 在 `replaceMerge` 重建时不丢失 Y 缩放的内部 `start/end`。
- brace 期间 X 轴继续由 `xZoomSlider` 承载（行为不变）；`xZoom`/`yZoom`/`yZoomSlider` 改为保留但 `disabled`，避免 brace 放置拖拽与 dataZoom 交互冲突。
- 修正 `viewport-preservation` spec 中将"brace 下移除 yZoom/yZoomSlider"描述为"既定设计"的覆盖范围条款：brace 期间 SHALL 同时保持 X 与 Y 视口。
- 在 `e2e/viewport-preserve.spec.ts` 的 H3（`select → brace → select`）断言中补齐 Y 视口保留检查（当前只测 X），钉住此回归。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `viewport-preservation`: brace 模式覆盖范围的行为变更——从"brace 下移除 yZoom/yZoomSlider、Y 视口仅在退出 brace 后恢复"改为"brace 期间同样保持 Y dataZoom 组件与 Y 视口不坍塌"，并新增/修改 Scenario 明确 brace 期间 Y 视口保持契约。

## Impact

- **代码**：`src/components/chart/WaterfallChart.tsx` 的 `option.dataZoom` useMemo 中 `interactionMode === 'brace'` 分支（约 `Line 469-471`）。
- **测试**：`e2e/viewport-preserve.spec.ts` H3 用例补 Y 断言；可能需在 DEV test seam（`window.__autospectra`）补一个镜像 `dispatchXZoom` 的 `dispatchYZoom` 以便 e2e 注入可信 Y 缩放（滚轮真实事件受 Playwright 合成事件限制）。
- **Spec**：`openspec/specs/viewport-preservation/spec.md` 覆盖范围条款与 brace Scenario。
- **风险**：保留的 `yZoom`/`yZoomSlider` 在 brace 期间 `disabled`，不应干扰 brace SVG overlay 的指针拖拽（overlay `pointerEvents` 已由自身控制，canvas 拿不到事件）；需验证 brace 拖拽放置仍正常。
