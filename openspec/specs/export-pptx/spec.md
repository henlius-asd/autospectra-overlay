# export-pptx Specification

## Purpose
TBD - created by archiving change pptx-editable-export. Update Purpose after archive.
## Requirements
### Requirement: PPTX 独立 shape 重建

导出 PPTX 时 SHALL 将图表重建为多个独立 shape，每个元素在 PPT 中可被单独选中、移动、改色、改文字、删除：每条可见曲线 SHALL 成为一个独立的折线（freeform/line）shape；X/Y 坐标轴 SHALL 成为主线 shape；刻度与轴名称 SHALL 成为独立文本框；点标签 SHALL 成为由"文本框 + 竖线 + 圆点"组成的一组 shape；区间标签（大括号）SHALL 成为由"曲线弧形/自选图形 + 文本框"组成的一组 shape。SHALL NOT 导出为单张栅格图片。

#### Scenario: 在 PPT 中独立选中编辑单条曲线

- **WHEN** 用户导出 PPTX 后在 PowerPoint 中打开并点击某条曲线
- **THEN** 仅该曲线被选中，用户可改色、移动、删除而不影响其他曲线或标注

#### Scenario: 在 PPT 中编辑标签文字

- **WHEN** 用户在 PPT 中双击一个点标签的文本框
- **THEN** 可直接修改标签文字，竖线与圆点不受影响

#### Scenario: 曲线颜色与屏幕一致

- **WHEN** 用户为某曲线设置了自定义颜色后导出 PPTX
- **THEN** PPT 中该曲线折线 shape 的颜色与屏幕一致

### Requirement: PPTX 视图与屏幕一致

PPTX 导出 SHALL 保留用户当前的 X 轴与 Y 轴 dataZoom 缩放/平移视图与 Y 框选范围，shape 的像素位置（按 PPT 坐标系缩放换算）SHALL 与屏幕可见范围一致。导出 SHALL NOT 修改 `uiStore.xRange` 或 `uiStore.yZoomRange`。

#### Scenario: 导出反映当前缩放视图

- **WHEN** 用户在缩放/框选视图下导出 PPTX
- **THEN** PPT 中曲线与标注的可见范围、裁剪位置与屏幕一致

### Requirement: 标注样式与屏幕一致

PPTX 中的点标签与区间标签 SHALL 读取与屏幕同一 `labelStyle`（字号、字体、字重、颜色、背景色）与曲线颜色源，使 PPT 中的标注样式与屏幕/PNG 导出一致。

#### Scenario: 标签字号跟随样式设置

- **WHEN** 用户将默认标签字号设为 14 后导出 PPTX
- **THEN** PPT 中标签文本框字号为 14

### Requirement: 坐标轴跟随分轴显示开关

PPTX 导出 SHALL 跟随 X/Y 坐标轴各自的显示开关（见 `split-axis-toggle-and-curve-gap` 的分轴开关）：仅导出当前开启的轴及其刻度/名称；关闭的轴不生成对应 shape。

#### Scenario: 仅显示 X 轴时导出

- **WHEN** 用户关闭 Y 轴仅显示 X 轴后导出 PPTX
- **THEN** PPT 中仅有 X 轴及其刻度 shape，无 Y 轴 shape

