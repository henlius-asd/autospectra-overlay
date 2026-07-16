## Context

图例显示控制当前由 ECharts 内部逻辑决定（`visibleIds.length > 1`），用户无法干预。需要在工具箱"显示设置"面板中提供手动控制开关。

## Decisions

### 1. 新增 `showLegend` 而非复用 `exportWithLegend`

`exportWithLegend` 仅控制导出行为（PNG/PPTX 是否包含图例），与图表内图例显示是两个独立关注点。分开管理避免混淆。

### 2. 默认值为 `true`

与 `showGrid`、`showXAxis` 一致，默认显示，用户可以关闭。

### 3. 图例显示逻辑

`legend.show = showLegend && visibleIds.length > 1`

- `showLegend` 关闭时：始终不显示图例
- `showLegend` 开启时：仅在有 ≥2 条可见曲线时显示图例（避免单曲线时图例无意义）

### 4. 持久化

`showLegend` 纳入 `uiSnapshot` 持久化到 IndexedDB，并纳入 workspace JSON 导出/导入。