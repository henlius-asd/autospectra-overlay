## Context

当前工具栏约 25 个纯文本按钮平铺一行，无图标无分组。工具类和配置类功能混杂，视觉层次不清。需在 Phase 1 重构工具栏的呈现方式——图标化、分组、下拉菜单——同时保留所有现有功能，为 Phase 2 功能迁移奠定基础。

**关键约束**：Phase 1 不删除任何功能按钮（仅改变呈现方式），避免 Phase 1→2 间的功能空窗。按钮删除在 Phase 2 完成。

## Goals / Non-Goals

**Goals:**
- 工具栏按钮从纯文本改为图标 + tooltip（内联 SVG，无外部依赖）
- 创建 3 个基础 UI 组件：icons.tsx、Dropdown.tsx、Toast.tsx
- 引入 Toast 通知替换 alert()
- 统一模式按钮/动作按钮/开关按钮的视觉语言
- 移除误导性"标签样式"按钮（仅展开右栏，无实际功能）
- 工具栏加 overflow-x-auto 处理窄屏溢出

**Non-Goals:**
- 不迁移功能到工具箱（Phase 2 任务）
- 不改变任何互斥逻辑
- 不引入外部图标库（内联 SVG 符合离线/无 CDN 约束）
- 不实现 Accordion（Phase 2 任务）

## Decisions

### 1. 内联 SVG 图标（非图标库）

**选择内联 SVG**。理由：
- 无外部 CDN 依赖（PRD 约束）
- `lucide-react` 等图标库需额外安装，且部分图标不匹配领域需求
- 统一 24×24 viewBox，`stroke-width: 2`，`stroke-linecap: round`，`stroke-linejoin: round`
- 所有图标定义在 `src/components/ui/icons.tsx`，单一真相来源

### 2. 按钮视觉语言

- **模式按钮**（brace/pointLabel/move/brush/zoomGlobal/zoomCurve）：active = 填充图标 + `bg-blue-500 text-white`；inactive = 描边图标 + `text-gray-600 hover:bg-gray-200`
- **动作按钮**（undo/redo/export/workspace）：无状态，图标 + `hover:bg-gray-200`
- **开关**（含图例）：在下拉菜单内表现为 checkbox 行，`bg-blue-100 text-blue-700` 表示开启

### 3. 下拉菜单组件设计

创建 `Dropdown.tsx`：点击触发按钮展开，点击外部/Esc 关闭。支持 `label`、`items` 数组（每项含 icon、label、onClick、checkbox 状态、danger 样式）。使用 `useRef` + `useEffect` 监听外部点击和键盘事件。

两个下拉菜单：
- **导出 ▾**：导出图片、导出 PPTX、含图例(checkbox)、导出工作区、导入工作区
- **工作区 ▾**：新建工作区

### 4. Toast 系统设计

在 `uiStore` 增加 `toast: { message: string; type: 'success' | 'error' | 'info'; id: number } | null` 状态。`showToast(message, type)` action 设置 toast 并启动 3s 定时器自动清除。Toast 渲染在 `App.tsx` 根节点，使用 `fixed` 定位在右下角，带淡入/淡出动画。

替换目标：
- `Toolbar.tsx:113` — `alert('导出图片失败')`
- `Toolbar.tsx:122` — `alert('导出 PPTX 失败')`
- `Toolbar.tsx:165` — `alert('工作区文件解析失败')`
- `AlignmentControls.tsx:106` — `alert('对齐失败')`

### 5. 工具栏分组布局

从左到右：
1. 撤销 | 重做（分隔线）
2. 交互模式组：brace pointLabel move [lock] brush（分隔线）
3. 缩放模式组：zoomGlobal zoomCurve（分隔线）
4. 导出 ▾ 下拉菜单
5. 工作区 ▾ 下拉菜单
6. 版本号（右对齐）

### 6. 移除"标签样式"按钮

`Toolbar.tsx:254-260` — 此按钮仅调用 `toggleRightPanel()` 当右栏折叠时，不打开任何标签编辑 UI。title 文字"标签样式：字号、字体、颜色（在工具箱中编辑）"误导。标签样式在工具箱中已可直接访问。Phase 2 将默认展开该面板。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 内联 SVG 图标设计不统一 | 在 icons.tsx 中统一定义 size/stroke-width/viewport，所有图标使用相同 24×24 viewBox |
| 模式按钮从文字改为图标后用户可能不识别 tooltip 描述 | 保留 tooltip 文字（现有的 title 属性），确保清晰描述功能 |
| 移除"标签样式"按钮后右栏折叠时用户可能找不到标签样式 | Phase 2 将默认展开"标签样式"面板；用户仍可通过折叠条展开按钮打开右栏 |