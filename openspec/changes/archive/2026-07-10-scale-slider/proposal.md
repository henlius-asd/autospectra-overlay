## Why

当前 Y 轴缩放工具通过点击图表曲线选中后拖拽峰值手柄实现缩放，但 ECharts 的 `click` 事件仅在点击数据点时触发，`large: true` + `lttb` 采样渲染下数据点稀疏，用户无法选中曲线，Y 缩放功能实际不可用。需替换为更可靠的交互方案。

## What Changes

- 移除峰值拖拽手柄 `ScaleHandle.tsx`，替换为选中曲线左侧的垂直缩放滑条 `ScaleSlider.tsx`
- Y 缩放模式下，点击曲线列表中的曲线行即可选中该曲线
- 选中曲线左侧显示垂直滑条，拖拽滑条滑块向上放大、向下缩小（×0.1 ~ ×10.0）
- 滑条旁实时显示当前倍率数值
- 拖拽过程中实时预览，mouseup 时提交缩放倍率
- 点击另一条曲线切换滑条位置，点击工具栏按钮退出 Y 缩放模式

## Capabilities

### New Capabilities
- `scale-slider`: 曲线左侧垂直缩放滑条，替代峰值拖拽手柄

### Modified Capabilities
- `y-scale-tool`: 选中机制从图表点击改为曲线列表点击

## Impact

- **新建**: `src/components/chart/ScaleSlider.tsx` — 垂直缩放滑条组件
- **移除**: `src/components/chart/ScaleHandle.tsx` — 峰值拖拽手柄
- **修改**: `src/components/chart/WaterfallChart.tsx` — 移除 chart click 事件、ScaleHandle 集成，改为 ScaleSlider 集成
- **修改**: `src/components/data/CurveList.tsx` — Y 缩放模式下点击曲线行选中曲线