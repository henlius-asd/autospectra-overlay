## Why

工具栏 ~25 个纯文本按钮平铺一行，无分组无图标，视觉效果拥挤且难以快速识别功能。alert() 调用阻塞式体验差。右侧"标签样式"按钮仅为展开右栏而无实际功能，误导用户。需在 Phase 1 重构工具栏呈现方式，为 Phase 2 功能迁移奠定基础。

## What Changes

- 工具栏按钮从纯文本改为图标化（内联 SVG），分组并使用下拉菜单
- 创建 3 个基础 UI 组件：icons.tsx、Dropdown.tsx、Toast.tsx
- 引入 Toast 通知系统替换所有 alert() 调用
- 统一三种按钮类型（模式/动作/开关）的视觉语言
- 移除误导性"标签样式"按钮
- **此期不迁移功能到工具箱**——仅改变工具栏的呈现方式

## Capabilities

### New Capabilities
- 新增 `toast-notification` 能力：Toast 非阻塞通知系统，3s 自动消失，支持 success/error/info 类型

### Modified Capabilities
- `toolbar-undo-redo`：撤销/重做按钮从文字改为图标 + tooltip
- `three-column-layout` → "工具栏大括号按钮"：按钮改为图标
- `scale-slider` → "两个独立缩放按钮"：按钮改为图标
- `brace-tool` → "大括号插入工具按钮"：按钮改为图标

## Impact

- `src/components/ui/icons.tsx` — 新增 ~15 个内联 SVG 图标组件
- `src/components/ui/Dropdown.tsx` — 新增下拉菜单组件
- `src/components/ui/Toast.tsx` — 新增 Toast 通知组件
- `src/components/toolbar/Toolbar.tsx` — 重构：图标化、分组、下拉菜单、移除标签样式按钮
- `src/store/uiStore.ts` — 新增 toast 状态 + showToast action
- `src/App.tsx` — 渲染 Toast 组件
- `src/components/toolbox/AlignmentControls.tsx` — alert() 替换为 showToast()