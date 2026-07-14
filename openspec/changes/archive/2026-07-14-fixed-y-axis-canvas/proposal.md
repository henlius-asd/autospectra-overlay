## Why

图表 Y 轴范围（`yAxisMin/Max`、`dataSpan`、`yRangeForLayer`）此前按当前 X 可视窗口（`xRange`）的极值计算。用户平移/缩放 X 轴时，窗口内极值变化导致 Y 画布自动重缩放、曲线层（`layerYOffset`）垂直错位——即"可视范围内极值变化引起自动缩放/位置改变"。用户要求固定画布，使 X 平移/缩放不再影响 Y 轴与层间距。

## What Changes

- **BREAKING**: `computeYAxisRange` SHALL 遍历每条可见曲线的**全部**数据点计算 `rawDataMin`、`rawDataMax`、`dataSpan`、`yRangeForLayer`、`yAxisMin`、`yAxisMax`，SHALL NOT 按当前 `xRange` 窗口过滤。Y 画布在 X 平移/缩放期间保持稳定。
- 移除 `computeYAxisRange` 的 `xRange` 形参（`WaterfallChart.tsx`、`exportImage.ts`、`exportPptx.ts` 调用同步更新）。`yAxisFullRange` 的 useMemo 依赖列表移除 `xRange`，X 平移不再触发重算。
- `yRangeForLayer`（层间距基准）随之改为全量数据基准，`layerYOffset` 在 X 平移时不再漂移。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `curve-composite-scale`: "Y 轴范围自适应缩放" 需求由"基于原始数据计算"明确为"基于全量数据（不按 X 窗口过滤）计算，且 X 平移/缩放时 Y 轴范围与层间距保持稳定"。补充 X 平移稳定性场景。

## Impact

- `src/components/chart/computeYAxisRange.ts` — 移除 `xRange` 形参与窗口过滤循环。
- `src/components/chart/WaterfallChart.tsx` — `yAxisFullRange` 调用与依赖列表去掉 `xRange`。
- `src/components/chart/exportImage.ts`、`src/components/chart/exportPptx.ts` — 调用去掉 `xRange` 实参（`xRange` 变量本身仍用于 X→像素换算与标注过滤，保留）。
- `src/components/chart/__tests__/computeYAxisRange.test.ts` — 移除用例中的 `xRange` 实参，新增"全量数据、忽略 X 视口"用例。
- 行为：Y 轴范围与层间距现反映全量数据 span；用户仍可手动调节 `layerSpacing` 滑块控制层间距比例。
