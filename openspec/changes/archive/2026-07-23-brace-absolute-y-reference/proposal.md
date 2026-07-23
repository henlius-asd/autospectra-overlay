## Why

区间标签（brace）的纵向位置当前锚定在 `braceY = convertYToPixel(peak)`（`peak = rawDataMin + yRangeForLayer`，一个对所有曲线 `offset.yOffset` 聚合后的极值）之上，再叠加一个像素级 `brace.yOffset`。这个 `peak` 并不含被平移曲线自身的 `offset.yOffset`，也不等于顶曲线的实际渲染峰值。因此当用户上下平移图层（`ManualMoveOverlay` 改 `offset.yOffset`）时，曲线整体移动而 `peak` 只随聚合轴范围间接变化，两者参考系不同 → 区间标签相对曲线漂移。点标签因使用「绝对数据 Y → `convertYToPixel`」与曲线数据同参考系，故不漂移。本变更将区间标签的纵向参考系对齐到点标签：改为绝对数据 Y，让两类标注共用同一条轴变换、行为一致。

## What Changes

- **BREAKING**：`BraceAnnotation` 新增 `y: number`（绝对数据 Y）；`yOffset` 降级为 legacy/过渡字段。区间标签纵向位置 SHALL 由 `convertYToPixel(brace.y)` 渲染，不再锚定顶曲线 `peak`，不再使用像素级 `yOffset`。
- 区间标签放置 SHALL 用 `y = convertPixelToY(placementY)`（镜像点标签放置）；纵向拖拽 SHALL 用 `y = convertPixelToY(convertYToPixel(origY) + dy)`（镜像点标签拖拽）。横向放置/拖拽（`startX`/`endX` 绝对数据 X）不变。
- **BREAKING**：工作区快照版本 v4 → v5。v5 干净格式仅含 `y`，不含 `yOffset`。legacy `yOffset`（brace：相对 `braceY` 的像素偏移；点标签：相对顶曲线的像素偏移）SHALL 在过渡期随对象携带，并在首次图表渲染（几何就绪后）经共享 `migrateLegacyPixelOffset(basePixel, yOffset, convertPixelToY)` 做**保位置**的懒运行时迁移，迁移后剥离 `yOffset` 并持久化 v5。
- 点标签 legacy `yOffset` 迁移从**有损 `y=0`**升级为与 brace 相同的**保位置懒运行时**机制（迁移机制对齐）。点标签渲染不变（已是绝对 Y）。
- 导出（PNG/PPTX）区间标签位置 SHALL 改用 `yToPixelExport(brace.y)`，与屏幕一致。legacy brace 首次重开后导出位置将跳到与屏幕一致（修复此前屏幕/导出 brace 基线不一致的潜在缺陷）。
- 新增漂移回归测试：纯函数模拟 `offset.yOffset` 变化，断言绝对-Y brace 与曲线间距像点标签一样保持不变。
- `braceY` 计算保留，用于过渡期 legacy 渲染/迁移分支与拖拽预览/对话框回退。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `brace-tool`：区间标签纵向参考系从「锚定顶曲线 `peak` + 像素 `yOffset`」改为绝对数据 Y（`convertYToPixel(brace.y)`），与曲线解耦；放置与纵向拖拽改用绝对 Y（镜像点标签）。原「贴近最高曲线峰值」的自动语义移除，标签落在用户点击的绝对 Y。
- `point-label-absolute-y`：legacy `yOffset` 迁移从有损 `y=0` 改为保位置懒运行时（与 brace 共享 `migrateLegacyPixelOffset`），实现两类标注迁移机制对齐。
- `workspace-persistence`：快照版本迁移至 v5；`brace.y` 绝对数据 Y 为新字段；legacy `yOffset`（brace 与点标签）过渡期携带 + 首次渲染保位置懒迁移；持久化 v5 干净（仅 `y`）。

## Impact

- 类型：`src/types/brace.ts`（`y: number` + `yOffset?: number` legacy）、`src/types/pointLabel.ts`（`yOffset?: number` legacy）。
- 渲染/交互：`src/components/chart/BraceOverlay.tsx`（渲染双分支、放置、拖拽、对话框位置）、`src/components/chart/WaterfallChart.tsx`（保留 `braceY`、新增首渲染迁移 effect）、`src/components/chart/PointLabelOverlay.tsx`（渲染不变，仅类型兼容）。
- 导出：`src/components/chart/exportImage.ts`、`src/components/chart/exportPptx.ts`（brace 位置改 `yToPixelExport(brace.y)`，双分支兼容 legacy）。
- 持久化：`src/persistence/index.ts`（v5、loader 携带 legacy yOffset、`buildWorkspaceSnapshot`/`applyWorkspaceSnapshot` 同步）。
- 新模块：共享 `migrateLegacyPixelOffset` util（建议 `src/components/chart/annotationMigration.ts`）；复用 `labelGeometry.ts` 的 `getTopCurvePixelYAtX` 作为点标签 legacy 迁移基线。
- 测试：`persistence/__tests__/index.test.ts`（v4→v5 迁移）、新 `annotationMigration` util 测试、新漂移回归测试、`labelGeometry.test.ts`（`getTopCurvePixelYAtX` 用于迁移基线的说明）、更新持久化 fixture。
- 风险：过渡期首帧渲染用 legacy 像素公式（双分支）保证不闪烁；legacy brace 导出位置首次重开后移位至与屏幕一致（符合一致性目标）。
