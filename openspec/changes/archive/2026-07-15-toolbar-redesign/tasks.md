## 1. 基础 UI 组件

- [x] 1.1 创建 src/components/ui/icons.tsx — 内联 SVG 图标组件集（~20 个图标）
- [x] 1.2 创建 src/components/ui/Dropdown.tsx — 点击展开下拉菜单，外部点击/Esc 关闭
- [x] 1.3 创建 src/components/ui/Toast.tsx — 非阻塞通知，3s 自动消失，success/error/info 类型

## 2. Toast 状态

- [x] 2.1 uiStore 增加 toast 状态 + showToast action
- [x] 2.2 App.tsx 渲染 Toast 组件
- [x] 2.3 替换 Toolbar.tsx 中所有 alert() 为 showToast()
- [x] 2.4 替换 AlignmentControls.tsx 中 alert() 为 showToast()

## 3. 工具栏重构

- [x] 3.1 撤销/重做按钮换为图标
- [x] 3.2 交互模式按钮换为图标 + tooltip，保留现有互斥逻辑
  - 放置模式组（互斥）: brace, pointLabel, move, brush
  - 缩放模式组（可共存）: zoomGlobal, zoomCurve
  - move 激活 + 选中曲线时显示 lock 图标按钮
- [x] 3.3 导出按钮组合为"导出"下拉菜单（导出图片/PPTX/含图例 checkbox/导出工作区/导入工作区）
- [x] 3.4 新建工作区按钮组合为"工作区"下拉菜单
- [x] 3.5 删除"标签样式"按钮
- [x] 3.6 版本号右对齐
- [x] 3.7 工具栏容器加 overflow-x-auto 处理窄屏溢出

## 4. 视觉语言统一

- [x] 4.1 模式按钮 active/inactive 视觉区分（填充 vs 描边图标 + 背景色）
- [x] 4.2 动作按钮无状态 + hover 效果
- [x] 4.3 禁用态统一样式（opacity + cursor-not-allowed）

## 5. 验证

- [x] 5.1 工具栏在 1920px 和 1366px 宽度下均完整可见不溢出
- [x] 5.2 所有交互模式互斥逻辑不变（brace/pointLabel/move/brush 互斥，global+perCurve 可共存）
- [x] 5.3 导出下拉菜单所有项功能正常
- [x] 5.4 Toast 在导出失败/解析失败时正确显示，非阻塞
- [x] 5.5 移除"标签样式"按钮后标签样式仍可通过工具箱访问
- [x] 5.6 图标 tooltip 文字清晰描述功能