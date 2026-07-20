# Spec: ui-primitives

## ADDED Requirements

### Requirement: 菜单原语基于 Radix DropdownMenu

工具栏的「导出」「工作区」菜单 SHALL 使用 `@radix-ui/react-dropdown-menu` 实现，具备完整的键盘操作（方向键导航、Enter 选择、Escape 关闭、typeahead）与 ARIA menu 语义。菜单项的数据驱动 API（label、icon、danger、disabled、checked、keepOpen）SHALL 保持与迁移前等价的行为：`keepOpen` 项选中后菜单不关闭，danger 项使用 danger 令牌样式。

#### Scenario: 键盘完整操作菜单

- **WHEN** 用户聚焦「导出」触发器并按 Enter 打开菜单，随后用方向键移动并按 Enter 选择
- **THEN** 焦点在菜单项间正确移动，选中项的回调被执行，菜单按预期关闭

#### Scenario: keepOpen 项不关闭菜单

- **WHEN** 用户点击配置了 `keepOpen` 的菜单项
- **THEN** 该项的回调执行且菜单保持打开状态

### Requirement: Accordion 原语基于 Radix Accordion

工具箱的 Accordion 面板 SHALL 使用 `@radix-ui/react-accordion`（type="multiple"）实现，支持多面板同时展开、默认展开集合（自动对齐、标签样式）与完整 ARIA 语义（`aria-expanded`、region 关联）。

#### Scenario: 默认展开集合保持

- **WHEN** 工具箱首次渲染
- **THEN** 「自动对齐」与「标签样式」面板处于展开状态，其余面板折叠

#### Scenario: 多面板可同时展开

- **WHEN** 用户依次展开多个 Accordion 面板
- **THEN** 已展开的面板不因其他面板的展开而折叠

### Requirement: 交互模式组基于 Radix ToggleGroup

工具栏的交互模式按钮组 SHALL 使用 `@radix-ui/react-toggle-group`（type="single"）实现，激活态具备正确的 `aria-pressed`/`data-state` 语义。互斥与取消语义 SHALL 与迁移前等价：激活某模式后点击其他模式则切换；点击当前已激活的模式回到「一般选中」。

#### Scenario: 模式互斥切换

- **WHEN** 用户激活「框选放大」后点击「区间标签」
- **THEN** 交互模式切换为区间标签，且框选放大不再处于激活态

#### Scenario: 点击已激活模式回到一般选中

- **WHEN** 当前交互模式为「手动移动」，用户再次点击该按钮
- **THEN** 交互模式回到 select（一般选中），工具栏无激活高亮项

### Requirement: 统一 Tooltip 原语

系统 SHALL 提供基于 `@radix-ui/react-tooltip` 的统一 Tooltip 封装组件，支持文本标签与可选快捷键占位（kbd），默认延迟 300ms，hover 与 focus 均可触发，样式使用设计令牌（bg-ink、text-xs、rounded-md、shadow-overlay）。工具栏按钮与面板折叠按钮 SHALL 使用该封装替代原生 `title`。

#### Scenario: hover 即时提示

- **WHEN** 用户将指针悬停在工具栏「框选放大」按钮上 300ms
- **THEN** 显示样式统一的 tooltip，内容为其功能说明，而非浏览器原生 title 气泡

#### Scenario: focus 同样触发

- **WHEN** 用户通过 Tab 键聚焦到同一按钮
- **THEN** tooltip 同样显示，保证键盘用户获得等价信息

### Requirement: 图标体系基于 lucide

通用图标 SHALL 使用 `lucide-react`；lucide 无对应图形的领域概念图标（如区间括号）SHALL 保留手写 SVG 但遵循 lucide 视觉规范（24 viewBox、stroke=2、round caps）。面板折叠按钮 MUST NOT 使用 `◀▶` 文本字符，SHALL 使用 chevron 图标。图标尺寸 SHALL 遵循阶梯：工具栏 18px、菜单/面板 16px、折叠按钮 14px。

#### Scenario: 折叠按钮图标化

- **WHEN** 数据区或工具箱处于展开或折叠状态
- **THEN** 折叠/展开按钮渲染为 chevron 图标而非文本字符，且具有 hover 态

### Requirement: 全局焦点可见性

可交互元素 SHALL 具备统一的 `:focus-visible` 样式（accent 色 outline），保证 Radix 组件键盘导航时的焦点位置可见。

#### Scenario: Tab 导航焦点可见

- **WHEN** 用户使用 Tab 键在工具栏按钮间移动焦点
- **THEN** 当前聚焦按钮显示 accent 色 outline 焦点环

### Requirement: 行为等价保持

本次原语迁移 MUST NOT 改变任何功能的最终行为（下拉项回调、accordion 展开集合、模式切换结果、面板折叠状态），现有 vitest 与 playwright 测试 SHALL 在不修改测试语义的前提下通过（允许仅更新依赖 DOM 结构的选择器）。

#### Scenario: 回归为零

- **WHEN** 迁移完成后运行构建、单元测试与 e2e 测试
- **THEN** 全部通过，且测试变更仅限于 DOM 结构相关的选择器更新
