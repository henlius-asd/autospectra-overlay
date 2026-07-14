# scale-slider Specification (Delta)

## MODIFIED Requirements

### Requirement: 缩放倍率显示

系统 SHALL 在图表渲染区域以 `pointerEvents: 'none'` 纯展示元素显示数值 badge。单曲线缩放激活时 SHALL 显示选中曲线的复合有效倍率 `×(normalize × global × manual)` 和偏移量 `Δ{scaleOffset}`。全局缩放激活时 SHALL 显示全局倍率 `×{globalScale}`。不存在垂直滑条 UI；倍率通过数值 badge 展示，缩放操作通过鼠标滚轮、Shift+拖拽和双击复位完成。

#### Scenario: 单曲线缩放显示复合倍率

- **WHEN** 单曲线缩放激活，曲线 A 被选中，normalizeFactor=2、globalScale=1.5、curveScale=1
- **THEN** badge 显示 `×3.0`

#### Scenario: 全局缩放显示全局倍率

- **WHEN** 全局缩放激活，globalScale=2.5
- **THEN** badge 显示 `×2.5`

### Requirement: 滑条显示（重命名为"缩放倍率 Badge 显示"）

选中曲线后，系统 SHALL 在图表渲染区域左上角显示缩放倍率数值 badge。badge 位置相对于 ECharts grid 左上角固定。badge 为纯展示元素，不包含交互控件（无轨道、无滑块、无拖拽手柄）。

#### Scenario: Badge 位置

- **WHEN** 曲线被选中且缩放模式激活
- **THEN** badge 显示在图表区域左上角（left: 8px, top: gridTop）

#### Scenario: Badge 显示倍率

- **WHEN** badge 可见
- **THEN** badge 显示当前缩放倍率数值（如 ×1.0），如有偏移量则显示 `Δ{offset}`

## REMOVED Requirements

### Requirement: 垂直滑条 UI（轨道 + 圆形滑块 + 24px 左侧定位）

**Reason:** 实际实现中不存在垂直滑条（track + circular thumb）；缩放操作通过鼠标滚轮、Shift+拖拽和双击复位完成，缩放倍率通过数值 badge 展示。

**Migration:** 删除对垂直滑条组件和布局的依赖。缩放交互应使用滚轮/拖拽/双击代替滑块拖拽。