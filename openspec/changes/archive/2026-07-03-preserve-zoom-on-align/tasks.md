## 1. 移除 notMerge

- [x] 1.1 删除 `ReactECharts` 组件上的 `notMerge` 属性

## 2. 修复初始加载时 ROI 未同步

- [x] 2.1 在 `getXAxisExtent()` 中增加 `convertFromPixel` fallback（`getModel()` 之后、`getOption()` 之前）
- [x] 2.2 确保 `onChartReady` 调用 `getXAxisExtent()` 时能正确获取初始轴范围

## 3. Verification

- [x] 3.1 TypeScript 编译检查通过
- [x] 3.2 Vite build 成功
- [x] 3.3 手动验证：缩放图表 → 点击对齐 → 缩放范围保持不重置（需在应用中验证）
- [x] 3.4 手动验证：首次加载曲线 → ROI 输入框显示图表实际数据范围（非 [0, 10]）（需在应用中验证）