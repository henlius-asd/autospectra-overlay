# chart-image-export Specification

## Purpose
TBD - created by archiving change polish-annotations-and-export. Update Purpose after archive.
## Requirements
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

### Requirement: 导出保留当前缩放视图

导出 SHALL 保留用户当前的 X 轴与 Y 轴 dataZoom 缩放与平移视图（X 轴 `xRange`、Y 轴 `yZoomRange`），导出过程中切换 option SHALL NOT 改变 `useUiStore.xRange` 或 `uiStore.yZoomRange`。导出的临时 option SHALL 用 `inside` 型 dataZoom（隐藏 slider 控件）同时覆盖 X 与 Y 轴，并保留各自的 `start/end`（X）与 `startValue/endValue`（Y），使导出 PNG 的可见范围与屏幕一致。导出完成后 SHALL 还原原始 option（含图例、X/Y dataZoom slider 及其缩放位置）。

#### Scenario: 导出后图表状态还原

- **WHEN** 用户在缩放视图下触发导出并完成
- **THEN** 导出 PNG 反映当前缩放视图；导出完成后屏幕图表的图例、dataZoom slider 及缩放位置与导出前一致，`xRange` 未被修改

#### Scenario: 导出保留 Y 框选范围

- **WHEN** 用户已框选一段 Y 可见范围后触发导出
- **THEN** 导出 PNG 的 Y 可见范围与屏幕框选一致（曲线裁剪范围、标注位置均跟随 Y 框选），Y dataZoom slider 不出现在 PNG 中

### Requirement: 导出不产生可见闪烁

导出过程中的 option 临时切换 `setOption` SHALL 在同一同步执行栈内完成；但还原操作位于多个异步 `await`（图片加载、SVG 序列化）之后，因此屏幕在导出过程中可能出现短暂的图例/slider 消失再恢复的可见重绘。

#### Scenario: 导出过程可能有屏幕闪烁

- **WHEN** 用户触发导出
- **THEN** 图表 option 的临时切换立即生效；但还原在异步任务完成后才执行，中间可能产生可见的图例/slider 消失再恢复的闪烁

### Requirement: 导出标注与屏幕一致

导出 PNG 中的 brace 与点标签 SHALL 与屏幕显示的位置、样式一致（同一基线公式、同一夹取规则、同一去装饰样式）。

#### Scenario: 导出标注位置与屏幕一致

- **WHEN** 图表上有 brace 与点标签且用户触发导出
- **THEN** 导出 PNG 中的 brace 与点标签的像素位置、文字样式与屏幕显示一致，点标签同样无外框/原点/虚线

### Requirement: 导出格式选择

导出入口 SHALL 支持两种格式：PNG（经 ECharts `getDataURL`，沿用现有位图行为）与 PPTX（独立 shape 重建，见 `export-pptx`）。用户 SHALL 可在导出时选择格式。无论选择何种格式，导出 SHALL 遵循 `chart-image-export` 中"导出画面跟随分轴开关"需求（跟随 `showXAxis`/`showYAxis`、保留缩放视图、不修改 `xRange`/`yZoomRange`）。

#### Scenario: 选择 PNG 导出

- **WHEN** 用户在导出入口选择 PNG
- **THEN** 生成与现有行为一致的静态 PNG，不含图例与预览条，跟随分轴开关

#### Scenario: 选择 PPTX 导出

- **WHEN** 用户在导出入口选择 PPTX
- **THEN** 生成 .pptx 文件，其中每个曲线/轴/标注为独立可编辑 shape，可见范围与分轴显隐跟随当前状态

### Requirement: 图片导出对 null 标注颜色具有鲁棒性

PNG 导出 SHALL 在 `resolveLabelStyle` 返回的 `resolved.color` 为 `null` 时不会崩溃。当 brace 或点标签的 `labelStyle.color` 为显式 `null` 时，resolver SHALL 回落全局默认颜色，使导出正常完成。

#### Scenario: 标注颜色为 null 时 PNG 导出成功

- **WHEN** 某个 brace 的 `labelStyle.color` 为显式 `null`（如经 JSON 工作区导入）且用户触发 PNG 导出
- **THEN** 导出正常完成，标注使用全局默认颜色，不出现导出失败提示

