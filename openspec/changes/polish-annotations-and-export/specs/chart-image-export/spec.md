# chart-image-export Specification

## ADDED Requirements

### Requirement: 导出画面跟随 showAxes 开关

导出 PNG SHALL 跟随当前 `showAxes` 开关：开时保留坐标轴与刻度标签，关时导出净图（无坐标轴、透明背景）。导出画面 SHALL NOT 包含图例与底部 dataZoom 预览条。

#### Scenario: showAxes 开启时导出保留坐标轴

- **WHEN** `showAxes` 为 true 且用户触发导出
- **THEN** 导出的 PNG 包含 X/Y 坐标轴与刻度标签，但不包含上方图例与底部 dataZoom 预览条

#### Scenario: showAxes 关闭时导出净图

- **WHEN** `showAxes` 为 false 且用户触发导出
- **THEN** 导出的 PNG 不含坐标轴、图例与预览条，背景透明，仅含曲线与标注

### Requirement: 导出保留当前缩放视图

导出 SHALL 保留用户当前的 dataZoom 缩放与平移视图，导出过程中切换 option SHALL NOT 改变 `useUiStore.xRange`，导出完成后 SHALL 还原原始 option（含图例、dataZoom slider 及其缩放位置）。

#### Scenario: 导出后图表状态还原

- **WHEN** 用户在缩放视图下触发导出并完成
- **THEN** 导出 PNG 反映当前缩放视图；导出完成后屏幕图表的图例、dataZoom slider 及缩放位置与导出前一致，`xRange` 未被修改

### Requirement: 导出不产生可见闪烁

导出过程中的 option 临时切换与还原 SHALL 在同一同步执行栈内完成，浏览器 SHALL NOT 在中间产生可见的重绘闪烁。

#### Scenario: 导出过程无屏幕闪烁

- **WHEN** 用户触发导出
- **THEN** 屏幕图表不出现图例/slider 消失再恢复的可见闪烁

### Requirement: 导出标注与屏幕一致

导出 PNG 中的 brace 与点标签 SHALL 与屏幕显示的位置、样式一致（同一基线公式、同一夹取规则、同一去装饰样式）。

#### Scenario: 导出标注位置与屏幕一致

- **WHEN** 图表上有 brace 与点标签且用户触发导出
- **THEN** 导出 PNG 中的 brace 与点标签的像素位置、文字样式与屏幕显示一致，点标签同样无外框/原点/虚线
