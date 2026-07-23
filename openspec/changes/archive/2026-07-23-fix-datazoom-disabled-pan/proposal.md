## Why

框选放大后回到 select 模式时，拖拽平移画布（inside dataZoom drag-pan）完全无响应——画布无法移动。根因是 inside dataZoom 的 `disabled` 字段在 brush 模式设为 `true` 后，切换回 select 模式时**省略**该字段，而 ECharts `setOption` 按字段合并，省略即保留原值 `true`，导致 inside dataZoom 持续禁用，指针事件被吞、不触发 dataZoom 事件。用户角度：框选放大后画布"卡死"。

## What Changes

- 修复 `WaterfallChart.tsx` 中 `xZoom`/`yZoom` inside dataZoom 的 `disabled` 字段：始终显式写入 `disabled: disableInside`（而非在 select 模式下省略该字段），迫使 ECharts 合并时覆盖残留的 `true` 为 `false`。
- 添加回归测试 `e2e/brush-then-pan.spec.ts`：控制组（store 设缩放后平移）+ 回归组（brush 后平移），断言窗口位移且 span 保持，区分平移 / 重框选 / 无操作。
- 抽取 `e2e/helpers.ts` 集中 DEV seam 访问器，`viewport-preserve.spec.ts` 与 `brush-then-pan.spec.ts` 改为 import，消除重复实现带来的漂移风险。

## Capabilities

### New Capabilities

（无新增能力——此为 bug 修复）

### Modified Capabilities

- `box-select-zoom`: 更新 "dataZoom inside disabled during brush mode" 需求：将机制描述从"替换为隐藏 slider 类型"修正为"设置 `disabled: true` 并保持 `type: 'inside'`"（与既有 `datazoom_type_switch_resets_zoom` 修正一致）。新增需求：退出 brush 回到 select 时 SHALL 显式写入 `disabled: false`（非省略），确保 inside dataZoom 恢复响应拖拽平移/滚轮缩放。
- `viewport-preservation`: 修正需求描述中"dataZoom 的 `type`（`'inside'` ↔ 隐藏 `'slider'`）"的过时表述，改为 `disabled` 机制。

## Impact

- 影响文件：`src/components/chart/WaterfallChart.tsx`（xZoom/yZoom 两处，各加一个字段）
- 新增测试：`e2e/brush-then-pan.spec.ts`、`e2e/helpers.ts`
- 修改测试：`e2e/viewport-preserve.spec.ts`（import 重构，无断言变更）
- 无 API 变更，无 breaking changes