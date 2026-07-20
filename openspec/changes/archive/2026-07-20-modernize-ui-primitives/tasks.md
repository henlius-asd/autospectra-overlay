# Tasks: modernize-ui-primitives

## 1. 依赖与基线

- [x] 1.1 安装 `@radix-ui/react-dropdown-menu`、`@radix-ui/react-accordion`、`@radix-ui/react-toggle-group`、`@radix-ui/react-tooltip`、`lucide-react`
- [x] 1.2 运行 build + vitest + e2e 确认迁移前基线全绿（master 上一次提交后应为绿）

## 2. 基础设施

- [x] 2.1 在 index.css 增加全局 `:focus-visible` 规范（accent outline）
- [x] 2.2 新建 `src/components/ui/Tooltip.tsx` 封装（label/kbd/side/delayDuration=300，令牌样式）
- [x] 2.3 在 App 根部挂载 Radix TooltipProvider

## 3. 图标迁移

- [x] 3.1 重写 `src/components/ui/icons.tsx`：通用图标改为 lucide-react 再导出（同名导出保持调用方零改动），领域概念图标保留手写 path 但统一 lucide 视觉规范
- [x] 3.2 LeftPanel/RightPanel 折叠按钮 `◀▶` 文本替换为 ChevronLeft/ChevronRight 图标（14px，含 hover 态与 Tooltip）

## 4. Dropdown 迁移

- [x] 4.1 重写 `src/components/ui/Dropdown.tsx` 为 Radix DropdownMenu 薄封装，保持 `DropdownItem[]` props API 与行为（keepOpen、danger、checked、disabled）等价
- [x] 4.2 对 Toolbar 的「导出」「工作区」菜单跑 e2e/手动单点验证（触发、选择、keepOpen、Escape、点击外部关闭）

## 5. Accordion 迁移

- [x] 5.1 重写 `src/components/ui/Accordion.tsx` 为 Radix Accordion（type="multiple"）薄封装，保持 `sections` props API 与默认展开集合（alignment、labelStyle）
- [x] 5.2 用 `--radix-accordion-content-height` CSS 变量实现 200ms 高度动画（降级方案：无动画直接渲染）

## 6. Toolbar ToggleGroup 化

- [x] 6.1 交互模式按钮组改为 Radix ToggleGroup（type="single"），保持互斥 + 点击已激活项回 select 的语义；select 模式不占用组内项
- [x] 6.2 工具栏全部按钮（模式组、锁定、撤销/重做、导出/工作区触发器）接入 Tooltip 封装，内容沿用现有 title 文案

## 7. 验收

- [x] 7.1 构建产物检查：bundle 增量 < 50KB（lucide tree-shaking 生效），无 Radix 默认样式泄漏
- [x] 7.2 运行 `npm run build` + vitest 全绿
- [x] 7.3 运行 playwright e2e 全绿（选择器失配只允许更新定位方式，不改断言语义）
- [x] 7.4 键盘走查：Tab 焦点环可见、DropdownMenu 方向键/Enter/Escape、Accordion 触发器 Enter/Space、ToggleGroup 方向键移动
- [x] 7.5 截图对比（同 Change 1 的 7 个角度），确认视觉等价无错位
