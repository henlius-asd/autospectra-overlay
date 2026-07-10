# chart-image-export Specification

## MODIFIED Requirements

### Requirement: 导出保留当前缩放视图

导出 SHALL 保留用户当前的 X 轴与 Y 轴 dataZoom 缩放与平移视图（X 轴 `xRange`、Y 轴 `yZoomRange`），导出过程中切换 option SHALL NOT 改变 `useUiStore.xRange` 或 `uiStore.yZoomRange`。导出的临时 option SHALL 用 `inside` 型 dataZoom（隐藏 slider 控件）同时覆盖 X 与 Y 轴，并保留各自的 `start/end`（X）与 `startValue/endValue`（Y），使导出 PNG 的可见范围与屏幕一致。导出完成后 SHALL 还原原始 option（含图例、X/Y dataZoom slider 及其缩放位置）。

#### Scenario: 导出后图表状态还原

- **WHEN** 用户在 X/Y 缩放视图下触发导出并完成
- **THEN** 导出 PNG 反映当前 X 与 Y 缩放视图；导出完成后屏幕图表的图例、X/Y dataZoom slider 及缩放位置与导出前一致，`xRange` 与 `yZoomRange` 未被修改

#### Scenario: 导出保留 Y 框选范围

- **WHEN** 用户已框选一段 Y 可见范围后触发导出
- **THEN** 导出 PNG 的 Y 可见范围与屏幕框选一致（曲线裁剪范围、标注位置均跟随 Y 框选），Y dataZoom slider 不出现在 PNG 中
