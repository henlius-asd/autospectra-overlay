# brace-tool Specification

## MODIFIED Requirements

### Requirement: 大括号随 dataZoom 联动

区间标签 SHALL 在 dataZoom 缩放/平移时保持与曲线的相对位置不变。区间标签的 Y 坐标 SHALL 以最高曲线（`visibleIds[0]`）的峰值（`rawDataMin + yRangeForLayer`）为基线，定位在曲线峰值上方约 14px，并夹取到不低于 `gridTop + 8`，确保标签贴近曲线且完整显示在绘图区内。

#### Scenario: 缩放时区间标签位置同步

- **WHEN** 用户通过 dataZoom 缩放图表
- **THEN** 区间标签的像素位置随缩放比例同步更新，与曲线无可见脱节（视觉误差 < 2px）

#### Scenario: 多曲线分层时标签贴近最高曲线

- **WHEN** 图表中有多条曲线且 layerSpacing > 0
- **THEN** 区间标签的 Y 坐标基于最高曲线峰值计算，定位在峰值上方约 14px，且不低于 gridTop + 8，标签完整显示不被裁切

## ADDED Requirements

### Requirement: 大括号整段拖拽平移

已创建的区间标签 SHALL 支持整段横向拖拽平移：拖拽时保持区间宽度不变，同步移动 `startX` 与 `endX`。拖拽与点击编辑 SHALL 通过位移阈值（累计位移 < 5px 视为点击）区分。

#### Scenario: 拖拽平移整段区间

- **WHEN** 用户按住一个已有区间标签并横向拖动超过 5px
- **THEN** 该区间标签的 startX 与 endX 同步平移（宽度不变），释放后保留新位置，不弹出编辑浮层

#### Scenario: 小幅移动视为点击编辑

- **WHEN** 用户按住一个已有区间标签但累计位移不足 5px 即释放
- **THEN** 视为点击，弹出标签编辑浮层（可改文字或删除），区间位置不变
