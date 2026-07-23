## Context

`WaterfallChart.tsx` 的 `option.dataZoom` 在 `interactionMode === 'brace'` 分支只返回 `[{ id: 'xZoomSlider', ... }]`，移除了 `yZoom`/`yZoomSlider`。由于 ReactECharts 用 `replaceMerge={['series','dataZoom','brush']}` 合并，被移除的组件被销毁，ECharts 内部 `start/end` 丢失，Y 轴坍塌回 `yAxisFullRange`。补救链路（`isOptionRebuilding` guard + 依赖 `[interactionMode, spaceHeld]` 的 viewport restore `useLayoutEffect`）虽运行，但其 `dispatchAction` 打到已不存在的 `yZoom`/`yZoomSlider` ID 被 ECharts 静默忽略，故 Y 在 brace 期间无法保持；直到 `BraceOverlay.handlePointerUp` 调 `setInteractionMode('select')` 重建组件后才恢复。

同族的 `select`↔`zoomGlobal` 切换已采用"保持 `type: 'inside'` 不变 + `disabled: true`"方案（见 correction `datazoom_type_switch_resets_zoom`），使组件不被重建、`start/end` 不丢。但 brace 分支未对该方案对齐。

`viewport-preservation` spec 当前的覆盖范围条款把"brace 下移除 yZoom/yZoomSlider"描述为既定设计，且 brace Scenario 只断言 X 视口，是 bug 在 spec 层的漏网点。

## Goals / Non-Goals

**Goals:**
- brace 模式期间 Y 轴缩放视口不坍塌，与 X 视口同样在 brace 全程保持。
- 对齐已有的 `disabled` 保留组件方案，最小改动、不引入新 dataZoom 结构。
- 钉住 e2e 回归：`select → brace → select` 断言 Y 视口（当前 H3 只测 X）。
- 修正 `viewport-preservation` spec 的 brace 覆盖范围契约。

**Non-Goals:**
- 不改 brace 放置交互本身（拖拽预览、标签编辑浮层、双击编辑、Esc 取消）。
- 不重构 dataZoom 配置的整体结构或抽出独立模块。
- 不处理 X 视口（X 已由 `xZoomSlider` 正常保持）。
- 不改 `isOptionRebuilding` guard 与 viewport restore `useLayoutEffect` 的依赖数组（它们对 brace 仍适用，保留组件后重派发变为 no-op 但无害）。

## Decisions

### Decision 1: brace 分支返回完整四组件，而非只返回 `xZoomSlider`

**选择**：`interactionMode === 'brace'` 时，`dataZoom` 数组返回与 `select` 相同结构的最小集（`xZoom`、`xZoomSlider`、`yZoom`、`yZoomSlider`），`type` 与 `id` 与 `select` 完全一致，组件不被 `replaceMerge` 销毁，ECharts 维持内部 `start/end`，Y 视口不坍塌。

**理由**：`replaceMerge` 按新数组替换 dataZoom 组件；被移除的 ID 被销毁、重建时从 full range 起。保留 ID + `type` 不变时，ECharts 不重建组件实例，`start/end` 保留——这是 `select`↔`zoomGlobal` 已验证的行为。

**替代方案**：
- 在 brace 分支给 `yZoom`/`yZoomSlider` 写死 `startValue`/`endValue`（取自 store）。否决：违反 `y-axis-zoom` spec（"Y dataZoom 的 `startValue`/`endValue` SHALL NOT 在 option 配置中设置"），且 brace→select 切换的 `replaceMerge` 重建仍会因组件销毁重置。
- 保留组件但全部 `disabled`（含 `xZoomSlider`）。否决：破坏原 brace 设计"X slider 可拖"的意图（用户放置 brace 时常需微调 X 视口定位）。

### Decision 2: brace 下 `disabled` 取值——冻结 Y、保留 X slider

**选择**：brace 下 `xZoom`、`yZoom`、`yZoomSlider` 设 `disabled: true`（冻结滚轮/slider 缩放），`xZoomSlider` 保持可用（用户可拖 X slider）。其余字段（`minValueSpan`、`filterMode`、`orient`、`left/width`）与 `select` 分支一致。

**理由**：
- 冻结 Y 视口：放置 brace 时 Y 范围应稳定，避免误滚轮/误拖 Y slider 改变 Y 视口干扰 `convertYToPixel` 定位。
- 保留 `xZoomSlider` 可用：对齐原 brace 设计意图（X slider 辅助定位），且 X 视口变化不触发 Y 坍塌。
- `disabled` 对 slider 类型同样阻止用户交互但保留 zoom 范围（与 inside 一致语义）。

**`disabled` 必须每次 setOption 显式发射**：复用 select 分支已确立的规则——ECharts 按字段合并，省略 `disabled` 不会清除旧值（correction `datazoom_type_switch_resets_zoom` 已踩过此坑，见 `WaterfallChart.tsx:481-487` 注释）。brace→select 切换时 `select` 分支已显式发 `disabled: disableInside`， brace 分支也须显式发 `disabled: true`/对应取值。

### Decision 3: spec 修正——brace 覆盖范围与 Scenario

**选择**：MODIFY `viewport-preservation` 的"交互模式切换与空格平移时保持 dataZoom 视口" Requirement，改写覆盖范围中 brace 条款为"四组件均保留、`disabled` 冻结交互、Y 视口不坍塌"，并把 brace Scenario 从"保持 X 视口"改为"保持 X 与 Y 视口"。

**理由**：spec 原把 brace 移除 yZoom 当既定设计、且 Scenario 只测 X，是 bug 漏网的契约根源；不同步修 spec，修复会在下次 spec-driven 审查中被"还原"。

## Risks / Trade-offs

- **[yZoomSlider `disabled: true` 是否真阻止 slider 拖拽]** → 依赖 ECharts slider 的 `disabled` 语义（与 inside 一致）。Mitigation：e2e 在 brace 下断言 `getYExtent()` 等于 store `yZoomRange`、且拖 Y slider 不改变 Y 视口。
- **[brace SVG overlay 与保留的 yZoomSlider 指针竞争]** → yZoomSlider 位于 `left: 42` 区域；brace overlay wrapper `pointerEvents: none`，仅拖拽预览区 `pointerEvents: auto`。`disabled` slider 本应不抢指针。Mitigation：手测 brace 拖拽放置仍正常，预览不跳。
- **[replaceMerge 保留组件实例、维持 start/end 的假设]** → 该假设已在 `select`↔`zoomGlobal` 路径被 e2e H2 验证（同 type 不重建）。Mitigation：H3 补 Y 断言即对此假设的回归保护。
- **[trade-off: brace 下 yZoomSlider 仍占左侧 14px 空间]** → 与 select 一致，无额外视觉回归；原 brace 移除它时左侧无 slider，恢复后多出 slider。可接受（与 select 视觉一致，符合用户心智模型）。
