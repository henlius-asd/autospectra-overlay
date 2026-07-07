## MODIFIED Requirements

### Requirement: Y 轴分层控制滑块

系统 SHALL 在右侧工具箱区域提供一个 Y 轴分层控制滑块（range input），允许用户设定统一的 Y 轴层间距值。该间距值 SHALL 应用于所有可见曲线，按可见曲线列表顺序为每条曲线自动叠加 Y 偏移。层间距的计算乘数 SHALL 使用 ECharts 实际的 Y 轴范围（yExtent），而非 store 中缓存的 yRange。

#### Scenario: 默认层间距

- **WHEN** 应用首次加载，用户未操作分层滑块
- **THEN** 层间距值为 0，所有可见曲线按其原始 Y 值渲染，无分层效果

#### Scenario: 拖动滑块调整层间距

- **WHEN** 用户拖动分层滑块到某个正值（如 0.15）
- **THEN** 每条曲线的 Y 偏移按 `layerIndex × layerSpacing × yExtent` 计算，其中 yExtent 是 ECharts 实际的 Y 轴范围

#### Scenario: 窗口 resize 后分层偏移保持正确

- **WHEN** 用户调整浏览器窗口大小导致图表尺寸变化
- **THEN** ECharts 重新 auto-scale Y 轴，分层偏移量基于新的 yExtent 重新计算，标签位置保持在所有曲线上方

### Requirement: 大括号随 dataZoom 联动

区间标签 SHALL 在 dataZoom 缩放/平移时保持与曲线的相对位置不变。区间标签的 Y 坐标 SHALL 基于 ECharts 实际 Y 轴范围（yExtent）计算，确保标签始终定位在所有可见曲线的上方。

#### Scenario: 缩放时区间标签位置同步

- **WHEN** 用户通过 dataZoom 缩放图表
- **THEN** 区间标签的像素位置随缩放比例同步更新，与曲线无可见脱节（视觉误差 < 2px）

#### Scenario: 多曲线分层时标签位于最上方曲线之上

- **WHEN** 图表中有多条曲线且 layerSpacing > 0
- **THEN** 区间标签的 Y 坐标基于最上方曲线的最高点计算，标签显示在所有曲线的上方而非中间
