## Context

Phase 1 已重构工具栏为图标化分组布局。Phase 2 将散落在工具栏的配置型功能迁移到右侧工具箱，使工具箱名副其实。

## Decisions

### 1. Accordion 组件

自定义 Accordion 组件，使用 `useState<Set<string>>` 管理展开状态。支持 `defaultExpanded` 属性设置默认展开的 section。Chevron 图标旋转动画指示展开/折叠状态。

### 2. 6 面板顺序

从上到下：元数据 → 自动对齐 → 标签样式 → 显示设置 → 数据处理 → 层间距。默认展开自动对齐和标签样式（高频面板）。

### 3. 层间距滑块迁移

从 WaterfallChart 浮动垂直滑块迁移到工具箱水平滑块。保持相同的 min/max/step 参数（0-0.5，步长 0.001）。

### 4. 显示设置面板

使用 checkbox 而非 toggle 按钮，更符合工具箱面板的配置型语义。