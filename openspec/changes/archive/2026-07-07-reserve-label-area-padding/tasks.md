## 1. 定义 buffer 常量

- [x] 1.1 在 `WaterfallChart.tsx` 顶部（`getChartInstance` 附近）定义并导出常量 `LABEL_PADDING_RATIO = 0.15`，供 exportImage 复用

## 2. WaterfallChart — yMaxForAxis 增加 buffer

- [x] 2.1 在 option useMemo 中，将 `yMaxForAxis` 从 `yRangeForLayer` 改为 `yRangeForLayer * (1 + LABEL_PADDING_RATIO)`
- [x] 2.2 确认 yAxis 配置 `min: 0, max: yMaxForAxis` 仍引用更新后的值（无需改 yAxis 配置本身）

## 3. WaterfallChart — maxY 增加 buffer

- [x] 3.1 在 maxY useMemo 中，将返回值从 `rawDataMax / (1 - spacingBudget)` 改为乘以 `(1 + LABEL_PADDING_RATIO)`（safety fallback 分支同样乘以该系数）

## 4. ExportImage — maxY 增加 buffer

- [x] 4.1 从 `WaterfallChart.tsx` 导入 `LABEL_PADDING_RATIO`
- [x] 4.2 在 exportImage.ts 的 maxY 计算中，将返回值乘以 `(1 + LABEL_PADDING_RATIO)`（safety fallback 分支同样处理）

## 5. 验证

- [x] 5.1 运行 `npx tsc --noEmit` 确认无类型错误
- [x] 5.2 运行 `npx vitest run` 确认测试通过
- [x] 5.3 运行 `npx vite build` 确认构建成功
- [x] 5.4 手动验证：加载曲线 + 添加 brace/point label，确认标签完整显示在 y 轴顶部预留区域内不被裁切
  - **补充修复**：移除 dataZoom 中的 `{ type: 'inside', yAxisIndex: 0 }`，恢复只缩放 x 轴；同步简化 onDataZoom 只同步 xRange。根因是 y 轴缩放会改变可视 yExtent，使曲线超出预留区/标签错位。
- [x] 5.5 手动验证：导出图片中标签位置与网站一致（用户确认一致）
