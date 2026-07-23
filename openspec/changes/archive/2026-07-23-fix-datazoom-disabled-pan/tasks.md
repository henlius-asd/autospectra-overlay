## 1. 修复 WaterfallChart dataZoom disabled 字段

- [x] 1.1 将 `xInside` 从条件三元改为始终显式写入 `disabled: disableInside`（`src/components/chart/WaterfallChart.tsx`）
- [x] 1.2 将 `yInside` 从条件三元改为始终显式写入 `disabled: disableInside`（同上）
- [x] 1.3 添加注释说明 ECharts setOption 按字段合并、省略字段不清除旧值的语义

## 2. 回归测试

- [x] 2.1 创建 `e2e/brush-then-pan.spec.ts`：控制组（store 设缩放后平移）+ 回归组（brush 后平移）
- [x] 2.2 添加 `assertPanned` 辅助函数，断言窗口位移且 span 保持（区分平移 / 重框选 / 无操作）
- [x] 2.3 运行 `npx playwright test e2e/brush-then-pan.spec.ts` 验证修复前红、修复后绿

## 3. e2e helpers 抽取（消除重复）

- [x] 3.1 创建 `e2e/helpers.ts`，集中 DEV seam 访问器、`waitForViewportSettled`、`prepareChartWithFullExtent` 等
- [x] 3.2 更新 `e2e/viewport-preserve.spec.ts` 改为 import from helpers，内联 `getUiState` 调用替换为 helper
- [x] 3.3 更新 `e2e/brush-then-pan.spec.ts` 改为 import from helpers，移除重复定义

## 4. 验证

- [x] 4.1 运行 `npx tsc --noEmit` 通过
- [x] 4.2 运行 `npx playwright test` 全量 11 项通过（含既有 box-select-zoom、viewport-preservation H1–H5、color-picker 无回归）
- [x] 4.3 grep 确认无 `[DEBUG-brush]` 仪表残留

## 5. OpenSpec 文档对齐

- [x] 5.1 创建 `proposal.md`
- [x] 5.2 创建 `design.md`
- [x] 5.3 创建 `specs/box-select-zoom/spec.md` delta（MODIFIED: Brush Mode Activation 机制描述 + ADDED: disabled 显式清除）
- [x] 5.4 创建 `specs/viewport-preservation/spec.md` delta（MODIFIED: type 切换 → disabled 机制）
- [x] 5.5 创建 `tasks.md`（本文档）