## Why

Jenny（邵珍珍）提出能否横向单个样左右移动（该功能可锁定，锁定后无法横向移动），纵向单个样调整间距。当前横向移动依赖"一键对齐"自动完成，`curveStore.offsets{id:{xOffset,yOffset}}` 仅由对齐算法写入，缺少手动微调入口；`CurveScaleOverlay` 的 shift+drag 仅调整 `curveScaleOffset`（缩放模式下的纵向偏移），非持久 xOffset/yOffset，且仅在 scale 模式生效；无任何锁定机制防止误操作。

## What Changes

- 新增"手动移动"模式/工具：选中单条曲线后，可通过拖拽横向移动（写 `xOffset`）、纵向移动调整与相邻曲线间距（写 `yOffset`）。
- 新增横向锁定机制：每条曲线可标记 `locked`（锁定后横向拖拽被禁用，纵向仍可调）；提供工具栏/右键锁定开关。
- 手动移动 SHALL 写入 curveStore 的 `xOffset`/`yOffset` 并纳入 zundo undo/redo 与持久化；与"一键对齐"协同——重新执行对齐时 SHALL 尊重锁定曲线（不改变其 xOffset）。
- 选中态与拖拽光标提示。

## Capabilities

### New Capabilities

- `manual-curve-move`：单曲线手动横向/纵向移动、横向锁定、与自动对齐协同、undo 与持久化。

### Modified Capabilities

- `alignment-behavior`：对齐操作 SHALL 尊重 `locked` 曲线——锁定曲线的 `xOffset` 在执行对齐时 SHALL NOT 被修改。

## Impact

- `src/store/curveStore.ts` — curve 数据/offset 新增 `locked?: boolean`；新增 `setCurveOffset(id, {xOffset,yOffset})`、`toggleCurveLocked(id)` action。
- `src/components/chart/ManualMoveOverlay.tsx`（新）— 拖拽写 offset；横向受锁限制。
- `src/components/chart/WaterfallChart.tsx` — 渲染读取 `locked` 状态用于光标/视觉提示；手动移动模式启用时挂载 overlay。
- `src/components/toolbar/Toolbar.tsx` — "手动移动"模式按钮 + "锁定横向"切换。
- `src/persistence/index.ts` — `locked` 随 curve 数据持久化。
- 对齐算法（调用对齐的 store action）— 跳过 `locked` 曲线的 xOffset 写入。
