## 1. 提取共享 Y 轴范围计算函数

- [ ] 1.1 在 `src/components/chart/` 下新建 `computeYAxisRange.ts`，导出纯函数 `computeYAxisRange(visibleIds, curves, offsets, xRange, layerSpacing)`，返回 `{ rawDataMin, rawDataMax, dataSpan, yRangeForLayer, yAxisMin, yAxisMax, maxY }`
- [ ] 1.2 函数内部同时追踪 `rawDataMin` 和 `rawDataMax`，用 `dataSpan = rawDataMax - rawDataMin` 替代原来的 `rawDataMax` 进行不动点公式计算
- [ ] 1.3 `yAxisMin` 设为 `Math.min(0, rawDataMin) - dataSpan * 0.02`（少量 padding）；`yAxisMax` 设为 `rawDataMin + yRangeForLayer * (1 + LABEL_PADDING_RATIO)`；`maxY` 与 `yAxisMax` 一致（用于标签定位）
- [ ] 1.4 处理退化情况：`dataSpan === 0` 时使用默认跨度 `1`；`spacingBudget >= 1` 时使用 `dataSpan * 10` 安全回退

## 2. 重构 WaterfallChart.tsx

- [ ] 2.1 将 `option` useMemo 中第 132–150 行的 `rawDataMax` 追踪和 `yRangeForLayer`/`yMaxForAxis` 计算替换为调用 `computeYAxisRange`
- [ ] 2.2 将 `yAxis.min` 从硬编码 `0` 改为 `yAxisMin`（从共享函数返回）
- [ ] 2.3 将 `yAxis.max` 改为 `yAxisMax`（从共享函数返回）
- [ ] 2.4 将 `maxY` useMemo（第 283–302 行）替换为调用 `computeYAxisRange` 并取其 `maxY` 字段
- [ ] 2.5 移除原有的 `if (!isFinite(rawDataMax) || rawDataMax <= 0) rawDataMax = 1` 兜底逻辑

## 3. 重构 exportImage.ts

- [ ] 3.1 将 `exportImage.ts` 中第 97–112 行的 `rawDataMax` 追踪和 `yRangeForLayer`/`maxY` 计算替换为调用同一个 `computeYAxisRange` 函数
- [ ] 3.2 移除原有的 `rawDataMax <= 0` 钳位逻辑
- [ ] 3.3 确保导出图片的 Y 轴范围、层偏移与屏幕渲染完全一致

## 4. 验证

- [ ] 4.1 验证纯正值数据场景：确认渲染结果与修改前一致（向后兼容）
- [ ] 4.2 验证包含负值的数据场景：确认负值部分在可视区域内正确渲染
- [ ] 4.3 验证全负数据场景：确认所有数据点可见，分层效果正常
- [ ] 4.4 验证导出图片在上述三种场景下与屏幕渲染一致
- [ ] 4.5 运行 `rtk tsc` 确认无类型错误，运行现有测试确认无回归
