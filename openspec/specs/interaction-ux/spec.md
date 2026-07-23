# Spec: interaction-ux

## Requirements

### Requirement: 交互模式键盘快捷键

系统 SHALL 为 6 种交互模式提供键盘快捷键：B（框选放大）、Shift+B（区间标签）、P（点标签）、M（手动移动）、G（全局缩放）、C（单曲线缩放）、V（一般选中）。快捷键 SHALL 在输入框聚焦时不触发。快捷键映射 SHALL 定义在单一数据源 `src/lib/shortcuts.ts` 中，供 useGlobalKeyboard 注册与 Tooltip kbd 渲染共享。

#### Scenario: 快捷键切换模式

- **WHEN** 用户按下 B 键（且焦点不在输入框内）
- **THEN** 交互模式切换到框选放大，工具栏对应按钮高亮，模式指示器更新

#### Scenario: 输入框聚焦时不触发

- **WHEN** 焦点在搜索曲线输入框内，用户按下 B 键
- **THEN** 字符 B 正常输入，交互模式不改变

### Requirement: Tooltip 快捷键提示

工具栏模式按钮的 Tooltip SHALL 显示对应的键盘快捷键（kbd 元素），数据来源于 `src/lib/shortcuts.ts`，与 useGlobalKeyboard 注册的快捷键保持一致。

#### Scenario: 模式按钮 Tooltip 含快捷键

- **WHEN** 用户将指针悬停在框选放大按钮上 300ms
- **THEN** Tooltip 显示"框选放大"文本和 `B` 快捷键标签

### Requirement: 面板拖拽调宽

数据区与工具箱面板 SHALL 支持通过拖拽与图表区之间的分隔条调整宽度。拖拽条宽度 4px，鼠标悬浮时显示 `col-resize` 光标。拖拽时更新面板宽度（内联 style），宽度范围：数据区 120–400px，工具箱 160–500px。

面板宽度 SHALL 持久化到 `localStorage`（key `autospectra:panel-widths`），拖拽结束时写入。应用加载时从 localStorage 读取初始宽度，读取时 clamp 到当前 MIN/MAX 范围；读取失败或无值时使用默认值。窗口缩窄至响应式断点时的 auto-collapse 行为 SHALL 保留，且 SHALL NOT 覆盖已持久化的宽度偏好——面板展开后恢复持久化宽度。

#### Scenario: 拖拽调整数据区宽度

- **WHEN** 用户将鼠标悬停在数据区与图表区之间的分隔条上，看到 col-resize 光标，按下并拖拽 100px 向右
- **THEN** 数据区宽度增加约 100px，图表区相应缩小，无布局溢出

#### Scenario: 宽度持久化跨刷新

- **WHEN** 用户拖拽调整数据区宽度至 350px 后刷新页面
- **THEN** 数据区恢复为 350px（而非默认 240px）

#### Scenario: 读取时 clamp 到安全范围

- **WHEN** localStorage 中存储的宽度为 500px（超出当前 MAX 400px），应用加载
- **THEN** 数据区宽度为 400px（被 clamp 到 MAX），无布局溢出

#### Scenario: auto-collapse 不覆盖持久化偏好

- **WHEN** 用户在宽屏上将数据区拖至 350px，窗口缩窄触发 auto-collapse，再放大窗口使面板展开
- **THEN** 展开后面板宽度恢复为 350px，而非默认 240px

### Requirement: 折叠态 icon rail

面板折叠时 SHALL 渲染垂直标签条（48px 宽），包含：顶部展开按钮（Chevron 图标 + Tooltip），中部 2-3 个功能图标（hover 高亮，点击展开面板），底部面板名称（竖直文字）。功能图标 SHALL 有 Tooltip 说明其功能。

#### Scenario: 折叠态显示 icon rail

- **WHEN** 数据区处于折叠状态
- **THEN** 显示 48px 宽的垂直标签条，包含展开按钮、功能图标和面板名称竖直文字，而非空白条

#### Scenario: 点击功能图标展开并定位

- **WHEN** 工具箱处于折叠状态，用户点击对齐功能图标
- **THEN** 工具箱展开，且自动对齐 Accordion 面板滚动到可见区域

### Requirement: 模式状态指示器

工具栏 SHALL 在右侧区域显示当前交互模式的名称标签（含 accent 色圆点），数据源为 HudShortcuts 的 `TOOL_HINTS`，与当前激活的 ToggleGroup 项同步更新。

#### Scenario: 模式切换时指示器更新

- **WHEN** 用户从一般选中切换到框选放大
- **THEN** 工具栏右侧立即显示 accent 色圆点 + "框选放大"文字

#### Scenario: 回到一般选中时指示器显示

- **WHEN** 用户点击已激活的模式按钮回到一般选中
- **THEN** 指示器显示灰色圆点 + "一般选中"