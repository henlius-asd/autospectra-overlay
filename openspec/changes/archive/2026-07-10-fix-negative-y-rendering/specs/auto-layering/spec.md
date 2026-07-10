## MODIFIED Requirements

### Requirement: Y 轴分层控制滑块

系统 SHALL 在右侧工具箱区域提供一个 Y 轴分层控制滑块（range input），允许用户设定统一的 Y 轴层间距值。该间距值 SHALL 应用于所有可见曲线，按可见曲线列表顺序为每条曲线自动叠加 Y 偏移。层间距的计算乘数 SHALL 使用 ECharts 实际的 Y 轴范围（yExtent），而非 store 中缓存的 yRange。

Y 轴范围计算 SHALL 同时追踪可见数据的最大值（rawDataMax）和最小值（rawDataMin），并基于数据跨度 dataSpan = rawDataMax - rawDataMin 计算分层范围。Y 轴下界 SHALL 为 `Math.min(0, rawDataMin)`（可加少量 padding），上界 SHALL 在最高曲线顶点之上预留固定比例（15%）作为标签专用区域。

不动点公式 SHALL 为：
```
dataSpan = rawDataMax - rawDataMin
spacingBudget = (visibleCount - 1) × layerSpacing
yRangeForLayer = spacingBudget >= 1 ? dataSpan × 10 : dataSpan / (1 - spacingBudget)
yAxis.min = Math.min(0, rawDataMin) - padding
yAxis.max = rawDataMin + yRangeForLayer × (1 + LABEL_PADDING_RATIO)
```

当所有数据为正值时（rawDataMin ≥ 0），公式 SHALL 退化为原有行为（yAxis.min = 0, yAxis.max = rawDataMax × (1 + 0.15) / (1 - spacingBudget) × (1 + LABEL_PADDING_RATIO)）。

#### Scenario: 默认层间距

- **WHEN** 应用首次加载，用户未操作分层滑块
- **THEN** 层间距值为 0，所有可见曲线按其原始 Y 值渲染，无分层效果

#### Scenario: 拖动滑块调整层间距

- **WHEN** 用户拖动分层滑块到某个正值（如 0.15）
- **THEN** 每条曲线的 Y 偏移按 `layerIndex × layerSpacing × yRangeForLayer` 计算，其中 yRangeForLayer 由不动点公式确定

#### Scenario: y 轴顶部预留标签区域

- **WHEN** 图表渲染时设置了显式 y 轴边界
- **THEN** y 轴 max SHALL 等于 `rawDataMin + yRangeForLayer × 1.15`，最高曲线顶点约占 y 轴可用高度的 87%，顶部 13% 留给标签显示

#### Scenario: 数据包含负值

- **WHEN** 可见曲线中存在 y < 0 的数据点
- **THEN** Y 轴下界 SHALL 自动扩展到负值区域（`Math.min(0, rawDataMin)`），所有负值数据点 SHALL 在可视区域内正确渲染

#### Scenario: 全负数据

- **WHEN** 所有可见曲线的数据均为负值
- **THEN** Y 轴范围 SHALL 为 `[rawDataMin - padding, rawDataMin + yRangeForLayer × 1.15]`，所有数据点 SHALL 可见且分层效果正常
