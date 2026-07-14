# chart-image-export Specification (Delta — spec-sync)

## Overview

Delta aligning spec requirements with implementation (source of truth) for the `chart-image-export` capability.

## MODIFIED Requirements

### Requirement: 导出画面跟随 showAxes 开关

导出 SHALL 分别跟随 `showXAxis`/`showYAxis` 显示开关：仅导出当前开启的轴（含轴线、刻度、标签、轴名称）及其网格（受 `showGrid` 约束）；关闭的轴不出现在导出中。PNG 导出默认 SHALL NOT 包含图例与底部 dataZoom 预览条；工具栏的 "export with legend" 开关启用时导出 SHALL 包含图例。导出 SHALL NOT 修改 `uiStore.xRange` 或 `uiStore.yZoomRange`，导出完成后屏幕图表状态 SHALL 还原。

#### Scenario: 仅显示 X 轴时导出

- **WHEN** 用户仅开启 `showXAxis`、关闭 `showYAxis` 后导出
- **THEN** 导出含 X 轴、不含 Y 轴

#### Scenario: 双轴均关闭时导出净图

- **WHEN** 用户关闭 `showXAxis` 与 `showYAxis` 后导出
- **THEN** 导出不含坐标轴、背景透明，仅含曲线与标注

#### Scenario: 导出后图表状态还原

- **WHEN** 用户在缩放视图下触发导出并完成
- **THEN** 导出反映当前缩放视图与分轴显隐；导出完成后屏幕图表的 dataZoom slider 及缩放位置与导出前一致，`xRange` 未被修改

#### Scenario: 工具栏启用 "export with legend" 后导出包含图例

- **WHEN** 用户启用工具栏的 "export with legend" 开关后触发 PNG 导出
- **THEN** 导出的 PNG 中包含图例（line 样式，默认尺寸 20×14），不含底部 dataZoom 预览条

### Requirement: 导出不产生可见闪烁

导出过程中的 option 临时切换 `setOption` SHALL 在同一同步执行栈内完成；但还原操作位于多个异步 `await`（图片加载、SVG 序列化）之后，因此屏幕在导出过程中可能出现短暂的图例/slider 消失再恢复的可见重绘。

#### Scenario: 导出过程可能有屏幕闪烁

- **WHEN** 用户触发导出
- **THEN** 图表 option 的临时切换立即生效；但还原在异步任务完成后才执行，中间可能产生可见的图例/slider 消失再恢复的闪烁

## UNMODIFIED Requirements

以下需求与实现一致，无需变更：

- **Requirement: 导出保留当前缩放视图** — 实现通过 `inside` type dataZoom 保留 X/Y 缩放，导出完成后还原原始 option，不修改 `xRange`/`yZoomRange`。
- **Requirement: 导出标注与屏幕一致** — 实现通过 SVG 叠加层，使用同一基线公式、夹取规则、去装饰样式。
- **Requirement: 导出格式选择** — 实现保留 PNG 位图路径，PPTX 由独立的 `export-pptx` 能力处理。