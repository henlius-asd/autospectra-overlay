## ADDED Requirements

### Requirement: 对齐操作保留图表缩放状态

对齐操作 SHALL NOT 重置图表的 dataZoom 缩放/平移状态。用户在对齐前后 SHALL 看到相同的 X 轴可视范围。

#### Scenario: 对齐后缩放状态不变

- **WHEN** 用户缩放到特定 X 轴范围后点击"一键对齐"
- **THEN** 图表保持当前缩放范围，不对 dataZoom 进行重置

### Requirement: 初始加载时 ROI 同步到图表可视范围

系统 SHALL 在图表首次渲染完成后，将 ROI 范围自动同步为图表的实际 X 轴可视范围，而非硬编码的默认值 `[0, 10]`。

#### Scenario: 首次加载曲线后 ROI 自动同步

- **WHEN** 用户首次加载曲线数据，图表渲染完成
- **THEN** ROI 起始值和结束值自动设置为图表当前 X 轴可视范围（即数据的全量范围）