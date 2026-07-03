## 1. WaterfallChart — 恢复 onChartReady 中的 xRange 精炼

- [x] 1.1 在 `onChartReady` 中恢复 `getXAxisExtent()` 调用，更新 `xRange` 为图表实际范围

## 2. AlignmentControls — 直接从 baselineCurve 初始化 ROI

- [x] 2.1 新增 `useEffect([baselineCurve])`，从基线曲线数据直接设置 `roiStart`/`roiEnd`

## 3. Verification

- [x] 3.1 TypeScript 编译检查通过
- [x] 3.2 Vite build 成功
- [x] 3.3 手动验证：首次加载曲线 → ROI 显示图表实际可视范围（需在应用中验证）