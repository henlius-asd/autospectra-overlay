# scale-slider Specification

## MODIFIED Requirements

### Requirement: 缩放倍率显示

系统 SHALL 在图表渲染区域以 `pointerEvents: 'none'` 纯展示元素显示数值 badge。单曲线缩放激活时 SHALL 显示选中曲线的复合有效倍率 `×(global × curveScale)` 和偏移量 `Δ{scaleOffset}`。全局缩放激活时 SHALL 显示全局倍率 `×{globalScale}`。不存在垂直滑条 UI；倍率通过数值 badge 展示，缩放操作通过鼠标滚轮、Shift+拖拽和双击复位完成。

#### Scenario: 单曲线缩放显示复合倍率

- **WHEN** 单曲线缩放激活，曲线 A 被选中，curveScale=2、globalScale=1.5
- **THEN** badge 显示 `×3.0`

#### Scenario: 全局缩放显示全局倍率

- **WHEN** 全局缩放激活，globalScale=2.5
- **THEN** badge 显示 `×2.5`
