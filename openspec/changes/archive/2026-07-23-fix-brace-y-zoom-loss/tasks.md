## 1. E2E RED 回路（先钉住 bug）

- [x] 1.1 在 `src/components/chart/WaterfallChart.tsx` 的 DEV test seam（`window.__autospectra`，约 `Line 32-48`）新增 `dispatchYZoom(start, end)`：镜像已有的 `dispatchXZoom`，对 `yZoom` 与 `yZoomSlider` 两个 ID 各发一次 `{ type: 'dataZoom', dataZoomId, startValue, endValue }`，用于 e2e 注入可信 Y 缩放（滚轮真实事件受 Playwright 合成事件限制，参照 correction `color_input_playwright_synthetic_event_limitation`）。
- [x] 1.2 在 `e2e/helpers.ts` 暴露四个 helper：`getYExtent`（调 seam `getYExtent`）、`getStoreYZoomRange`（从 `getUiState().yZoomRange` 读）、`setStoreYZoomRange`（调 store 的 setter）、`dispatchYZoom`（调 seam `dispatchYZoom`）。命名与现有 `getXExtent`/`setStoreXRange` 对称。
- [x] 1.3 在 `e2e/viewport-preserve.spec.ts` 的 H3（`select → brace → select`，约 `Line 95-114`）补 Y 视口断言：进 brace 前用 `dispatchYZoom` 注入 Y∈[y0, y1] 子范围并 `waitForViewportSettled`，断言 `getStoreYZoomRange` 与 `getYExtent` 均为该子范围；切到 `brace` 后断言 `getYExtent()` 仍等于该 Y 子范围（当前会 RED：返回 `yAxisFullRange`）；切回 `select` 后断言 Y 子范围恢复。同时在 brace 期间补一条断言：Y 视口未坍塌（即 `getYExtent()` 等于进 brace 前的 Y 子范围）。
- [x] 1.4 运行 `npx playwright test e2e/viewport-preserve.spec.ts -g "H3"` 确认 **RED**：Y 在 brace 期间坍塌为全量范围。记录失败输出作为诊断凭证。

## 2. 代码修复（brace 分支保留组件）

- [x] 2.1 修改 `src/components/chart/WaterfallChart.tsx` 的 `option.dataZoom` useMemo 中 `interactionMode === 'brace'` 分支（约 `Line 468-502`）：不再 `return [{ id: 'xZoomSlider', ... }]`，改为返回与 `select` 分支相同结构的完整四组件（`xZoom`、`xZoomSlider`、`yZoom`、`yZoomSlider`），`id`/`type`/`minValueSpan`/`filterMode`/`orient`/`left`/`width` 字段与 `select` 完全一致；其中 `xZoom`、`yZoom`、`yZoomSlider` 设 `disabled: true` 冻结交互，`xZoomSlider` 保持可用（不设 `disabled`）。
- [x] 2.2 确认 `disabled` 字段在 brace 与 select 两个分支均显式发射（不省略），避免 brace→select 切换时残留 `disabled: true` 静默吞输入（correction `datazoom_type_switch_resets_zoom` 已踩过此坑，见 `WaterfallChart.tsx:481-487` 注释）。
- [x] 2.3 运行 `npx playwright test e2e/viewport-preserve.spec.ts -g "H3"` 确认 **GREEN**：Y 在 brace 期间与退出后均保持子范围。

## 3. 验证与回归

- [x] 3.1 运行 `npx playwright test e2e/viewport-preserve.spec.ts` 全部用例（H1/H2/H3/H4/H5/brush）确认无回归。
- [x] 3.2 运行 `npx playwright test e2e/brush-then-pan.spec.ts` 确认 brace 相关拖拽-平移交互无回归（该 spec 历史上因 `disabled` 拋留导致 drag-pan 失效，见 `brush-then-pan.spec.ts:16-20` 注释）。
- [x] 3.3 运行 `npx vitest run src/components/chart/__tests__/viewportRestore.test.ts` 确认 viewport restore 单元测试通过。
- [x] 3.4 手测：dev 模式下放大 Y 轴 → 进 brace 放置区间标签 → 确认 Y 视口不坍塌、brace 拖拽预览正常、放置后标签编辑浮层出现、`yZoomSlider` 不抢指针（`disabled` 生效）、X slider 仍可拖。
- [x] 3.5 运行 `npx tsc --noEmit` 确认类型检查通过。

## 4. Spec 同步与归档

- [x] 4.1 确认 `openspec/changes/fix-brace-y-zoom-loss/specs/viewport-preservation/spec.md` delta 已落（MODIFIED Requirement + brace Y Scenario + brace 期间 Y 冻结 Scenario）。
- [x] 4.2 实现完成后运行 `openspec validate fix-brace-y-zoom-loss` 确认变更工件一致（已通过）；随后按项目流程 sync delta 到主 spec 并归档（`openspec sync` / `archive`）——待 3.4 手测确认后执行。
