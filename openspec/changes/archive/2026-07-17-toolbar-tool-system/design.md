## Context

当前工具栏的交互模式由 6 个独立 boolean flag 控制（`bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode`）。互斥逻辑分散在 Toolbar.tsx 的各个 handler 中，每个 handler 需要手动关闭其他 5 个 flag。adr/0001-toolbar-toolbox-division 按"用户是否需要看图表"划分了工具栏和工具箱的职责，但工具栏内部工具的分组逻辑仍基于 toolbar-polish 的"操作对象"分组（标注工具 / 变形工具），缺少明确的"默认工具"和"临时平移"机制。

目标是将工具系统提升到与 PS/Figma 一致的可用性水平：统一工具枚举、明确分组、默认选中工具、全局临时平移、HUD 快捷键提示。

## Goals / Non-Goals

**Goals:**
- 将 6 个 boolean flag 重构为单一 `InteractionMode` 枚举，集中互斥逻辑
- 新增「一般选中」工具作为默认模式，支持选中曲线 + 拖拽平移画布
- 实现按住空格键全局临时切换手型工具
- 工具栏按 3 组明确分组（视图操作 / 标注插入 / 曲线分布），左工具右操作布局
- 新增 HUD 快捷键说明书浮层
- Esc 统一取消当前工具回到 `select`
- 优化工具图标，新增 `SelectIcon`

**Non-Goals:**
- 不改变工具箱（右栏）的内容和布局
- 不改变 ECharts 图表的底层渲染逻辑（仅控制交互行为）
- 不改变撤销/重做、导出、工作区管理的功能
- 不新增键盘快捷键（数字键切换工具等）——延后至后续版本
- 不改变工具按钮的 18px 渲染尺寸

## Decisions

### 1. InteractionMode 枚举设计

**方案**: 使用 TypeScript 联合类型定义 `InteractionMode`：

```typescript
export type InteractionMode =
  | 'select'       // 一般选中：选中曲线 + 拖拽平移画布（默认）
  | 'brush'        // 框选放大：拖拽框选矩形区域缩放
  | 'brace'        // 区间标签：拖拽选择区间放置标注
  | 'pointLabel'   // 点标签：点击图表放置标注
  | 'move'         // 手动移动：拖拽移动曲线
  | 'zoomGlobal'   // 全局缩放：滚轮缩放所有曲线 Y 轴
  | 'zoomCurve';   // 单曲线缩放：滚轮缩放选中曲线 Y 轴
```

**替代方案**: 保持 6 个 boolean flag 但抽取公共互斥逻辑到一个 helper 函数。被拒绝——不能从根本上解决状态分散和语义模糊的问题。

**互斥规则**: 7 个工具全局互斥，同一时间只有一个 active。`setInteractionMode(mode)` 直接设置新值，不再需要手动关闭其他 flag。

**默认值**: `'select'`。应用启动时、Esc 键按下时、某些操作自动完成后（如框选缩放完成）回到此模式。

### 2. 一般选中工具（select）行为

选中模式下：
- **点击曲线**: 选中该曲线（设置 `selectedCurveId`）
- **拖拽画布空白区域**: 平移画布（ECharts dataZoom 原生行为）
- **滚轮**: 缩放画布（ECharts 原生行为）
- **光标**: `default`（箭头）

与 PS 的移动工具 (V) 一致：选中对象 + 平移画布。

### 3. 专用工具模式下的画布平移

**规则**: 在 `brace`、`pointLabel`、`move`、`brush`、`zoomGlobal`、`zoomCurve` 模式下，禁用 ECharts 原生 `dataZoom` 的 `type: 'inside'` 拖拽平移和滚轮缩放行为。

**实现方式**: 根据 `interactionMode` 动态切换 ECharts option 中 dataZoom 的配置：
- `select` 模式：`dataZoom` 配置 `type: 'inside'`（原生平移 + 滚轮缩放）
- 其他模式：将 `type: 'inside'` 替换为 `type: 'slider'`（隐藏），禁用原生交互

**替代方案**: 通过事件拦截阻止平移/缩放。被拒绝——ECharts 的事件拦截复杂且不可靠，直接修改 dataZoom 配置更可靠（参考现有 brushMode 的实现 `box-select-zoom` spec）。

### 4. 按住空格临时手型工具

**实现**: 在全局 `keydown`/`keyup` 事件中监听空格键：
- `keydown` (空格): 记录当前 `interactionMode`，设置 `spaceHeld = true`，光标变为 `grab`/`grabbing`
- 空格按下期间，ECharts 恢复 dataZoom `type: 'inside'`，允许拖拽平移
- `keyup` (空格): 恢复 `spaceHeld = false`，恢复原 `interactionMode` 的 dataZoom 配置和光标

**关键细节**:
- 空格键不触发 `setInteractionMode`，不影响工具栏按钮的激活状态
- 需要在 `useEffect` 中监听 `keydown`/`keyup`，并处理组件卸载时的清理
- 防止空格键触发页面滚动：`e.preventDefault()` 仅在 `interactionMode !== 'select'` 时调用（select 模式下空格不需要拦截）

**替代方案**: 在工具栏中增加独立的「手型拖动」按钮。被拒绝——增加工具数量，且在标注/移动模式下需要手动切换工具才能平移，操作不流畅。

### 5. Esc 键行为

**规则**: 在任何非 `select` 工具下按 Esc，回到 `select` 模式。在 `select` 模式下按 Esc 无操作。

**实现**: 在全局 `keydown` 事件中监听 Escape 键，调用 `setInteractionMode('select')`。

**替代方案**: Esc 仅关闭当前工具，回到"无工具"状态。被拒绝——"无工具"状态语义模糊，且与 PS/Figma 的 Esc 行为不一致。

### 6. 工具栏布局

**左侧工具组**: 7 个互斥工具按钮，分 3 组，组间用 `w-px h-5 bg-gray-300` 分隔符：
```
[一般选中] [框选放大] | [区间标签] [点标签] | [手动移动] [全局缩放] [单曲线缩放]
```

**右侧操作组**: 非工具按钮，放在右侧（`ml-auto`）：
```
[撤销] [重做] | 导出 ▾ 工作区 ▾ | v1.x
```

**替代方案**: 全部在左侧平铺。被拒绝——工具和操作语义不同，混在一起增加认知负担。

### 7. 锁定按钮

锁定按钮（`LockIcon`）仅在 `interactionMode === 'move'` 且 `selectedCurveId !== null` 时显示。位于「手动移动」按钮旁边，与其他工具按钮在同一行。

### 8. HUD 快捷键说明书

**组件**: `HudShortcuts`，渲染在图表渲染区左上角，`absolute` 定位。

**显示逻辑**:
- 首次进入：检查 `localStorage` 中 `hasSeenShortcuts` 标记，若无则自动弹出
- 关闭后：在图表渲染区右上角显示 `?` 按钮
- 点击 `?` 按钮或按 `?` 键：重新打开 HUD
- 关闭：点击关闭按钮或再次按 `?`，设置 `localStorage.hasSeenShortcuts = true`

**内容布局**:
```
┌──────────────────────────────┐
│ 快捷键            当前工具 ▲ │
│ ──────────────────────────── │
│ 空格    临时平移    区间标签  │
│ Ctrl+Z  撤销        拖拽选择  │
│ Ctrl+Y  重做        区间范围  │
│ Esc     回到默认              │
└──────────────────────────────┘
```

左侧快捷键列表固定，右侧根据当前 `interactionMode` 动态显示工具名称和操作说明。

**样式**: 半透明背景（`bg-gray-900/80`），白色文字，圆角，可拖拽移动位置。

### 9. 图标优化

| 工具 | 当前图标 | 优化方向 |
|------|---------|---------|
| 一般选中 | 无（新增） | 单箭头 ↖（PS/Figma 标准），`SelectIcon` |
| 框选放大 | `BoxSelectIcon`（虚线矩形） | 虚线矩形 + 放大镜角标，`BoxSelectIcon` |
| 区间标签 | `BraceIcon`（花括号） | 保持不变 |
| 点标签 | `PointLabelIcon`（地图标记） | 保持不变 |
| 手动移动 | `MoveIcon`（曲线 + 水平双向箭头） | 保持不变 |
| 全局缩放 | `ZoomGlobalIcon`（多条线 + 垂直双向箭头） | 保持不变 |
| 单曲线缩放 | `ZoomCurveIcon`（单曲线 + 垂直双向箭头） | 保持不变 |

新增 `SelectIcon` 和优化 `BoxSelectIcon` 即可，其余图标保持现有设计。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 枚举重构影响面广，涉及 7 个 spec 和多个组件 | 逐组件渐进式替换，保持旧 boolean flag 的向后兼容过渡期 |
| 空格键全局监听可能与其他键盘交互冲突（如输入框） | 仅在焦点不在 input/textarea 时生效，通过 `e.target` 判断 |
| dataZoom 动态切换可能导致 ECharts 重渲染闪烁 | 使用 `replaceMerge` 机制（已有 `brushMode` 的成熟实现） |
| HUD 浮层可能遮挡图表内容 | 放在角落 + 可拖拽 + 可关闭 + 半透明背景 |
| 现有代码中 `globalScaleMode` 和 `perCurveScaleMode` 可以共存，重构后改为互斥 | 评估现有用户是否同时使用两个缩放模式——若需要的场景多，可考虑将 `zoomGlobal` 和 `zoomCurve` 改为非互斥的 toggle（类似当前行为），但 UI 上仍保持分组 |

## Open Questions

- `globalScaleMode` 和 `perCurveScaleMode` 共存的使用场景是否常见？若常见，可能需要保留两个缩放 toggle 的共存能力
- 是否需要为工具切换分配数字键快捷键（1-7）？——延后至后续版本