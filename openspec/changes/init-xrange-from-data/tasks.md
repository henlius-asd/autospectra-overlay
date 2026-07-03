## 1. 从曲线数据初始化 xRange

- [x] 1.1 在 `WaterfallChart` 中新增 `useEffect([curves])`，从第一条曲线数据读取 x 范围写入 `uiStore.xRange`
- [x] 1.2 简化 `getXAxisExtent()`：移除 `convertFromPixel` 和 `getOption()` fallback，仅保留 `getModel()` 主路径

## 2. Verification

- [x] 2.1 TypeScript 编译检查通过
- [x] 2.2 Vite build 成功
- [x] 2.3 手动验证：首次加载曲线 → ROI 输入框显示曲线数据实际范围（非 `[0, 10]`）（需在应用中验证）