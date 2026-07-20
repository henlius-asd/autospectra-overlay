# Tasks: modernize-ui-design-tokens

## 1. 基线与准备

- [x] 1.1 运行 `npm run build`、单元测试（vitest）与 e2e（playwright），确认改造前基线全绿
- [x] 1.2 截取改造前全量 UI 截图（工具栏、数据区展开/折叠、工具箱各 Accordion 面板、下拉菜单、Toast、图表空态与有数据态）作为对比 baseline

## 2. 令牌层搭建

- [x] 2.1 在 `src/index.css` 的 `:root` 定义令牌 CSS 变量（zinc 基调 + accent 蓝 + danger 红，空格分隔 RGB 通道格式），变量初始值与当前视觉等效
- [x] 2.2 扩展 `tailwind.config.ts`：语义色令牌（surface/surface-raised/canvas/ink/ink-muted/ink-faint/line/line-strong/accent/accent-subtle/danger）、`shadow-overlay` 阴影、字体栈，全部走 `rgb(var(--x) / <alpha-value>)` 模式
- [x] 2.3 验证令牌可用性：构建后抽查 `bg-surface/80` 等透明度修饰符类在产物中正确输出 alpha 颜色
- [x] 2.4 决定并落实字体方案：引入 `@fontsource-variable/inter`（latin 子集）或采用纯系统字体栈（D3 备选），更新 `index.css` 字体栈声明

## 3. 主题模块与 ECharts 同步

- [x] 3.1 新建 `src/lib/theme.ts`：导出与 CSS 变量镜像的令牌常量（字体族、轴线色、网格线色、图例文本色等），附同步注释
- [x] 3.2 改造 `WaterfallChart`（及空态）的 ECharts option：字体族、axisLine/splitLine/axisLabel 颜色、图例文本色改从 `theme.ts` 引用
- [x] 3.3 为 `theme.ts` 导出值添加单元测试（与令牌约定一致性、非空校验）

## 4. 组件色值替换

- [x] 4.1 替换 `src/components/layout/`（ThreeColumnLayout、LeftPanel、RightPanel、CenterPanel）硬编码色值为语义令牌
- [x] 4.2 替换 `src/components/toolbar/` 与 `src/components/toolbox/` 各面板，统一按钮三态（hover/active/disabled）与 6px 控件圆角
- [x] 4.3 替换 `src/components/ui/`（Accordion、Dropdown、Toast、HudShortcuts）与 `src/components/data/`（CurveList、ColorPanel、ContextMenu、FileUpload），浮层统一 8px 圆角 + `shadow-overlay`
- [x] 4.4 替换 `src/components/chart/` 各 Overlay 组件（ManualMoveOverlay、PointLabelOverlay、BraceOverlay）中的硬编码色值
- [x] 4.5 危险态归并：所有 `red-*` 用法（删除、新建工作区、错误 Toast、锁定按钮）替换为 `danger` 令牌系列

## 5. 字号与细节规范

- [x] 5.1 收敛字号：扫描并统一为 text-xs(12) / text-[13px] / text-sm(14) 三档，数值类文本确认 `tabular-nums`
- [x] 5.2 阴影审计：移除面板/工具栏上的阴影，确认仅浮层（Dropdown、Toast、overlay 面板）保留分级阴影

## 6. 验收

- [x] 6.1 全局扫描 `src/components/**`，确认无 `gray-\d|blue-\d|red-\d` 等默认色板类残留（豁免清单除外）
- [x] 6.2 运行 `npm run build` + vitest 全绿
- [x] 6.3 运行 playwright e2e 全绿（如需调整，仅限类名/颜色相关选择器断言）
- [x] 6.4 截取改造后同角度截图，与 1.2 baseline 逐张对比，确认视觉焕新达成且无布局错位
- [x] 6.5 人工走查 CONTEXT.md 术语对应区域（工具栏、工具箱、Accordion 面板）的交互行为与改造前一致
