## Why

工具栏中的配置型功能（显示开关、归一化、层间距）不应在工具栏中，应在工具箱中通过 Accordion 面板组织。右侧工具箱从 3 面板扩到 6 面板，名副其实。

## What Changes

- 创建 Accordion 组件
- 新增 3 个工具箱面板：DisplaySettingsPanel、DataProcessingPanel、LayerSpacingPanel
- 工具箱从 3 面板扩到 6 面板，采用 Accordion 手风琴组织
- 从工具栏移除已迁移的按钮（网格/X轴/Y轴/归一化/还原归一）
- 从 WaterfallChart 移除浮动层间距滑块

## Impact

- `src/components/ui/Accordion.tsx` — 新增
- `src/components/toolbox/DisplaySettingsPanel.tsx` — 新增
- `src/components/toolbox/DataProcessingPanel.tsx` — 新增
- `src/components/toolbox/LayerSpacingPanel.tsx` — 新增
- `src/components/layout/RightPanel.tsx` — 重构为 Accordion
- `src/components/toolbar/Toolbar.tsx` — 移除已迁移按钮
- `src/components/chart/WaterfallChart.tsx` — 移除浮动层间距滑块