## 1. 状态与类型

- [x] 1.1 curve 数据/offset 类型新增 `locked?: boolean`（`locked: Record<string, boolean>` 在 curveStore state）
- [x] 1.2 `curveStore` 新增 `setCurveOffset(id, {xOffset?, yOffset?})`、`toggleCurveLocked(id)` action；确认进 zundo undo/redo
- [x] 1.3 `persistence/index.ts` 将 `locked` 随 curve 数据持久化；workspace JSON 含锁定

## 2. 手动移动模式与 overlay

- [x] 2.1 新增模式枚举值（与 brace/point-label/scale 互斥），`uiStore` 加 `manualMoveMode` 状态
- [x] 2.2 新增 `src/components/chart/ManualMoveOverlay.tsx`：点击拾取曲线（seriesIndex→visibleIds）、拖拽写 xOffset（水平）/yOffset（垂直），复用 `convertPixelToX`/yPixelMath
- [x] 2.3 `WaterfallChart.tsx` 手动移动模式启用时挂载 overlay、光标提示、锁定视觉
- [x] 2.4 `Toolbar.tsx` 加"手动移动"模式按钮 + "锁定横向"toggle（作用于选中曲线）

## 3. 对齐协同

- [x] 3.1 对齐 action 遍历跳过 `locked` 曲线的 xOffset 写入
- [x] 3.2 回归：手动移动后再次对齐不累积偏移（幂等）

## 4. 验证与回归

- [x] 4.1 `npx tsc --noEmit` 干净
- [x] 4.2 `npx vitest run` 全绿
- [x] 4.3 `npm run build` 成功
- [ ] 4.4 人工回归：单曲线横向/纵向拖拽移动；锁定后横向禁用纵向可用；对齐不改变锁定曲线；Ctrl+Z 撤销；刷新保留位置与锁定