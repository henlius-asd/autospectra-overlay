# Proposal: modernize-ui-design-tokens

## Why

当前 UI 没有任何设计令牌层：`tailwind.config.ts` 的 `extend` 为空，颜色（`gray-50/100/200`、`blue-500`）、字号、圆角散落在几十个组件文件中，导致视觉风格无法统一调整，后续现代化改造（组件原语、暗色模式）没有地基。本次改造建立语义化设计令牌体系并完成全局视觉焕新，是 UI 全面现代化三步走（令牌 → Radix 原语 → 交互增强）的第一步。

## What Changes

- 在 `tailwind.config.ts` 中定义语义化设计令牌（surface / border / accent / text 层级、圆角、阴影、字号阶梯），以 CSS 变量承载，结构上为未来暗色模式预留
- 在 `src/index.css` 建立 `:root` 令牌变量层与全局字体规范（引入字体栈约定与 `tabular-nums` 数值规范）
- 全局替换组件中硬编码的 Tailwind 色值（`gray-*`、`blue-*`、`red-*` 等）为语义令牌类名
- 统一控件视觉规范：按钮三态（hover / active / disabled）、圆角（控件 6px、浮层 8px）、边框与阴影分级
- ECharts 画布的 option（字体、图例、网格线、坐标轴颜色）跟随新令牌
- **纯视觉变更，无任何交互行为变更**；工具栏/工具箱/三栏布局结构与信息架构保持不变

## Capabilities

### New Capabilities

- `ui-design-tokens`: 设计令牌体系的定义与应用规则——语义令牌的命名、分层（基础色板 → 语义别名）、CSS 变量承载方式、组件引用令牌的规范，以及 ECharts option 与令牌同步的要求

### Modified Capabilities

（无。本次为纯视觉换肤，不改变任何 spec 级行为需求。）

## Impact

- **代码**：`tailwind.config.ts`、`src/index.css`，以及全部使用硬编码色值的组件（`src/components/**`，约 30 个文件）
- **依赖**：无新增运行时依赖
- **兼容性**：无 API / 数据格式 / 持久化结构变更；工作区快照不受影响
- **验收方式**：全量截图对比（改造前 baseline vs 改造后），现有单元测试与 e2e 测试应保持全绿
