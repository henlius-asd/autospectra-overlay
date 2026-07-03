## MODIFIED Requirements

### Requirement: 初始加载时 ROI 同步到图表可视范围

系统 SHALL 在曲线数据加载后，直接从曲线数据中计算 X 轴范围，并以此初始化 `xRange` 和 ROI 范围，不依赖 ECharts 渲染时序。

#### Scenario: 首次加载曲线后 ROI 自动同步

- **WHEN** 用户首次加载曲线数据
- **THEN** ROI 起始值和结束值自动设置为曲线数据的 x 范围（`data[0][0]` 到 `data[last][0]`），而非硬编码的 `[0, 10]`