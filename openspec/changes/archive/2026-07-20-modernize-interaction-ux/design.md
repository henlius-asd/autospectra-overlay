# Design: modernize-interaction-ux

## Context

Change 2 完成后，Tooltip 封装已具备 `kbd` 占位属性，工具栏按钮已接入 Tooltip，但 kbd 内容全为空。当前交互模式无键盘快捷键（仅 Space/Shift/Esc），面板宽度固定，折叠态是无内容的 48px 空条。本次是 UI 现代化三步走的最后一步。

## Goals / Non-Goals

**Goals:**
- 为 6 种交互模式定义键盘快捷键并在 useGlobalKeyboard 中注册，同步填充 Tooltip kbd
- 面板支持拖拽边缘调宽，替换固定百分比宽度约束
- 折叠态面板升级为垂直标签条（icon + 短文字，点击展开）
- 工具栏增加当前模式名称指示器

**Non-Goals:**
- 不做命令面板 / 搜索
- 面板宽度不持久化（刷新后复位默认值）
- 不改三栏响应式 auto-collapse 逻辑（1024/1280 断点保留）

## Decisions

### D1: 交互模式快捷键映射

| 模式 | 快捷键 | 理由 |
|---|---|---|
| 框选放大 (brush) | `B` | Box select 首字母 |
| 区间标签 (brace) | `Shift+B` | Brace 与 brush 共享 B 前缀 |
| 点标签 (pointLabel) | `P` | Point 首字母 |
| 手动移动 (move) | `M` | Move 首字母 |
| 全局缩放 (zoomGlobal) | `G` | Global zoom 首字母 |
| 单曲线缩放 (zoomCurve) | `C` | Curve zoom 首字母 |
| 一般选中 (select) | `V` | 通用选择工具惯例（Pointer/Select）；Esc 保留 |

快捷键在 `useGlobalKeyboard` 中注册，与 HudShortcuts 的 `TOOL_HINTS` 显示保持独立（Hud 显示控件提示，Tooltip 显示单键）。定义单一数据源 `src/lib/shortcuts.ts` 避免漂移。

### D2: 面板拖拽调宽

ThreeColumnLayout 中在面板与 CenterPanel 之间插入 4px 宽拖拽条（`cursor-col-resize`），mousedown 开始跟踪，mousemove 更新面板宽度（`useState`），mouseup 结束。宽度范围：数据区 120–400px，工具箱 160–500px。拖拽时禁用 text selection 和 iframe（ECharts）捕捉。

面板宽度使用内联 `style={{ width }}` 替代固定 CSS 类，保留 `shrink-0` 防止 flex 收缩。与 auto-collapse 逻辑的交互：当窗口缩窄到断点时，auto-collapse 会覆盖拖拽手动设置的宽度——当前逻辑在窗口 resize 时检查 `windowWidth < 1280/1024` 触发折叠，折叠后宽度复位为默认值（下次展开时）。微调：展开时读取上次拖拽宽度（不持久化，仅内存）；若窗口经历过断点折叠，展开后使用默认宽度（避免小屏上记忆了过大的宽度）。

### D3: 折叠态 icon rail

当面板折叠时，渲染 48px 宽的垂直条，内容为：
- **顶部**：展开按钮（Chevron 图标 + Tooltip）
- **中部**：竖直排列的图标，每个图标代表面板内的一个高频功能区
  - 数据区：文件上传图标（Upload）+ 搜索图标（Search）
  - 工具箱：对齐图标（AlignCenter）+ 样式图标（Palette）
  - 图标 24px，居中对齐，hover 高亮（`hover:bg-surface-hover rounded-md`），点击展开面板并聚焦到对应区域
- **底部**：面板名称（竖直文字，`text-[10px] text-ink-faint`，`writing-mode: vertical-rl`）

点击顶部图标：展开面板（同折叠按钮行为）。点击中部图标：展开面板并滚动到对应 Accordion 区域（通过 `scrollIntoView` 或 `sectionRef`）。

### D4: 模式状态指示器

工具栏右侧（版本号左侧）增加一个 6px 圆点 + 模式名称标签，使用 `text-[11px] text-ink-muted`：
- 未选中（select 模式）：灰色圆点 + "一般选中"
- 激活某模式：accent 色圆点 + 模式名称（如"框选放大"）

数据源：`TOOL_HINTS[interactionMode].name`（HudShortcuts 已有）。不占额外空间——在 `ml-auto` 区域与撤销/重做同行。

## Risks / Trade-offs

- [拖拽调宽与 ECharts 鼠标事件冲突] → 拖拽条 4px 在自己的区域；ECharts canvas 在 CenterPanel 内，有 `min-w-0` 隔离；mousedown 在拖拽条上不传播到图表
- [快捷键冲突：B 键在输入框聚焦时不应触发模式切换] → useGlobalKeyboard 已有 `isEditableTarget` 检查；新增快捷键复用同一防护
- [icon rail 点击"展开并聚焦"在 Accordion 区域的实现：Radix Accordion 不直接支持 scrollTo] → 在面板展开动画完成后（onAnimationEnd 或 setTimeout 300ms），对目标 section 调用 `scrollIntoView({ block: 'nearest' })`
- [折叠态 icon rail 图标的功能映射与用户理解落差] → 图标的 Tooltip 说明功能（如"上传数据文件"），点击展开面板后用户可立即操作对应区域

## Migration Plan

1. `src/lib/shortcuts.ts`（快捷键数据源）→ useGlobalKeyboard 注册 → Toolbar Tooltip kbd 填充
2. 面板拖拽条 → ThreeColumnLayout 重构 → LeftPanel/RightPanel 适配宽度 prop
3. 折叠态 icon rail → LeftPanel/RightPanel 折叠分支重写
4. 模式指示器 → Toolbar 渲染
5. 全量测试 + 走查

## Open Questions

- 拖拽调宽是否需要在 localStorage 持久化（跨刷新记忆）？当前决策：不持久化，与 auto-collapse 行为一致；若反馈强烈可在后续迭代加入
- 快捷键 V for select：Esc 已回到 select，V 是否冗余？V 提供单手操作便利（左手在主键区），Esc 为双手操作；保留双通路