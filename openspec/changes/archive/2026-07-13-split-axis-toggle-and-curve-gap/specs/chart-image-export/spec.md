## MODIFIED Requirements

### Requirement: 导出画面跟随 showAxes 开关

导出 SHALL 分别跟随 `showXAxis`/`showYAxis` 显示开关：仅导出当前开启的轴（含轴线、刻度、标签、轴名称）及其网格（受 `showGrid` 约束）；关闭的轴不出现在导出中。PNG 导出 SHALL NOT 包含图例与底部 dataZoom 预览条。导出 SHALL NOT 修改 `uiStore.xRange` 或 `uiStore.yZoomRange`，导出完成后屏幕图表状态 SHALL 还原。

#### Scenario: 仅显示 X 轴时导出

- **WHEN** 用户仅开启 `showXAxis`、关闭 `showYAxis` 后导出
- **THEN** 导出含 X 轴、不含 Y 轴

#### Scenario: 双轴均关闭时导出净图

- **WHEN** 用户关闭 `showXAxis` 与 `showYAxis` 后导出
- **THEN** 导出不含坐标轴、背景透明，仅含曲线与标注

#### Scenario: 导出后图表状态还原

- **WHEN** 用户在缩放视图下触发导出并完成
- **THEN** 导出反映当前缩放视图与分轴显隐；导出完成后屏幕图表的 dataZoom slider 及缩放位置与导出前一致，`xRange` 未被修改
