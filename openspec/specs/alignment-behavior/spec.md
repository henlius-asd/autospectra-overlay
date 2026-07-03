# alignment-behavior Specification

## Purpose
曲线对齐操作的行为规范，包括对齐幂等性、ROI 与可视范围同步、以及缩放状态保留。

## Requirements

### Requirement: 对齐操作不累积偏移量

对已对齐的曲线再次执行对齐操作时，系统 SHALL NOT 产生额外的偏移累积。对齐算法 SHALL 基于当前已偏移的数据（而非原始数据）计算增量调整量，确保多次对齐结果一致（幂等性）。

#### Scenario: 多次对齐结果一致

- **WHEN** 用户对同一组曲线连续点击"一键对齐"按钮多次
- **THEN** 每次对齐后各曲线的 xOffset 值保持不变（不递增/递减）

#### Scenario: 多条曲线同时对齐

- **WHEN** 存在多条非基准曲线且用户点击"一键对齐"
- **THEN** 所有非基准曲线的 offset 均被正确更新，无丢失

### Requirement: 对齐操作保留图表缩放状态

对齐操作 SHALL NOT 重置图表的 dataZoom 缩放/平移状态。用户在对齐前后 SHALL 看到相同的 X 轴可视范围。

#### Scenario: 对齐后缩放状态不变

- **WHEN** 用户缩放到特定 X 轴范围后点击"一键对齐"
- **THEN** 图表保持当前缩放范围，不对 dataZoom 进行重置

### Requirement: ROI 范围跟随 X 轴可视范围

ROI 范围 SHALL 跟随 `uiStore.xRange`，初始值从曲线数据计算（`Math.floor(dataMin)` / `Math.ceil(dataMax)`）。用户缩放/平移图表时，ROI SHALL 自动同步到当前可视范围。xAxis SHALL 显式设置 `min`/`max` 为取整后的数据范围，阻止 ECharts nice 取整。

#### Scenario: 加载曲线后 ROI 自动设置

- **WHEN** 用户加载曲线数据
- **THEN** ROI 范围自动设置为取整后的数据范围（如 `[0, 45]`），xAxis 范围一致

#### Scenario: 缩放图表后 ROI 同步更新

- **WHEN** 用户通过滚轮或滑块缩放图表
- **THEN** ROI 范围自动更新为当前可视范围

#### Scenario: 切换基线后 ROI 更新

- **WHEN** 用户切换基线曲线
- **THEN** ROI 范围自动更新为当前图表 X 轴可视范围