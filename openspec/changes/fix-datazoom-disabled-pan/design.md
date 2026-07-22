## Context

`WaterfallChart.tsx` 的 dataZoom 选项构建（`useMemo`）在非 select 模式（brush/brace/zoomGlobal/zoomCurve/pointLabel/move）下用 `disabled: true` 禁用 inside dataZoom 以阻止用户拖拽/滚轮缩放，同时保持 `type: 'inside'` 不变以避免 ECharts 重建组件并重置 zoom 范围（参考既有 `datazoom_type_switch_resets_zoom` 修正）。但返回 select 模式时，`disabled` 字段被**省略**（原代码用三元：`disabled: true` 分支 vs 无 `disabled` 分支），ECharts `setOption` 按字段合并，省略不覆盖原值，导致 `disabled: true` 残留在 select 模式，inside dataZoom 持续禁用——拖拽不触发 dataZoom 事件，画布无法平移。

## Goals / Non-Goals

**Goals:**
- 修复 select 模式下 inside dataZoom `disabled` 未被清除的 bug，恢复拖拽平移画布。
- 消除 e2e 测试中 DEV seam 访问器的重复定义（漂移风险）。

**Non-Goals:**
- 不改变 dataZoom 的 type 保持策略（`disabled` 而非切换 type，已有修正）。
- 不改变其他交互模式（brace/zoomGlobal/zoomCurve/pointLabel/move）的 disabled 行为。
- 不重构 dataZoom 选项构建的整体架构。

## Decisions

### 决策 1：始终显式写入 `disabled: disableInside`

原代码用三元表达式条件写入 `disabled`：
```ts
const xInside = disableInside
  ? { id: 'xZoom', type: 'inside', xAxisIndex: 0, disabled: true }
  : { id: 'xZoom', type: 'inside', xAxisIndex: 0 };  // 省略 disabled
```

修复为始终显式写入：
```ts
const xInside = { id: 'xZoom', type: 'inside' as const, xAxisIndex: 0, disabled: disableInside };
```

**理由**：ECharts `setOption` 默认合并语义（非 notMerge），省略的字段不会被清除，而是保留上次 setOption 的值。显式写入 `disabled: false` 迫使合并覆盖残留的 `true`。同样适用于 yZoom。

**替代方案**：
- **方案 B**：在离开 brush 时派发 `takeGlobalCursor { brushOption: false }` 停用画笔光标。经仪表化诊断排除：brush 组件已正确 dispose（`brushComponentCount: 0`），根因是 disabled 而非 cursor。
- **方案 C**：对 dataZoom 使用 `notMerge: true` 强制重建。不可行：重建会重置 zoom 范围（这正是 `datazoom_type_switch_resets_zoom` 修正要避免的）。

### 决策 2：e2e 测试设计

回归测试 `e2e/brush-then-pan.spec.ts` 包含：
- **控制组**：store 设缩放（不经 brush），drag-pan 断言窗口位移 + span 保持 → 隔离 brush 为唯一变量。
- **回归组**：真实 brush 拖拽 → 返回 select → drag-pan 断言窗口位移 + span 保持。
- 断言区分三种失败模式：无操作（extent 不变）、重框选（span 骤缩）、正常平移（span 保持、窗口位移）。

**理由**：控制组排除"pan 本身坏了"的误判；回归组锁定 brush 特定的 residue。span 保持断言（20% 容差）捕捉 stuck cursor 导致的意外重框选。

### 决策 3：e2e helpers 抽取

DEV seam 访问器（`getXExtent`、`getStoreXRange`、`setStoreXRange`、`setInteractionMode`、`waitForViewportSettled`、`prepareChartWithFullExtent` 等）在 `viewport-preserve.spec.ts` 与 `brush-then-pan.spec.ts` 中重复定义，SEAM 变更需两处同步。抽取到 `e2e/helpers.ts` 集中维护，两个 spec 改为 import。

## Risks / Trade-offs

- **风险**：`disabled: false` 在 ECharts 旧版本中可能有不同默认行为。**缓解**：项目使用 ECharts 6.1.0，`disabled: false` 为 inside dataZoom 的默认值，显式写入无副作用。现有 e2e 全量（11 项）通过验证。
- **风险**：`disabled: true` 误写为 `false` 导致非 select 模式下的 inside zoom 意外启用。**缓解**：`disableInside` 布尔值在所有模式下行为与修复前一致（select=false，非 select 且非 spaceHeld=true），仅改为显式写入。brush 模式 e2e 已验证 disabled 行为不变。
- **权衡**：选项对象多一个字段（`disabled: false`），内存开销可忽略（每个 dataZoom 组件一个布尔值）。