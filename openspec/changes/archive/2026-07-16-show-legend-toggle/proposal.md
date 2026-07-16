## Why

当前图例的显示行为由 ECharts 内部逻辑控制（`visibleIds.length > 1` 时自动显示），用户无法手动控制。之前"含图例" checkbox 仅控制导出时是否包含图例，实际图表中的图例显示行为不可控。

需新增"显示图例"开关，让用户可手动控制图表中图例的显示/隐藏，并置于工具箱"显示设置"面板中。

## What Changes

- 新增 `showLegend` 状态（默认 `true`）到 `uiStore`，含 `toggleShowLegend` action
- `WaterfallChart` 使用 `showLegend` 控制 `legend.show`（替代 `visibleIds.length > 1` 硬编码）
- 工具箱"显示设置"面板新增"显示图例" checkbox
- `showLegend` 纳入 IndexedDB 持久化 + workspace JSON 导出/导入

## Impact

- `src/store/uiStore.ts` — 新增 `showLegend` + `toggleShowLegend`
- `src/components/chart/WaterfallChart.tsx` — `legend.show` 改为 `showLegend && visibleIds.length > 1`
- `src/components/toolbox/DisplaySettingsPanel.tsx` — 新增"显示图例" checkbox
- `src/persistence/index.ts` — 持久化 `showLegend`
- `src/components/toolbar/Toolbar.tsx` — workspace JSON 导出/导入含 `showLegend`