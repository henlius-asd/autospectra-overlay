## 1. 状态与类型层

- [ ] 1.1 `CurveData` 新增 `color?: string` 字段（`src/types/curve.ts`）
- [ ] 1.2 `curveStore` 新增 `curveScales: Record<string, number>` 状态 + `setCurveScale(id, scale)` action
- [ ] 1.3 `curveStore` 新增 `setCurveColor(id, color)` action，`addCurves` 初始化 `color` 为 `#000000`
- [ ] 1.4 `uiStore` 新增 `yScaleToolMode: boolean`（默认 false）、`activeScaledCurveId: string | null`（默认 null）及其 setter
- [ ] 1.5 `uiStore` 中 `showAxes` 默认值从 `true` 改为 `false`

## 2. 曲线颜色自定义

- [ ] 2.1 `WaterfallChart.tsx`：series lineStyle 颜色改为 `curve.color || '#000000'`（替代 `CURVE_COLORS[visibleIndex % ...]`）
- [ ] 2.2 `CurveList.tsx`：色块颜色改为 `curve.color`，点击色块触发 `<input type="color">` 颜色选择器
- [ ] 2.3 `CurveList.tsx`：颜色选择器 onChange 调用 `setCurveColor` 更新颜色

## 3. 坐标轴默认隐藏

- [ ] 3.1 在 `WaterfallChart.tsx` 和 `exportImage.ts` 中坐标轴相关代码添加 `@deprecated` 注释标记

## 4. Y 轴缩放渲染管线

- [ ] 4.1 `computeYAxisRange.ts`：新增 `curveScales` 参数，遍历时对 `y * scale` 计算 min/max
- [ ] 4.2 `WaterfallChart.tsx`：`option` useMemo 中读取 `curveScales`，渲染数据改为 `y * (curveScales[id] ?? 1) + layerYOffset + offset.yOffset`
- [ ] 4.3 `WaterfallChart.tsx`：`computeYAxisRange` 调用处传入 `curveScales`
- [ ] 4.4 `labelGeometry.ts`：`getTopCurvePixelYAtX` 接收并应用 top curve 的缩放因子

## 5. Y 缩放工具 UI

- [ ] 5.1 `Toolbar.tsx`：新增 "Y缩放" 按钮，与 brace/pointLabel 模式互斥
- [ ] 5.2 新建 `ScaleHandle.tsx`：HTML 覆盖层组件，在选中曲线峰值处渲染可拖拽手柄
- [ ] 5.3 `ScaleHandle.tsx`：实现拖拽交互（mousedown/mousemove/mouseup），计算缩放倍率并调用 `setCurveScale`
- [ ] 5.4 `ScaleHandle.tsx`：手柄旁显示缩放倍率 tooltip（如 ×1.5）
- [ ] 5.5 `WaterfallChart.tsx`：新增 `onChartClick` 事件处理器，在 Y 缩放模式下选中/取消选中曲线
- [ ] 5.6 `WaterfallChart.tsx`：集成 `ScaleHandle` 覆盖层，仅在 `yScaleToolMode && activeScaledCurveId` 时渲染

## 6. 导出与序列化

- [ ] 6.1 `exportImage.ts`：`computeYAxisRange` 调用处传入 `curveScales`
- [ ] 6.2 `exportImage.ts`：`getTopCurvePixelYAtX` 调用时传入缩放因子上下文
- [ ] 6.3 `Toolbar.tsx`：导出 JSON 时包含 `curveScales` 和曲线 `color` 字段
- [ ] 6.4 `Toolbar.tsx`：导入 JSON 时恢复 `curveScales` 和 `color`，缺失时使用默认值

## 7. 集成验证

- [ ] 7.1 验证 Y 缩放后曲线渲染正确、Y 轴范围自适应
- [ ] 7.2 验证多曲线不同缩放倍率下分层与标注位置正确
- [ ] 7.3 验证颜色自定义与持久化正确
- [ ] 7.4 验证坐标轴默认隐藏、手动开启正常
- [ ] 7.5 验证导出图片中缩放和颜色与屏幕一致
- [ ] 7.6 验证旧工作区 JSON 导入兼容性