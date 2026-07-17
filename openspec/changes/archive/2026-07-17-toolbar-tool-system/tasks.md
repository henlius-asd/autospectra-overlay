## 1. 类型定义与 uiStore 重构

- [x] 1.1 在 `src/types/` 中新建 `interaction.ts`，定义 `InteractionMode` 联合类型
- [x] 1.2 在 `uiStore.ts` 中新增 `interactionMode: InteractionMode` 字段，默认值 `'select'`
- [x] 1.3 新增 `setInteractionMode(mode: InteractionMode)` action，直接设置 `interactionMode`
- [x] 1.4 新增 `resetInteractionMode()` action，重置为 `'select'`
- [x] 1.5 在 `resetUiForNewWorkspace` 中调用 `resetInteractionMode()`
- [x] 1.6 移除 `bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode` 字段及其 setter/toggle action
- [x] 1.7 移除 uiStore 中所有与 6 个旧 boolean flag 相关的类型定义和初始化代码

## 2. 图标与 UI 组件

- [x] 2.1 在 `icons.tsx` 中新增 `SelectIcon` 组件（单箭头 ↖，viewBox 24×24）
- [x] 2.2 优化 `BoxSelectIcon` 组件，在虚线矩形基础上增加放大镜角标
- [x] 2.3 导出 `SelectIcon` 和更新后的 `BoxSelectIcon`，供 Toolbar 引用

## 3. Toolbar 组件重构

- [x] 3.1 替换所有旧 flag 引用为 `interactionMode` 和 `setInteractionMode`
- [x] 3.2 用 `setInteractionMode` 替换所有 handler 中的互斥逻辑（handleToggleBraceMode、handleTogglePointLabelMode 等）
- [x] 3.3 实现「一般选中」按钮：点击设置 `'select'`，使用 `SelectIcon`
- [x] 3.4 实现工具按钮的 toggle 行为：点击已激活的工具回到 `'select'`（而非直接取消到无模式）
- [x] 3.5 添加 3 组分组分隔符：`[一般选中] [框选放大] | [区间标签] [点标签] | [手动移动] [全局缩放] [单曲线缩放]`
- [x] 3.6 重构工具栏布局为左右两区：左侧工具组，右侧操作组（撤销/重做/导出/工作区），版本次号右对齐
- [x] 3.7 调整锁定按钮显示逻辑：仅在 `interactionMode === 'move' && selectedCurveId !== null` 时渲染
- [x] 3.8 调整工具按钮禁用逻辑：`interactionMode !== 'select'` 时无曲线则禁用

## 4. 图表交互适配

- [x] 4.1 在 `WaterfallChart.tsx` 中根据 `interactionMode` 动态切换 dataZoom 配置（`select` → `type: 'inside'`，其他 → `type: 'slider'` 隐藏）
- [x] 4.2 在 `ChartOverlay.tsx` 中根据 `interactionMode` 控制标注/移动事件的监听
- [x] 4.3 在 `WaterfallChart.tsx` 中根据 `interactionMode` 设置图表光标样式
- [x] 4.4 确保 `brushMode` 逻辑迁移到 `interactionMode === 'brush'` 后框选缩放功能正常

## 5. 全局键盘事件

- [x] 5.1 新建 `src/hooks/useGlobalKeyboard.ts` hook，监听全局 keydown/keyup 事件
- [x] 5.2 实现空格键逻辑：按下时设置 `spaceHeld` 状态，临时恢复 dataZoom `type: 'inside'`，光标变为 `grab`；松开时恢复
- [x] 5.3 空格键在非 `select` 工具下调用 `e.preventDefault()` 阻止页面滚动，在 `select` 模式下不拦截
- [x] 5.4 实现 Esc 键逻辑：非 `select` 工具下调用 `setInteractionMode('select')`
- [x] 5.5 仅在焦点不在 input/textarea 时响应空格/Esc 事件
- [x] 5.6 在应用根组件中挂载 `useGlobalKeyboard` hook

## 6. HUD 快捷键说明书

- [x] 6.1 新建 `src/components/ui/HudShortcuts.tsx` 组件
- [x] 6.2 实现首次显示逻辑：检查 `localStorage.hasSeenShortcuts`，首次访问自动弹出
- [x] 6.3 实现 HUD 内容：左侧固定快捷键列表，右侧根据 `interactionMode` 动态显示工具说明
- [x] 6.4 实现关闭按钮：关闭 HUD，设置 `localStorage.hasSeenShortcuts = true`，显示 `?` 按钮
- [x] 6.5 实现 `?` 按钮：位于图表渲染区右上角，点击重新打开 HUD
- [x] 6.6 实现 HUD 样式：半透明深色背景、白色文字、圆角、fixed 定位在图表渲染区左上角
- [x] 6.7 实现 HUD 可拖拽移动（按住标题栏拖拽）
- [x] 6.8 在图表渲染区中集成 `HudShortcuts` 组件

## 7. 验证与清理

- [x] 7.1 验证所有 7 个工具按钮的互斥行为正确（同一时间只有一个 active）
- [x] 7.2 验证一般选中工具：点击曲线选中，拖拽平移画布，滚轮缩放
- [x] 7.3 验证专用工具下画布平移被禁用，按住空格可临时平移
- [x] 7.4 验证 Esc 键在所有非 select 工具下回到 select
- [x] 7.5 验证 HUD 首次显示、关闭、`?` 按钮重新打开流程
- [x] 7.6 验证 HUD 右侧内容随工具切换动态更新
- [x] 7.7 验证锁定按钮在 `move` 模式下的显示/隐藏逻辑
- [x] 7.8 验证新建工作区后 `interactionMode` 重置为 `'select'`
- [x] 7.9 运行 `npm run typecheck` 确保无 TypeScript 错误
- [x] 7.10 运行 `npm run lint` 确保代码风格一致（项目无 lint 脚本，tsc --noEmit 已通过，替代验证）
- [x] 7.11 全局搜索旧 boolean flag 引用（`bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode`），确保无残留引用