## Context

区间标签（brace）当前纵向位置 = `braceY + brace.yOffset`，其中 `braceY = max(gridTop+…, convertYToPixel(peak) - BRACE_HEIGHT/2)`、`peak = rawDataMin + yRangeForLayer`。`peak` 是对所有曲线 `offset.yOffset` 聚合后的极值，不含被平移曲线自身的 `offset.yOffset`，也不含 `layerYOffset`。点标签则用绝对数据 Y 经 `convertYToPixel(pl.y)` 渲染，与曲线数据同参考系。因此上下平移图层时 brace 相对曲线漂移、点标签不漂移。代码中已存在但未被 brace 渲染使用的 `getTopCurvePixelYAtX`（`labelGeometry.ts`）能正确给出顶曲线真实像素 Y（含 `offset.yOffset` + `layerYOffset`），为迁移基线提供了现成纯函数。持久化当前 v4；brace 的 `yOffset` 是其活动模型，点标签 legacy `yOffset`（v1–v3）当前有损丢到 `y=0`。

## Goals / Non-Goals

**Goals:**
- 区间标签纵向参考系对齐点标签：绝对数据 Y，经共享 `convertYToPixel` 渲染，与曲线解耦。
- 两类标注共用同一保位置迁移机制（共享 `migrateLegacyPixelOffset` util），迁移行为完全一致。
- 迁移保位置（不有损丢到 `y=0`）；持久化 v5 干净格式仅含 `y`。
- 屏幕与导出的 brace 位置一致（顺带修复此前 screen 用 `peak`、export 用 `yMax+30` 的潜在不一致）。
- 用纯函数回归测试钉住「平移图层时 brace 不再相对曲线漂移」契约。

**Non-Goals:**
- 不让 brace 在单曲线缩放/层间距变化下自动跟踪顶曲线（那是 curve-tracking 方案，已排除；brace 行为与点标签一致——也不跟踪）。
- 不改 brace 的 X 参考（已是绝对数据 X）、不改括号形状（`brace-ppt-style`）、不改点标签渲染。
- 不在本次清理 legacy `yOffset` 字段与双分支渲染（留作全量迁移后的后续清理）。

## Decisions

### D1：绝对数据 Y，完全解耦（而非 curve-tracking）
brace 增 `y: number`，渲染 `convertYToPixel(brace.y)`，弃 `peak` 锚定与像素级 `yOffset`。
**理由**：用户明确「和点标签对齐」，点标签即绝对 Y 解耦。绝对 Y 让 brace 与曲线数据共用同一轴变换，平移时随轴跟随曲线（与点标签同行为）。
**备选**：用 `getTopCurvePixelYAtX` 让 brace 贴顶曲线（含 offset）——会在缩放/层间距下跟踪曲线，但与点标签行为相异，不满足「对齐」。

### D2：保位置懒运行时迁移（而非加载时有损）
过渡期 schema 随对象携带 legacy `yOffset`；首渲染几何就绪后用 `convertPixelToY(basePixel + yOffset)` 计算 `y`、剥离 `yOffset`、持久化 v5。
**理由**：`convertPixelToY` 依赖 `chartDims`/`gridTop`/`visibleYRange`（运行时），加载时不可用；brace 位置有价值，不应丢。
**备选**：加载时有损 `y=0`（点标签 precedent）——丢位置，且与 brace 保位置迁移不一致，已排除。

### D3：迁移机制对齐 + 共享 util（点标签也升级）
点标签 legacy `yOffset`（相对顶曲线）从有损 `y=0` 升级为同一 `migrateLegacyPixelOffset` 保位置机制。点标签渲染不变（已是绝对 Y）。util 签名：`migrateLegacyPixelOffset(basePixel, yOffset, convertPixelToY): number = convertPixelToY(basePixel + yOffset)`。
**理由**：用户要求两类标注迁移一致。无 legacy 文件时该路径休眠、零成本。
**备选**：仅清理 schema（点标签迁移仍 lossy）——与 brace 不一致，已排除。

### D4：过渡期 schema = `y` 必填 + `yOffset` legacy + 双分支渲染
`BraceAnnotation`/`PointLabel` 均为 `y: number`（必填）+ `yOffset?: number`（legacy）。loader 对缺 `y` 的 legacy 项设 `y=0` 占位、保留 `yOffset`。渲染双分支：`yOffset != null ? 旧像素公式 : convertYToPixel(y)`。
**理由**：`y` 必填不波及 `pl.y` 消费者类型；双分支使迁移前后像素一致（legacy 公式与迁移后 `convertYToPixel(y)` 给出同一像素），无闪烁。
**备选**：`y?: number` 可选——更对称但波及所有消费者空值检查，已排除。

### D5：导出 legacy brace = 保屏幕位置，导出随之一致
迁移 `y` 从屏幕像素算（`convertPixelToY(braceY + yOffset)`），导出也用 `yToPixelExport(brace.y)`。旧 brace 首次重开后导出位置跳到与屏幕一致。
**理由**：一个 `y` 无法同时匹配两个不同像素（旧 screen 用 `peak`、旧 export 用 `yMax+30`，本就不一致）；保屏幕（用户实时视图）优先，顺带实现屏幕/导出一致（符合目标）。
**备选**：各自保真——不可行（单一 `y` 约束），已排除。

### D6：保留 `braceY` 计算
`braceY` 仍按 `peak` + `gridTop` 下限计算，驱动过渡期 legacy 渲染/迁移分支 + 拖拽预览/对话框回退。迁移完成后 legacy 分支不再触发但代码无害。
**备选**：移除 `braceY`，预览/对话框改别的默认、legacy 分支内联旧公式——增复杂度且 legacy 迁移仍需 `peak`，已排除。

### D7：点标签 legacy 迁移基线 = `getTopCurvePixelYAtX(pl.x)`
基线像素取顶曲线在该标签 X 处的像素 Y（忠实于「相对顶曲线」语义）。
**理由**：点标签位于特定 X，相对顶曲线应取该 X 处的顶曲线值。
**备选**：取顶曲线峰值（单一 Y）——不忠实。仅在存在 v1–v3 含 `yOffset` 点标签文件时生效，否则休眠。

## Risks / Trade-offs

- **首帧 pre-migration 渲染** → 双分支用 legacy 像素公式给出正确位置，迁移后 `convertYToPixel(y)` 给同一像素，无闪烁。
- **迁移时序依赖 `chartDims`/轴就绪（ResizeObserver 异步）** → 迁移 effect 守卫几何就绪；未就绪期间 legacy 分支正确渲染。
- **legacy brace 导出位置首次重开移位** → 符合一致性目标（用户已确认接受）；顺带修复 screen/export 潜在不一致。
- **回滚有损** → v5 干净格式已剥离 `yOffset`；回滚到旧代码后 v5 brace 缺 `yOffset` 会落到默认 `braceY`（位置丢失）。缓解：迁移后勿回滚，或保留 v4 备份。
- **点标签 legacy 基线假设（at-x）** → 仅影响 v1–v3 含 `yOffset` 文件；若历史语义实为峰值，位置略偏；可接受（罕见、休眠）。

## Migration Plan

1. 类型：`BraceAnnotation` 加 `y: number` + `yOffset?: number`(legacy)；`PointLabel` 加 `yOffset?: number`(legacy)。
2. 持久化：`buildWorkspaceSnapshot` 版本 → 5；`applyWorkspaceSnapshot` 对缺 `y` 的 brace/点标签设 `y=0` 占位并携带 legacy `yOffset`（brace 已有；点标签改为读取而非丢弃）。
3. 新增共享 `migrateLegacyPixelOffset` util（建议 `src/components/chart/annotationMigration.ts`）+ 单测。
4. `WaterfallChart` 首渲染迁移 effect：几何就绪后遍历 brace/点标签，对 `yOffset != null` 项计算 `y`、剥离 `yOffset`、持久化。
5. `BraceOverlay` 渲染/放置/拖拽/对话框位置改双分支 + 绝对 Y（镜像点标签）。
6. `exportImage`/`exportPptx` brace 位置改 `yToPixelExport(brace.y)`，双分支兼容 legacy。
7. 回归测试：纯函数模拟 `offset.yOffset` 变化，断言绝对-Y brace 与曲线间距像点标签一样不变。
8. 回滚：迁移后 v5 文件回滚到旧代码会丢 brace 位置（见 Risks）；建议迁移后不回滚。

## Open Questions

- 是否存在 v1–v3 含点标签 `yOffset` 的真实文件？若无，D7 基线选择休眠、无影响；若有且历史语义为峰值而非 at-x，需复核（假设 at-x）。
- 全量迁移后是否在后续变更中删除 legacy `yOffset` 字段与双分支渲染（本次不做）。
