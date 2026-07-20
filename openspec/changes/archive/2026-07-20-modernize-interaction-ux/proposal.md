# Proposal: modernize-interaction-ux

## Why

Change 1 建立了设计令牌体系，Change 2 完成了 Radix 原语化（Tooltip 有 kbd 占位、折叠按钮有图标、ToggleGroup 有语义）。但当前交互仍有三个摩擦点：Tooltip 的快捷键提示为空（承诺在 Change 3 充实）、面板宽度固定不可调（小屏用户需要手动平衡图表与面板空间）、面板折叠后是一条 48px 空条（无任何信息，浪费空间）。本次是 UI 现代化三步走的最后一步，聚焦交互效率提升。

## What Changes

- 工具栏 Tooltip 的 `kbd` 占位填充真实快捷键（B/Shift+B/P/M/Z/G/C 等），与 HudShortcuts 和 useGlobalKeyboard 的快捷键定义同源，避免漂移
- 面板（数据区、工具箱）支持拖拽边缘调宽：在面板与图表区之间增加可拖拽分隔条（gutter），鼠标拖拽动态调整面板宽度，替换现有固定 `min-w`/`max-w`/`w-[15%]` 约束；最小/最大宽度限制保留
- 面板折叠态从空条升级为垂直标签条（icon rail）：显示竖直排列的图标 + 短文字标签（如"数据"、"工具"），提供对面板内容的空间感知，点击即可展开
- 工具栏增加当前交互模式指示器（小标签显示当前模式名称，如"框选放大"），减少用户对高亮图标的依赖

## Capabilities

### New Capabilities

- `interaction-ux`: 交互体验增强——Tooltip 快捷键内容的数据源与同步规则、面板拖拽调宽的行为与边界约束、折叠态 icon rail 的构成与交互、模式状态指示器的显示规则

### Modified Capabilities

（无。均为增量增强，不改变现有功能的 spec 级需求。）

## Impact

- **代码**：`src/components/toolbar/Toolbar.tsx`（kbd 填充 + 模式指示器）、`src/components/layout/ThreeColumnLayout.tsx`（面板拖拽 logic）、`src/components/layout/LeftPanel.tsx` + `RightPanel.tsx`（icon rail 折叠态）
- **依赖**：无新增运行时依赖
- **兼容性**：无数据格式/持久化变更；拖拽调宽引入的宽度状态不持久化（刷新后复位默认值，与现有 auto-collapse 逻辑一致）
- **验收**：vitest + e2e 全绿；拖拽行为与 icon rail 交互手动走查