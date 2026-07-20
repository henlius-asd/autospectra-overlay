# Design: modernize-ui-primitives

## Context

Change 1 已建立设计令牌层（语义色、圆角、shadow-overlay、字体）。当前原语现状：

- `Dropdown.tsx`：手写，mousedown-outside + Escape 关闭，无焦点管理、无方向键导航、无 ARIA menu 语义
- `Accordion.tsx`：手写，`Set<string>` 管理展开态，button + 条件渲染，无 `aria-expanded`/region 语义，无高度动画
- `Toolbar.tsx`：9 个普通 button 表达互斥模式，靠 `bg-accent` 高亮；激活语义只在视觉层
- 提示：全部原生 `title`，延迟 ~1s 不可控，无法展示富内容（快捷键）
- 折叠按钮：`◀▶` 文本字符，无 hover 态规范
- `icons.tsx`：252 行手写 SVG，风格与粗细不完全一致

约束：

- 行为等价是硬要求：e2e 与现有用户肌肉记忆不得被破坏
- Radix 组件必须套用 Change 1 令牌样式，不得引入 Radix 默认外观
- 包体积敏感（echarts 已 1.3MB），Radix/lucide 按需引入

## Goals / Non-Goals

**Goals:**

- Dropdown → Radix Popover（或 DropdownMenu）：焦点管理、方向键、Escape、typeahead 开箱即用
- Accordion → Radix Accordion（type="multiple"）：ARIA 完整、支持受控展开集合
- 工具栏模式组 → Radix ToggleGroup（type="single"）：`aria-pressed` 语义正确
- 新增 Tooltip 封装：延迟 300ms、hover/focus 触发、支持 `kbd` 快捷键占位
- lucide-react 替换手写图标；`◀▶` → `ChevronLeft/Right`
- 全部原语应用令牌样式，视觉与现状保持等价

**Non-Goals:**

- 不做 tooltip 的快捷键内容充实（Change 3）
- 不做面板拖拽调宽、icon rail、命令面板（Change 3）
- 不引入 shadcn/ui 整套预设样式（只要 Radix 行为层）
- 不改 ECharts、不改布局结构、不改状态管理

## Decisions

### D1: Radix 选型与封装边界

| 用途 | Radix 包 | 封装形式 |
|---|---|---|
| 工具栏「导出/工作区」菜单 | `@radix-ui/react-dropdown-menu` | 重写 `ui/Dropdown.tsx` 为薄封装，保持 `DropdownItem[]` props API 不变 |
| Accordion 面板 | `@radix-ui/react-accordion` | 重写 `ui/Accordion.tsx`，保持 `sections` props API 不变 |
| 交互模式组 | `@radix-ui/react-toggle-group` | Toolbar 内直接使用，不额外封装 |
| 提示 | `@radix-ui/react-tooltip` | 新增 `ui/Tooltip.tsx`：`label`、`kbd?`、`side?`、`delayDuration=300` |

- **为什么 DropdownMenu 而非 Popover**：菜单语义（role="menu"、方向键、typeahead）是正确模型；Popover 适合任意内容容器
- **为什么保持 props API**：Toolbar 等调用方零改动或极小改动，降低回归面

### D2: 行为等价的具体锚点

- Dropdown：`keepOpen`（当前 DisplaySettings 类场景的 checkbox 项）→ Radix `onSelect={(e) => e.preventDefault()}`；danger 项 → `text-danger hover:bg-danger-subtle` 不变
- Accordion：默认展开集合（自动对齐、标签样式）→ `defaultValue={['alignment','labelStyle']}`；多开语义 = `type="multiple"`
- ToggleGroup：值映射 `interactionMode`；`value=""` 表示无激活（select 模式不在组内，点击已激活项 → `onValueChange("")` → `setInteractionMode('select')`），与现有 `handleToolClick` 逻辑等价
- 触发器内容/名称不变：e2e 用 `getByRole('button', { name: '导出' })` 等选择器，Radix Trigger 渲染为 button 且文本不变，选择器兼容

### D3: 图标迁移策略

- 新增 `lucide-react`，`icons.tsx` 重写为 lucide 再导出（同名导出：`UndoIcon`、`BraceIcon` 等），调用方零改动
- lucide 无对应图形的（BraceIcon 区间括号、ZoomCurveIcon 等自定义概念图标）保留手写 path，但统一到 lucide 的 24 viewBox / stroke=2 规范（现状已符合）
- 尺寸阶梯：工具栏 18px、菜单/面板 16px、折叠按钮 14px，通过 `className` 控制
- **备选**：直接删除 icons.tsx 全部换 lucide —— 否决，自定义概念图标无对应，混合导出更稳

### D4: Tooltip 封装行为

```tsx
<Tooltip label="框选放大" kbd="B">…触发元素…</Tooltip>
```

- `delayDuration={300}`，`side="bottom"`（工具栏）/`side="left"`（侧栏）可配
- 样式：`bg-ink text-white text-xs rounded-md px-2 py-1 shadow-overlay`，`kbd` 用 `text-white/70 font-mono`
- Provider 挂在 App 根部一次；禁用条件：触发元素 disabled 时不显示
- 工具栏 9 个模式按钮 + 撤销/重做 + 折叠按钮全部接入（内容暂用现有 title 文案，kbd 留空待 Change 3）

### D5: 焦点可见性

全局补 `:focus-visible` 规范：`outline: 2px solid rgb(var(--accent) / 0.6); outline-offset: 1px`（index.css utilities 层一条规则），替代当前多数元素无焦点态的现状。这是 Radix 键盘导航可用的前提。

## Risks / Trade-offs

- [Radix DropdownMenu 渲染结构与手写不同，e2e 选择器可能失配] → 先在 Toolbar 的「导出」菜单做迁移并单点跑 e2e 验证，再铺开；选择器失配只允许更新定位方式，不改断言语义
- [ToggleGroup 的受控值与 uiStore.interactionMode 同步出现循环] → 单向受控：`value={interactionMode === 'select' ? '' : interactionMode}`，`onValueChange` 只写 store；不写回读
- [Tooltip 在 ECharts 画布区域误触发/遮挡] → Tooltip 只用于工具栏与面板按钮，不用于画布元素；`side` 避让画布
- [Accordion 高度动画需要测量或 Radix 的 `--radix-accordion-content-height` CSS 变量动画] → 用 Radix 官方 CSS 变量方案做 200ms 高度动画（视觉增强，可降级为无动画，不改变行为）
- [lucide-react 全量打包风险] → ESM + tree-shaking，只打包具名导入；构建后核对 bundle 增量 < 50KB

## Migration Plan

1. 安装 5 个依赖（4 Radix + lucide-react）
2. `ui/Tooltip.tsx` + focus-visible 全局样式 + App 挂 Provider
3. `icons.tsx` lucide 化（同名再导出）
4. `Dropdown.tsx` → DropdownMenu 薄封装 → 跑 e2e 单点验证
5. `Accordion.tsx` → Radix Accordion 薄封装
6. Toolbar ToggleGroup 化 + 全工具栏 Tooltip 接入
7. LeftPanel/RightPanel 折叠按钮图标化 + Tooltip
8. 全量测试 + 截图对比

回滚：全部变更集中在 ui/ 与 toolbar/、layout/，git revert 单 commit 即可。

## Open Questions

- ToggleGroup 中 select 模式是否应作为组内默认项（现在组外）：维持现状组外处理，实施时若语义更顺可评审微调
- Accordion 高度动画是否在数据重的面板（元数据长列表）有性能问题：实施时观察，必要时仅对内容区做 opacity 过渡
