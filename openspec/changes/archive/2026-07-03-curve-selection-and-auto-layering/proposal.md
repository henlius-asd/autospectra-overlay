## Why

当前数据上传后所有曲线自动渲染到图表中，用户无法选择显示哪些曲线，也无法删除不需要的数据，导致图表混乱。同时，偏置控制需要手动为每条曲线输入 X/Y 偏移量，操作繁琐且不直观。本变更旨在提升用户体验：让用户自主选择渲染哪些曲线，支持删除不需要的数据，并用可视化分层控制替代手动偏置输入。

## What Changes

- **BREAKING**: 上传数据后曲线不再自动渲染到图表中，需用户手动勾选
- 曲线列表新增复选框（checkbox）控制每条曲线的可见性，仅勾选的曲线渲染到图表中间区域
- 曲线列表新增删除按钮，允许用户移除已上传的曲线数据
- 移除工具箱中的显式偏置控制（OffsetControls 组件），X 轴偏移完全由自动对齐完成
- 新增 Y 轴可视化分层控制条：一个滑块控件，设定统一的层间距，对每条可见曲线按顺序自动叠加 Y 轴偏移，实现自动分层效果

## Capabilities

### New Capabilities
- `curve-visibility-control`: 曲线可见性控制 — 上传后默认不渲染，通过复选框勾选后才显示在图表中
- `curve-deletion`: 曲线删除 — 支持从数据区删除已上传的曲线
- `auto-layering`: Y 轴自动分层 — 通过可视化滑块控制层间距，自动对可见曲线叠加 Y 偏移实现分层

### Modified Capabilities
- `state-management`: curveStore 新增 `visibleCurves` 集合追踪每条曲线的可见状态；新增 `layerSpacing` 字段存储 Y 轴层间距值；上传曲线后默认不可见；uiStore 移除 `selectionMode`（如不再需要）
- `three-column-layout`: 右侧工具箱移除 OffsetControls 组件，新增 AutoLayerControl 组件

## Impact

- `src/store/curveStore.ts`: 新增 `visibleCurves` (Set<string>)、`layerSpacing` (number) 字段；新增 `toggleVisibility`、`setLayerSpacing` action；修改 `addCurves` 默认不添加到可见集合
- `src/store/uiStore.ts`: 移除 `selectionMode` 字段（如不再需要）
- `src/components/data/CurveList.tsx`: 重建为带复选框和删除按钮的曲线列表
- `src/components/layout/LeftPanel.tsx`: 调整曲线数据传递逻辑
- `src/components/toolbox/OffsetControls.tsx`: 删除
- `src/components/toolbox/AlignmentControls.tsx`: 保留（X 轴自动对齐功能）
- `src/components/toolbox/AutoLayerControl.tsx`: 新增 Y 轴分层控制组件
- `src/components/chart/WaterfallChart.tsx`: 仅渲染可见曲线，并应用分层 Y 偏移
- `src/components/layout/RightPanel.tsx`: 调整工具箱组件引用