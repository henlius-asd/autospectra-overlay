# Spec: ui-design-tokens

## ADDED Requirements

### Requirement: 语义化设计令牌层

系统 SHALL 在 Tailwind 配置中提供语义化设计令牌，全部以 CSS 变量承载并支持透明度修饰符（`rgb(var(--x) / <alpha-value>)` 模式）。令牌 SHALL 按用途命名，至少覆盖以下类别：表面背景（`surface`、`surface-raised`、`canvas`）、文本（`ink`、`ink-muted`、`ink-faint`）、边框（`line`、`line-strong`）、强调与状态（`accent`、`accent-subtle`、`danger` 系列）。

#### Scenario: 令牌在 Tailwind 中可用

- **WHEN** 组件使用语义令牌类名（如 `bg-surface`、`text-ink-muted`、`border-line`、`bg-accent`）
- **THEN** 构建产物中包含对应样式，且颜色来源于 CSS 变量层

#### Scenario: 透明度修饰符可用

- **WHEN** 组件对令牌色使用透明度修饰符（如 `bg-surface/80`）
- **THEN** 输出颜色正确应用 alpha 通道而非退化为不透明或失效

### Requirement: 组件禁止硬编码色值

应用组件（`src/components/**`）SHALL 使用语义令牌类名表达颜色，MUST NOT 直接引用 Tailwind 默认色板的具体色值类（如 `gray-50`、`blue-500`、`red-100`）。状态色（危险/错误）SHALL 使用 `danger` 令牌系列。

#### Scenario: 全局无硬编码色值残留

- **WHEN** 对 `src/components/**` 执行色值类扫描（匹配 `gray-\\d`、`blue-\\d`、`red-\\d` 等默认色板类名）
- **THEN** 除豁免清单外无匹配项

#### Scenario: 危险操作使用 danger 令牌

- **WHEN** 渲染危险操作按钮（如新建工作区、删除曲线）或错误提示
- **THEN** 其颜色类来自 `danger` 令牌系列而非 `red-*` 色板值

### Requirement: 统一的字体与字号阶梯

系统 SHALL 定义全局字体栈（Inter 优先，中文回退 PingFang SC / Microsoft YaHei），UI 字号 SHALL 收敛于 12px / 13px / 14px 三档，数值与版本号文本 SHALL 使用 `tabular-nums`。

#### Scenario: 全局字体栈生效

- **WHEN** 应用完成加载
- **THEN** 根元素字体族为定义的字体栈，中文文本正确回退到中文字体

#### Scenario: 字号阶梯约束

- **WHEN** 扫描组件中的字号类名
- **THEN** 仅使用 12px（`text-xs`）、13px、14px（`text-sm`）三档及豁免的继承场景

### Requirement: 圆角与阴影分级

控件（按钮、输入框）SHALL 使用 6px 圆角；面板、浮层、Toast SHALL 使用 8px 圆角。阴影 SHALL 仅用于浮层层级（下拉菜单、Toast、overlay 面板），面板与工具栏保持扁平无阴影。

#### Scenario: 浮层有阴影、面板无阴影

- **WHEN** 渲染下拉菜单或 overlay 状态的数据区/工具箱面板
- **THEN** 浮层应用分级阴影，而固定布局中的工具栏与面板无阴影

### Requirement: ECharts 画布与令牌同步

ECharts option 中的字体族、坐标轴线色、网格线色、图例文本色 SHALL 从与设计令牌同源的主题模块（`src/lib/theme.ts`）派生，而非散落在组件内的硬编码值。

#### Scenario: 图表样式来源于主题模块

- **WHEN** 构建图表 option（字体、axisLine、splitLine、图例文本颜色）
- **THEN** 相关值均引用自 `theme.ts` 导出，且其值与设计令牌保持一致

### Requirement: 纯视觉变更的行为保持

本次令牌化改造 MUST NOT 改变任何交互行为、组件 DOM 语义结构或持久化数据格式；现有单元测试与 e2e 测试 SHALL 在不修改测试语义的前提下保持通过（允许仅更新依赖类名/颜色的选择器断言）。

#### Scenario: 行为回归为零

- **WHEN** 完成全部替换后运行 `npm run build`、单元测试与 e2e 测试
- **THEN** 构建成功，测试全部通过，且测试变更仅限于类名/颜色相关断言
