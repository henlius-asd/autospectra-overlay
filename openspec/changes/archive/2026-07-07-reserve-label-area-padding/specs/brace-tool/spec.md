## MODIFIED Requirements

### Requirement: 大括号随 dataZoom 联动

区间标签 SHALL 在 dataZoom 缩放/平移时保持与曲线的相对位置不变。区间标签的 Y 坐标 SHALL 基于 ECharts 实际 Y 轴范围（yExtent）计算，确保标签始终定位在所有可见曲线的上方且落在预留的标签区域内。

#### Scenario: 缩放时区间标签位置同步

- **WHEN** 用户通过 dataZoom 缩放图表
- **THEN** 区间标签的像素位置随缩放比例同步更新，与曲线无可见脱节（视觉误差 < 2px）

#### Scenario: 多曲线分层时标签位于预留区域内

- **WHEN** 图表中有多条曲线且 layerSpacing > 0
- **THEN** 区间标签的 Y 坐标基于含 15% buffer 的 maxY 计算，标签完整显示在 y 轴顶部的预留区域内，不被裁切
