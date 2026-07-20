# Design: modernize-ui-design-tokens

## Context

当前项目（React 18 + Tailwind CSS v3.4 + ECharts）无设计令牌层：

- `tailwind.config.ts` 的 `theme.extend` 为空，组件直接使用 `gray-50/100/200`、`blue-500`、`red-100/700` 等硬编码色值，散布于约 30 个组件文件
- `src/index.css` 声明了 `Inter` 但从未引入字体文件，实际渲染为系统字体
- 无统一圆角/阴影/字号阶梯；按钮三态靠各处即兴书写（如 `Toolbar.tsx` 的 `modeButtonClass`）
- ECharts option 中的字体、图例、网格线颜色与 UI 色板完全脱节

约束：

- Tailwind v3.4（不升级 v4），PostCSS 管线已就绪
- 纯视觉变更，不得改变任何交互行为、组件 DOM 语义（避免破坏 e2e/单测）
- 遵循 CONTEXT.md 术语：工具栏 (Toolbar)、工具箱 (Toolbox)、Accordion 面板

## Goals / Non-Goals

**Goals:**

- 建立两层令牌体系：基础色板（CSS 变量）→ 语义别名（Tailwind 颜色名）
- 全局替换硬编码色值为语义令牌，视觉风格统一为现代工具型应用（参考 Linear / VSCode：中性灰阶 + 单一强调色）
- 统一圆角（控件 6px、浮层 8px）、阴影分级、字号阶梯（12/13/14px）
- 令牌结构为未来暗色模式预留（仅切换变量值即可）
- ECharts option 的字体与颜色从同一令牌源派生

**Non-Goals:**

- 不实现暗色模式本身（仅结构预留）
- 不引入组件库 / Radix（后续 change 处理）
- 不改变布局结构、面板宽度逻辑、交互模式
- 不替换手写图标、不添加动效

## Decisions

### D1: 令牌承载方式 —— CSS 变量 + `rgb(var(--x) / <alpha-value>)`

`:root` 中以空格分隔的 RGB 通道值定义变量（如 `--surface: 250 250 250`），Tailwind 配置映射为 `surface: 'rgb(var(--surface) / <alpha-value>)'`。

- **为什么**：保留 Tailwind 透明度修饰符能力（`bg-surface/80`）；未来暗色模式只需在 `[data-theme="dark"]` 覆盖变量值
- **备选**：直接在 config 写死 hex —— 否决，失去运行时换主题能力；升级为 Tailwind v4 CSS-first —— 否决，超出本 change 范围

### D2: 语义令牌命名

按用途命名而非按颜色命名，分四类：

| 类别 | 令牌 | 用途 |
|---|---|---|
| 表面 | `surface`（面板底色）、`surface-raised`（浮层/下拉）、`canvas`（图表区底色） | 背景 |
| 文本 | `ink`（主文本）、`ink-muted`（次要）、`ink-faint`（提示/版本号） | 文字 |
| 边框 | `line`（分隔线/面板边）、`line-strong`（输入框边） | 边框 |
| 强调 | `accent`（激活态/主操作）、`accent-subtle`（激活底色）、`danger` 系列 | 状态 |

- **为什么**：组件写 `bg-surface text-ink-muted` 而非 `bg-gray-50 text-gray-600`，换肤只动变量层
- 色板基调选 Tailwind `zinc`（比 `gray` 更中性的冷灰），强调色保留蓝色系（`blue-500` → `accent`），与现有激活态视觉连续

### D3: 字体与字号阶梯

- 字体栈：`Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`；通过 `@fontsource-variable/inter` 自托管引入（dev 依赖，构建内联，无 CDN 依赖）
- 字号收敛为 `text-xs`(12) / `text-[13px]` / `text-sm`(14) 三档；数值/版本号用 `tabular-nums`（已有先例）
- **备选**：不引字体只用系统栈 —— 备选保留；若评估认为中文字体回退已足够，可降级为纯字体栈定义（设计评审时定）

### D4: 圆角与阴影分级

- `rounded-md`(6px)：按钮、输入框等控件；`rounded-lg`(8px)：面板、浮层、Toast
- 阴影两级：`shadow-overlay`（下拉/Toast/overlay 面板）、其余无阴影（扁平工具型界面）

### D5: ECharts option 同步通路

- 新增 `src/lib/theme.ts`，从 CSS 变量读取（`getComputedStyle`）或镜像导出令牌常量，供 `WaterfallChart` 的 option（字体族、坐标轴 `axisLine`/`splitLine` 色、图例文本色）使用
- **为什么**：画布是视觉主体，UI 换了皮肤而图表还是默认黑字灰线会观感割裂
- **备选**：ECharts 注册自定义 theme 对象 —— 否决，配置分散在两处；统一走 `theme.ts` 单源

### D6: 替换策略 —— 机械映射 + 逐组件核对

按固定映射表机械替换（如 `bg-gray-50` → `bg-surface`、`border-gray-200` → `border-line`、`text-gray-400` → `text-ink-faint`、`bg-blue-500` → `bg-accent`），再逐组件核对语义是否合理（例如 `red-*` 危险态归入 `danger` 令牌）。过程中不重构组件结构。

## Risks / Trade-offs

- [机械映射在个别组件上语义错位（如某处 `gray-50` 实际表示 hover 态）] → 映射表逐组件核对 + 全量截图对比验收；发现错位时以视觉等效为准微调
- [Playwright e2e 若断言了 Tailwind 类名或像素颜色会失败] → 先跑现有 e2e 确认基线，失败后以更新选择器/断言为限，不改测试语义
- [`rgb(var(--x) / <alpha-value>)` 在某些类上漏配导致透明度修饰符失效] → tailwind.config 中所有令牌统一走该模式，构建后抽查 `bg-surface/50` 类输出
- [引入 Inter 增加包体（约 100-300KB 子集）] → 仅加载 latin 子集 + variable font；若评审决定不引字体则回退 D3 备选
- [getComputedStyle 运行时读取有首帧时序问题] → `theme.ts` 使用与 CSS 变量镜像的常量导出（单源手写同步），不运行时读取

## Migration Plan

1. tailwind.config 扩展 + index.css 变量层（此时 UI 应视觉不变——变量值等于现有色板）
2. `src/lib/theme.ts` 与 ECharts option 接入
3. 按映射表逐目录替换组件色值
4. 视觉微调 pass（对齐 D2/D4 规范，修语义错位）
5. 全量测试 + 截图对比验收

回滚：单 change 内全为样式改动，`git revert` 即可完全回退。

## Open Questions

- 是否实际引入 Inter 字体文件（D3 备选待定，倾向引入 latin 子集）
- `surface` 层级是否需要第三级（如 hover 专用 `surface-hover`）——实施时按实际需要增补，映射表允许扩展
