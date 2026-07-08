## 1. 共享基线与夹取工具

- [ ] 1.1 在 `src/components/chart/` 新增 `labelClamp.ts`，实现 `clampLabelX(px, textW, gridLeft, gridRight, chartWidth)` 与 `clampLabelY(py, labelHalfH, gridTop, plotBottom)` 纯函数，并导出 `estimateTextWidth(label, fontSize)`（系数 0.55）
- [ ] 1.2 在 `WaterfallChart.tsx` 实现并导出 `getTopCurvePixelYAtX(xVal)`：取 `visibleIds[0]`，按 `x+offset.xOffset` 找最近样本（线性插值），叠加 `layerYOffset + offset.yOffset`，经 `convertYToPixel` 返回像素 y；暴露为可被 `exportImage.ts` 复用的形式（如经由模块级函数或共享 helper）
- [ ] 1.3 在 `computeYAxisRange.ts` 确认导出 `rawDataMin` 与 `yRangeForLayer`（已存在），供 brace 峰值基线使用；新增 `topCurvePeak = rawDataMin + yRangeForLayer` 的导出 helper 或在调用处计算

## 2. 点标签贴近曲线 + 去装饰 + 完整显示（屏幕端）

- [ ] 2.1 `PointLabelOverlay.tsx`：将 prop `topCurvePixelY`（单一值）替换为 `getLabelBaseYAtX: (xVal) => number`，标签 `py = baseYAtX(pl.x) + pl.yOffset`
- [ ] 2.2 `PointLabelOverlay.tsx`：新建标签默认 `yOffset` 由 `-20` 改为 `-10`
- [ ] 2.3 `PointLabelOverlay.tsx`：删除每个标签的 `<line>`（虚线）、`<circle>`（原点）、`<rect>`（外框），仅保留 `<text>`
- [ ] 2.4 `PointLabelOverlay.tsx`：对标签 `py` 用 `clampLabelY` 夹取，对 `px` 用 `clampLabelX` + SVG `getBBox()` 精测宽度后夹取
- [ ] 2.5 `WaterfallChart.tsx`：把 `getLabelBaseYAtX` 传给 `PointLabelOverlay`，移除旧的 `topCurvePixelY` prop 链路

## 3. 区域标签贴近曲线 + 可拖动（屏幕端）

- [ ] 3.1 `curveStore.ts`：新增 `updateBrace(id: string, updates: Partial<BraceAnnotation>)` action（与 `updatePointLabel` 对称）
- [ ] 3.2 `WaterfallChart.tsx`：`braceY` 改为 `max(gridTop+8, convertYToPixel(topCurvePeak) - 14)`，`topCurvePeak = rawDataMin + yRangeForLayer`
- [ ] 3.3 `BraceOverlay.tsx`：增加拖拽状态 `{ id, startClientX, origStartX, origEndX }`，svg 上合并 placement 与 drag 的 `onPointerMove/onPointerUp`
- [ ] 3.4 `BraceOverlay.tsx`：brace `<g>` 的 `onPointerDown` 改为启动拖拽（记录起点 + `setPointerCapture`），move 时 `Δx` 经 `convertPixelToX` 换算后 `updateBrace(id, {startX, endX})`（宽度不变）
- [ ] 3.5 `BraceOverlay.tsx`：pointerup 时累计位移 < 5px 视为点击 → 打开编辑浮层（保留 `handleBraceClick`），否则视为拖拽不弹窗
- [ ] 3.6 `BraceOverlay.tsx`：brace 文字水平夹取（`clampLabelX`）

## 4. 导出跟随 showAxes + 标注一致（导出端）

- [ ] 4.1 `exportImage.ts`：导出前 `structuredClone(instance.getOption())` 快照；构建 exportOpt：`legend.show=false`、`dataZoom=[{type:'inside', xAxisIndex:0, start, end}]`（start/end 从原 slider 拷贝）、`grid.top/bottom` 按 `showAxes` 收紧（开：20/40；关：8/8）
- [ ] 4.2 `exportImage.ts`：`setOption(exportOpt, { replaceMerge:['legend','dataZoom','grid','xAxis','yAxis','series'], lazyUpdate:false })` → `getDataURL` → 合成 SVG → `setOption(snapshot, { replaceMerge:[...] })` 还原（finally 保证还原）
- [ ] 4.3 `exportImage.ts`：重新读取 `option.grid` 拿新的 `gridTop/gridBottom` 供 brace/点标签像素换算，替换原硬编码兜底值（L80-82、L102）
- [ ] 4.4 `exportImage.ts`：brace 基线改用 `topCurvePeak` 公式（与屏幕端一致）；点标签 `py` 改用 `getTopCurvePixelYAtX(pl.x) + pl.yOffset`
- [ ] 4.5 `exportImage.ts`：删除点标签的 `lineEl`/`dotEl`/`rectEl`，仅保留 `textEl`
- [ ] 4.6 `exportImage.ts`：点标签/brace 文字用 `clampLabelX/clampLabelY`（导出用 `estimateTextWidth` 估算）夹取

## 5. 验证

- [ ] 5.1 `rtk vitest`（或 `rtk test`）跑现有测试，确认 `computeYAxisRange.test.ts` 等不受影响
- [ ] 5.2 `rtk tsc` 类型检查通过
- [ ] 5.3 手动验证：导出 PNG 不含图例/预览条；showAxes 开关分别导出；点标签贴近曲线上方无外框；brace 可拖动且点击仍可编辑；标签靠近边界不裁切；导出后图表状态还原无闪烁
