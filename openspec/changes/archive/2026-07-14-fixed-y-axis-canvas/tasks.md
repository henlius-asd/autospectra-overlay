## 1. computeYAxisRange 改为全量数据计算

- [x] 1.1 `src/components/chart/computeYAxisRange.ts`：移除 `xRange` 形参，遍历改为 `for (const [, yVal] of curve.data)` 无条件统计全部数据点（仅 `yVal + offset.yOffset` 调整）
- [x] 1.2 更新文件头注释，说明 Y 画布基于全量数据、X 平移/缩放时保持稳定

## 2. 同步更新调用方

- [x] 2.1 `src/components/chart/WaterfallChart.tsx`：`yAxisFullRange` 调用摘除 `xRange` 实参，`useMemo` 依赖列表由 `[visibleIds, curves, offsets, xRange, layerSpacing]` 改为 `[visibleIds, curves, offsets, layerSpacing]`
- [x] 2.2 `src/components/chart/exportImage.ts`：`computeYAxisRange` 调用摘除 `xRange` 实参（`xRange` 变量保留用于 X→像素换算与标注过滤）
- [x] 2.3 `src/components/chart/exportPptx.ts`：`computeYAxisRange` 调用摘除 `xRange` 实参（`xRange` 变量保留同上）

## 3. 测试更新

- [x] 3.1 `src/components/chart/__tests__/computeYAxisRange.test.ts`：移除各用例的 `xRange` 实参
- [x] 3.2 新增"全量数据、忽略 X 视口（固定画布）"用例，验证全量 `rawDataMin/Max/dataSpan` 与 X 窗口无关

## 4. 验证与回归

- [x] 4.1 `npx vitest run` 全绿（91/91）
- [x] 4.2 `npx tsc --noEmit` 干净
- [x] 4.3 人工回归：X 平移/缩放不改变 Y 轴范围与层位置；PNG/PPTX 导出与屏幕视图一致
