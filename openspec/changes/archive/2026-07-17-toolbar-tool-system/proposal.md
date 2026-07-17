## Why

当前工具栏的交互模式由 6 个独立 boolean flag 控制，互斥逻辑分散在 Toolbar.tsx 的各个 handler 中，工具间的语义边界模糊。用户需要悬停到图标上才能理解工具的用途，标注模式下拖拽会意外平移图表，缺乏统一的"默认工具"概念。参照 PS/Figma 的成熟工具系统设计，将交互模式重构为统一的工具枚举，明确分组，全局临时平移，提升操作清晰度和手感。

## What Changes

- **BREAKING**: 交互模式从 6 个 boolean flag 重构为单一 `InteractionMode` 枚举（`'select' | 'brush' | 'brace' | 'pointLabel' | 'move' | 'zoomGlobal' | 'zoomCurve'`）
- 新增「一般选中」工具（`select`）作为默认工具，支持选中曲线 + 拖拽平移画布
- 移除独立的「手型拖动」手动按钮，改为全局临时切换：在任何工具下按住空格键临时切换为手型平移，松开恢复原工具
- 标注类工具（区间标签、点标签）和变形类工具（手动移动、缩放）激活时禁用 ECharts 原生画布平移，避免标注/移动时的误操作
- 工具栏按操作语义明确分为 3 组（视图操作 / 标注插入 / 曲线分布），组间用分隔符区分
- 工具栏布局改为左侧工具组 + 右侧操作组（撤销/重做/导出/工作区），版本次号右对齐
- 新增 HUD 快捷键说明书：首次进入自动弹出，关闭后通过 `?` 按钮重新打开，左侧固定快捷键，右侧动态显示当前工具的操作说明
- **BREAKING**: 优化 7 个工具图标，「一般选中」新增单箭头图标，框选放大图标增加放大镜角标
- Esc 键统一取消当前工具，回到「一般选中」模式

## Capabilities

### New Capabilities

- `toolbar-tool-system`: 统一的工具系统——7 个互斥工具、3 组分组、一般选中默认工具、按住空格临时平移、HUD 快捷键说明书
- `hud-shortcuts`: 渲染区浮层快捷键说明书，首次显示 + `?` 按钮恢复，动态显示当前工具说明

### Modified Capabilities

- `state-management`: uiStore 中 6 个 boolean flag（`bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode`）替换为单一 `interactionMode: InteractionMode` 枚举，所有互斥逻辑集中到 `setInteractionMode` action
- `three-column-layout`: 工具栏布局从全平铺改为左侧工具组 + 右侧操作组，工具栏按钮重新组织
- `box-select-zoom`: 框选缩放从 `brushMode` boolean 改为 `interactionMode === 'brush'`，新增自动退出后回到 `select` 模式（而非无模式），禁用原生画布平移
- `brace-tool`: 区间标签从 `bracePlacementMode` boolean 改为 `interactionMode === 'brace'`，激活时禁用原生画布平移，Esc 回到 `select`
- `point-label-tool`: 点标签从 `pointLabelPlacementMode` boolean 改为 `interactionMode === 'pointLabel'`，激活时禁用原生画布平移，Esc 回到 `select`
- `manual-curve-move`: 手动移动从 `manualMoveMode` boolean 改为 `interactionMode === 'move'`，激活时禁用原生画布平移，锁定按钮仅在 `move` 工具选中曲线时显示，Esc 回到 `select`
- `y-axis-zoom`: 全局缩放从 `globalScaleMode` boolean 改为 `interactionMode === 'zoomGlobal'`，单曲线缩放从 `perCurveScaleMode` boolean 改为 `interactionMode === 'zoomCurve'`，缩放模式禁用原生画布平移

## Impact

- **uiStore** (`src/store/uiStore.ts`): 移除 6 个 boolean flag 及其 setter，新增 `interactionMode` 字段和 `setInteractionMode` action
- **Toolbar** (`src/components/toolbar/Toolbar.tsx`): 重写工具按钮逻辑，从多个 handler 简化为统一的 `setInteractionMode` 调用；新增分组分隔符和两区布局
- **Icons** (`src/components/ui/icons.tsx`): 新增 `SelectIcon`（单箭头），优化 `BoxSelectIcon`（增加放大镜角标）
- **WaterfallChart** (`src/components/chart/WaterfallChart.tsx`): 根据 `interactionMode` 控制 ECharts 原生画布平移行为、global cursor 样式
- **ChartOverlay** (`src/components/chart/ChartOverlay.tsx`): 根据 `interactionMode` 控制标注/移动事件的监听
- **HUD 组件** (新增 `src/components/ui/HudShortcuts.tsx`): 快捷键说明书浮层
- **全局键盘事件**: 监听空格键（临时手型）和 Esc 键（回到 select）
- **localStorage**: 新增 `hasSeenShortcuts` 标记