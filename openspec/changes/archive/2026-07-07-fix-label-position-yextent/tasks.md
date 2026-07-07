## 1. WaterfallChart — Y 轴范围计算修复

- [x] 1.1 在 WaterfallChart 组件中提取 `useMemo` 依赖的 `yExtent` 值：通过 `chartInstance` 调用 `getYAxisExtent()` 获取 ECharts 实际 Y 轴范围，fallback 到 store `yRange`
- [x] 1.2 将 series 渲染中 `layerYOffset` 的计算乘数从 `yRange` 改为 `yExtent`（WaterfallChart.tsx:120-129）
- [x] 1.3 将 `maxY` 计算中的 `layerYOffset` 乘数从 `yRange` 改为 `yExtent`（WaterfallChart.tsx:248-264）
- [x] 1.4 在 `onChartReady` 中添加 `window.addEventListener('resize', ...)` 监听，resize 时重新读取 `yExtent` 并更新 store `yRange`
- [x] 1.5 在组件卸载时移除 resize 监听器

## 2. ExportImage — 导出逻辑对齐

- [x] 2.1 将 `exportImage.ts` 中 `maxY` 计算的 `layerYOffset` 乘数从 `yRange` 改为从 ECharts 实例读取的实际 `yExtent`（exportImage.ts:91-110）
- [x] 2.2 确保导出时 brace 和 point label 的像素转换也使用同一 `yExtent` 值

## 3. 验证

- [x] 3.1 手动验证：加载多条曲线，设置 layerSpacing > 0，确认区域标签和点标签位于所有曲线上方（后续变更 reserve-label-area-padding 进一步修复了标签位置漂移和预留区域问题）
- [x] 3.2 手动验证：调整浏览器窗口大小后，标签位置仍然正确（后续变更新增显式 yAxis 边界 + 移除 y 轴缩放，已稳定）
- [x] 3.3 手动验证：导出图片中，标签位置与网站渲染一致（用户确认一致）
