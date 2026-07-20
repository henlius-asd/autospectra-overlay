# Proposal: modernize-ui-primitives

## Why

Change 1（design-tokens）已完成视觉地基，但组件原语仍是手写实现：Dropdown 无焦点管理与键盘导航、Accordion 无 ARIA 语义、交互模式按钮组缺少 toggle 语义、提示依赖原生 `title`（延迟不可控、无快捷键展示）、面板折叠用 `◀▶` 文本字符、图标为风格不一的手写 SVG。本次将这些原语迁移到 Radix UI 无头组件 + lucide 图标，获得可访问性与一致的交互质量，是 UI 现代化三步走的第二步。

## What Changes

- 引入 Radix UI 原语：`react-popover`（替换手写 Dropdown）、`react-accordion`（替换手写 Accordion）、`react-toggle-group`（承载工具栏交互模式组）、`react-tooltip`（全局受控 tooltip，替代原生 `title`）
- 引入 `lucide-react`，逐步替换 `src/components/ui/icons.tsx` 的手写图标；面板折叠按钮的 `◀▶` 文本字符替换为 chevron 图标
- 工具栏交互模式组改为 Radix ToggleGroup（type="single"）：保持现有「互斥 + 点击已激活项回到 select」语义不变
- 新增轻量 `Tooltip` 封装组件（基于 Radix），为工具栏按钮提供即时、统一的提示（含快捷键占位，快捷键内容在 Change 3 充实）
- 所有原语保留 Change 1 的设计令牌样式（surface/accent/ink 系列 + shadow-overlay + 圆角规范），**视觉与交互行为保持等价**——下拉项、accordion 展开集合、模式切换结果均不变
- 手写 `Dropdown.tsx` / `Accordion.tsx` 删除或转为对 Radix 的薄封装

## Capabilities

### New Capabilities

- `ui-primitives`: UI 原语层的构成与规范——Radix 无头组件的选型与封装边界、tooltip 的统一行为（延迟、触发方式、内容格式）、lucide 图标的使用规范与尺寸阶梯、原语必须具备的键盘/焦点/ARIA 行为要求

### Modified Capabilities

（无。交互行为保持等价，spec 级需求不变。）

## Impact

- **依赖**：新增 `@radix-ui/react-popover`、`@radix-ui/react-accordion`、`@radix-ui/react-toggle-group`、`@radix-ui/react-tooltip`、`lucide-react`（均为小型运行时依赖；echarts 仍为体积主体）
- **代码**：`src/components/ui/`（Dropdown、Accordion、icons 重写/删除，新增 Tooltip 封装）、`src/components/toolbar/Toolbar.tsx`（ToggleGroup 化）、`src/components/layout/LeftPanel.tsx` / `RightPanel.tsx`（折叠按钮图标化）
- **兼容性**：无数据格式/持久化变更；e2e 测试依赖的按钮名称与角色保持不变（Radix 渲染语义化 button/role，选择器应兼容，若有个别断言需更新仅限类名/结构）
- **验收**：现有 vitest + playwright 全绿；键盘操作（Tab/方向键/Escape）人工走查通过
