# Tasks: modernize-interaction-ux

## 1. 快捷键数据源与注册

- [x] 1.1 新建 `src/lib/shortcuts.ts`：定义 `MODE_SHORTCUTS` 映射（InteractionMode → { key, display }），作为 Tooltip kbd 与 useGlobalKeyboard 的单一数据源
- [x] 1.2 在 `useGlobalKeyboard` 中注册模式快捷键处理（复用 `isEditableTarget` 防护），按 `MODE_SHORTCUTS` 映射调用 `setInteractionMode`
- [x] 1.3 为 shortcuts.ts 添加单元测试（映射完整、无冲突）

## 2. Tooltip kbd 填充

- [x] 2.1 在 Toolbar.tsx 的 `toolButton` 中，从 `MODE_SHORTCUTS[mode].display` 读取快捷键并传入 Tooltip 的 `kbd` prop
- [x] 2.2 手动验证：hover 每个模式按钮，确认 Tooltip 显示正确快捷键

## 3. 面板拖拽调宽

- [x] 3.1 在 ThreeColumnLayout 中为数据区和工具箱各添加一个 4px 拖拽条（`cursor-col-resize`），实现 mousedown/mousemove/mouseup 拖拽逻辑
- [x] 3.2 将 LeftPanel 和 RightPanel 的宽度从固定 CSS 类改为 `style={{ width }}` prop，接收 ThreeColumnLayout 传递的宽度状态
- [x] 3.3 拖拽时禁用文本选择和 ECharts 事件捕获（`user-select: none`、`pointer-events: none` on canvas）
- [x] 3.4 处理与 auto-collapse 断点逻辑的交互：窗口缩窄到断点时折叠，展开后使用默认宽度（不记忆拖拽宽度以避免小屏显示异常）

## 4. 折叠态 icon rail

- [x] 4.1 重写 LeftPanel 折叠态渲染：顶部展开按钮（ChevronRight + Tooltip），中部 Upload/Search 图标（点击展开面板），底部竖直文字"数据区"
- [x] 4.2 重写 RightPanel 折叠态渲染：顶部展开按钮（ChevronLeft + Tooltip），中部 AlignCenter/Palette 图标（点击展开面板并滚动到对应 Accordion section），底部竖直文字"工具箱"
- [x] 4.3 实现"点击图标展开并滚动到对应区域"：面板展开后 300ms 延时对目标 Accordion trigger 调用 `scrollIntoView`

## 5. 模式状态指示器

- [x] 5.1 在 Toolbar 右侧（撤销/重做与版本号之间）添加模式指示器：accent 色圆点 + 模式名称，数据源 `TOOL_HINTS[interactionMode].name`

## 6. 验收

- [x] 6.1 运行 `npm run build` + vitest 全绿
- [x] 6.2 运行 playwright e2e 全绿
- [x] 6.3 键盘走查：所有模式快捷键正常切换，输入框内不触发，Esc 依然回到 select
- [x] 6.4 拖拽走查：拖拽平滑无卡顿，宽度范围约束生效，刷新后复位
- [x] 6.5 icon rail 走查：图标正确、Tooltip 正确、点击展开并定位正确