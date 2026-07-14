## MODIFIED Requirements

### Requirement: Y 轴范围自适应缩放

生成 Y 轴范围时，系统 SHALL 基于原始未缩放数据（仅 `yVal + offset.yOffset`）计算 `rawDataMin` 和 `rawDataMax`，且 SHALL 遍历每条可见曲线的**全部**数据点（SHALL NOT 按当前 `xRange` 窗口过滤）。`dataSpan`、`yRangeForLayer`、`yAxisMin`、`yAxisMax` SHALL 全部由全量数据派生，从而在用户平移/缩放 X 轴时保持稳定。缩放后的曲线 SHALL 通过 `clip: false` 溢出轴范围。`computeYAxisRange` SHALL NOT 接受 `normalizeFactors`、`globalScale`、`curveScales`、`curveScaleOffsets`、`xRange` 参数。

#### Scenario: 全局放大后曲线可见变大

- **WHEN** 用户将 `globalScale` 调至 2.0
- **THEN** 所有曲线在固定 Y 轴范围内显示为 2 倍高度，可能溢出轴范围

#### Scenario: 手动缩小后曲线可见变小

- **WHEN** 用户将某条曲线的 `curveScales` 调至 0.1
- **THEN** 该曲线在固定 Y 轴范围内显示为 0.1 倍高度，视觉上可见缩小

#### Scenario: 轴范围不随缩放变化

- **WHEN** 用户缩放曲线后
- **THEN** Y 轴范围保持不变（基于原始数据），只有曲线数据改变

#### Scenario: X 平移/缩放不改变 Y 轴范围与层间距

- **WHEN** 用户已加载曲线并通过 dataZoom 平移或缩放 X 轴到不同可视窗口（窗口内极值与全量极值不同）
- **THEN** `yAxisMin`、`yAxisMax`、`dataSpan`、`yRangeForLayer` 保持不变，曲线不自动重缩放、曲线层（`layerYOffset`）不发生垂直错位
