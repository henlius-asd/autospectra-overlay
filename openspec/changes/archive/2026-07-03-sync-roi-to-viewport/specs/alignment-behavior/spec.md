## MODIFIED Requirements

### Requirement: ROI 范围默认为全局数据范围

对齐操作的 ROI 范围 SHALL 默认同步到当前图表的 X 轴可视范围（`xRange`），并在用户每次缩放/平移图表时自动更新。初始加载时，ROI 范围 SHALL 在图表就绪后自动同步为图表的实际数据范围。

#### Scenario: 加载曲线后 ROI 自动设置

- **WHEN** 用户加载曲线数据且图表渲染完成
- **THEN** ROI 起始值和结束值自动设置为图表当前 X 轴可视范围

#### Scenario: 缩放图表后 ROI 同步更新

- **WHEN** 用户通过滚轮或滑块缩放图表，改变 X 轴可视范围
- **THEN** ROI 起始值和结束值自动更新为新的可视范围

#### Scenario: 平移图表后 ROI 同步更新

- **WHEN** 用户拖拽图表平移，改变 X 轴可视范围
- **THEN** ROI 起始值和结束值自动更新为新的可视范围

#### Scenario: 切换基线后 ROI 更新

- **WHEN** 用户切换基线曲线
- **THEN** ROI 范围自动更新为图表当前 X 轴可视范围