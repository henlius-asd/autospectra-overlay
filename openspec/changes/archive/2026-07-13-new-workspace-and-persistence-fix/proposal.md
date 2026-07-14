## Why

当前持久化存在缺口：`xRange`、`yZoomRange`、`colorHistory` 未存入 IndexedDB（刷新后丢失缩放位置与颜色历史）；`showGrid`、`showXAxis`、`showYAxis` 未纳入 JSON 导出/导入（JSON 导入后恢复为默认值）。用户需要"新建工作区"功能——清空所有曲线与标注、重置图表视图与 undo 历史，但保留用户显示偏好（网格、坐标轴、标签样式等），以便从零开始新工作。

## What Changes

**Phase 1 — 修复持久化缺口：**
- `xRange`、`yZoomRange`、`colorHistory` 纳入 IndexedDB 的 `uiSnapshot`，刷新后恢复。
- `showGrid`、`showXAxis`、`showYAxis` 纳入 JSON 导出/导入（`handleExportJSON`、`handleImportJSON`）。

**Phase 2 — 新建工作区：**
- curveStore 新增 `resetWorkspace()` action：清空 curves、offsets、visibleCurves、stagingOrder、layerSpacing、curveScales、curveScaleOffsets、normalizeFactors、globalScale、baselineId、braces、pointLabels、locked。
- uiStore 复位：xRange、yZoomRange、selectedCurveId、所有交互模式标志 → 默认值；保留 showGrid/showXAxis/showYAxis/exportWithLegend/labelStyle/colorHistory/面板折叠。
- 清空 zundo undo/redo 历史。
- 清除 IndexedDB 的 `current_workspace` key（保留 `current_ui`）。
- Toolbar 新增"新建工作区"按钮（带确认弹窗）。

## Capabilities

### Modified Capabilities

- `workspace-persistence`：IndexedDB uiSnapshot 新增 `xRange`、`yZoomRange`、`colorHistory`；JSON 导出/导入新增 `showGrid`、`showXAxis`、`showYAxis`。
- `state-management`：新增 `resetWorkspace()` action 清空曲线状态；uiStore 新增 `resetUiForNewWorkspace()` 复位渲染状态。

## Impact

- `src/persistence/index.ts` — uiSnapshot 增字段；restoreWorkspace 增恢复；JSON 导出/导入增字段。
- `src/store/curveStore.ts` — 新增 `resetWorkspace()` action。
- `src/store/uiStore.ts` — 新增 `resetUiForNewWorkspace()` action。
- `src/components/toolbar/Toolbar.tsx` — 新增"新建工作区"按钮 + 确认 + 调用序列。