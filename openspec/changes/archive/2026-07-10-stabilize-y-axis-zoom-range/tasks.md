## 1. 稳定 Y 轴全量范围（Fix 1）

- [x] 1.1 在 `WaterfallChart.tsx` 新增 `yAxisFullRange` useMemo，遍历所有可见曲线全部数据点（不按 `xRange` 过滤），计算 `yAxisMin`、`yAxisMax`、`rawDataMin`、`rawDataMax`、`dataSpan`、`yRangeForLayer`，公式与 `computeYAxisRange` 一致（padding、LABEL_PADDING_RATIO 等）
- [x] 1.2 将 `yAxis.min/max` 从 `rangeResult.yAxisMin/yAxisMax` 改为 `yAxisFullRange.yAxisMin/yAxisMax`
- [x] 1.3 将 `convertYToPixel` 的 fallback 从 `rangeResult.yAxisMin/yAxisMax` 改为 `yAxisFullRange.yAxisMin/yAxisMax`（`visibleYRange` 为 null 时）
- [x] 1.4 将 `CurveScaleOverlay` 的 `visibleFrame` fallback 从 `rangeResult.yAxisMin/yAxisMax` 改为 `yAxisFullRange.yAxisMin/yAxisMax`

## 2. 移除 option 中二次 clamp（Fix 2）

- [x] 2.1 在 option useMemo 的 dataZoom 配置中，移除 `normalizeYZoomRange` 调用，直接使用 `yZoomRange[0]`/`yZoomRange[1]` 作为 `startValue/endValue`
- [x] 2.2 确认 `onDataZoom` 中的 `normalizeYZoomRange` 规整逻辑不变（用户操作时仍做 clamp）

## 3. replaceMerge 加入 dataZoom（Fix 3）

- [x] 3.1 将 `ReactECharts` 的 `replaceMerge` 从 `['series']` 改为 `['series', 'dataZoom']`

## 4. 验证与回归

- [x] 4.1 `npx vitest run` 全绿
- [x] 4.2 `npx tsc --noEmit` 干净
- [x] 4.3 `npm run build` 成功
- [x] 4.4 人工回归：X 缩放不改变 Y 范围；Y slider 操作正常；bracePlacementMode 切换正常；showGrid 切换不闪烁 dataZoom