## MODIFIED Requirements

### Requirement: Y 轴分层控制滑块

系统 SHALL 在渲染区右侧提供一个竖直方向的原生 range 滑块用于控制 Y 轴层间距。`layerSpacing` 的语义 SHALL 为"占当前 Y 轴可见范围的比例"（无量纲），取值范围 `-0.5 ~ 0.5`。每条可见曲线的层 Y 偏移 SHALL 按公式 `layerYOffset = layerIndex * layerSpacing * (yMax - yMin)` 计算，其中 `(yMax - yMin)` 为当前 Y 轴可见范围，`layerIndex` 为曲线自底向上的层号（基准线 = 0）。系统 SHALL 通过 ECharts Y 轴 extent 实时读取可见范围并在 `onChartReady` 与 `onDataZoom` 时更新。

#### Scenario: 默认层间距

- **WHEN** 应用首次加载，用户未操作分层滑块
- **THEN** `layerSpacing = 0`，所有可见曲线按其原始 Y 值渲染，无分层效果

#### Scenario: 拖动滑块按比例分层

- **WHEN** 用户拖动分层滑块到 `0.2`，且当前 Y 轴可见范围为 `0 ~ 100`
- **THEN** 基准线 `layerYOffset = 0`，上一层为 `1 * 0.2 * 100 = 20`，再上一层为 `2 * 0.2 * 100 = 40`，以此类推

#### Scenario: 缩放后层间距随可见范围自适应

- **WHEN** 用户拖动滑块到某比例值后，通过 dataZoom 改变 Y 轴可见范围
- **THEN** 层间 Y 偏移按新的 `(yMax - yMin)` 重新计算，间距在视觉上随可见范围等比例变化

#### Scenario: 滑块显示当前值

- **WHEN** 用户调整分层滑块
- **THEN** 滑块旁显示当前 `layerSpacing` 的比例数值

### Requirement: 分层控制位置

Y 轴分层控制 SHALL 位于渲染区右侧（竖直方向），叠放在 ECharts 之上。SHALL NOT 在右侧工具箱内显示分层控制。`AutoLayerControl` SHALL 从右侧工具箱移除。

#### Scenario: 渲染区右侧竖直滑条

- **WHEN** 用户查看渲染区
- **THEN** 渲染区右侧出现竖直方向的分层滑条；右侧工具箱不再包含"Y 轴分层"区域

#### Scenario: grid 右侧留白避让滑条

- **WHEN** 渲染区显示分层滑条
- **THEN** ECharts `grid.right` 加宽以避免曲线被滑条遮挡，`convertXToPixel`/`convertPixelToX` 的右边界默认值同步更新
