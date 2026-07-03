## MODIFIED Requirements

### Requirement: 初始加载时 ROI 同步到图表可视范围

系统 SHALL 分两阶段初始化 ROI：先从基线曲线数据快速设置，再由图表 `onChartReady` 回调精炼为图表实际可视范围。

#### Scenario: 首次加载曲线后 ROI 自动同步

- **WHEN** 用户首次加载曲线数据且基线曲线被设置
- **THEN** ROI 先快速设为数据范围，图表就绪后精炼为实际可视范围

#### Scenario: 切换基线后 ROI 更新

- **WHEN** 用户切换基线曲线
- **THEN** ROI 范围自动更新为新基线曲线的数据范围