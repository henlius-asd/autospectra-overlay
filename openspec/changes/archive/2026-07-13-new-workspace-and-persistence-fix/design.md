## Context

当前 `uiSnapshot` 仅含 `showGrid`、`showXAxis`、`showYAxis`、`exportWithLegend`、`labelStyle`，缺失 `xRange`、`yZoomRange`、`colorHistory`。JSON 导出/导入缺失 `showGrid`/`showXAxis`/`showYAxis`。无"新建工作区"能力。

## Goals / Non-Goals

**Goals:**
- 补全 IndexedDB 与 JSON 的持久化缺口，使刷新和导出/导入不丢失渲染状态。
- 提供"新建工作区"功能，清空所有工作区数据但保留用户偏好。

**Non-Goals:**
- 不实现"快照式重置"（恢复到初始导入状态）。
- 不修改 `yRange`（疑似废弃，独立评估后移除）。

## Decisions

### D1: 扩展 `uiSnapshot` 而非拆分

直接在现有 `uiSnapshot` 对象中增 `xRange`、`yZoomRange`、`colorHistory` 字段，不拆分为两个 key。`restoreWorkspace` 中缺失字段回退到默认值，向后兼容。

**理由**：`uiSnapshot` 已是 UI 持久化的单一入口，扩字段比拆 key 更简单。

### D2: JSON 导出/导入 key 与 IndexedDB 对齐

`handleExportJSON` 在 `buildWorkspaceSnapshot` 基础上追加 `showGrid`、`showXAxis`、`showYAxis`、`xRange`、`yZoomRange`、`colorHistory`、`exportWithLegend`、`labelStyle`。`handleImportJSON` 恢复全部上述字段。对齐后 JSON 与 IndexedDB 的字段集合一致。

### D3: `resetWorkspace()` 保留曲线数据

`resetWorkspace()` 保留 `curves`、`stagingOrder`、`visibleCurves`（原始数据 + 叠图排列），清空所有可变状态：`offsets`、`layerSpacing`、`curveScales`、`curveScaleOffsets`、`normalizeFactors`、`globalScale`、`braces`、`pointLabels`、`locked`。`baselineId` 从当前 `stagingOrder`/`visibleCurves` 重新派生。

**理由**：用户期望"新建工作区"是重置对曲线的修改，而非删除曲线重新导入。保留曲线数据避免重新加载。

### D4: 工具栏按钮 + confirm 弹窗

"新建工作区"按钮放在 Toolbar 末尾（导出按钮附近），点击后弹出 `window.confirm()`。确认后按顺序执行：curveStore.resetWorkspace() → uiStore.resetUiForNewWorkspace() → temporal.clear() → clearWorkspace()。

## Risks / Trade-offs

- [确认弹窗使用原生 confirm] → 样式简陋但可靠，后续可替换为自定义弹窗。
- [resetWorkspace 会产生一次 undo 记录] → 立即 `temporal.clear()` 清空，不影响体验。
- [旧 JSON 无 showGrid/showXAxis/showYAxis] → 导入时缺失字段用当前默认值，不覆盖用户偏好。