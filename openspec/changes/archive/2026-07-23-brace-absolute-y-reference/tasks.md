## 1. 类型与共享迁移 util

- [x] 1.1 `src/types/brace.ts`：`BraceAnnotation` 新增 `y: number`（绝对数据 Y）；`yOffset` 改为 `yOffset?: number`（legacy，注释标明过渡期携带）
- [x] 1.2 `src/types/pointLabel.ts`：`PointLabel` 新增 `yOffset?: number`（legacy，相对顶曲线的像素偏移）
- [x] 1.3 新增 `src/components/chart/annotationMigration.ts`：导出 `migrateLegacyPixelOffset(basePixel, yOffset, convertPixelToY): number`（= `convertPixelToY(basePixel + yOffset)`）
- [x] 1.4 新增 `annotationMigration` 单测：basePixel+yOffset→数据 Y、yOffset=0、负 yOffset、边界

## 2. 持久化 v4 → v5

- [x] 2.1 `src/persistence/index.ts` `buildWorkspaceSnapshot`：`version` 由 4 改为 5（braces/pointLabels 直接序列化，携带 `y` 或 legacy `yOffset`）
- [x] 2.2 `applyWorkspaceSnapshot`：对缺 `y` 的 brace 设 `y=0` 占位并保留 legacy `yOffset`；对点标签改为读取并保留 legacy `yOffset`（不再 `?? 0` 丢弃），缺 `y` 时 `y=0` 占位
- [x] 2.3 `applyWorkspaceSnapshot` 迁移分支：`version < 5` 时保留 legacy `yOffset` 供首渲染迁移；`version >= 5` 原样；缺失 `version` 视为 v2 链式（颜色→缩放→标注绝对 Y）
- [x] 2.4 `src/persistence/__tests__/index.test.ts`：新增 v4→v5 用例（brace yOffset 携带 + y 占位、点标签 legacy yOffset 携带、v5 原样、缺失 version 链式）；更新既有 brace/点标签 fixture

## 3. 运行时迁移 effect

- [x] 3.1 `src/components/chart/WaterfallChart.tsx`：新增首渲染迁移 effect——几何就绪后遍历 brace（`yOffset != null` → `y = migrateLegacyPixelOffset(braceY, brace.yOffset, convertPixelToY)`，剥离 `yOffset`）、点标签（`yOffset != null` → `y = migrateLegacyPixelOffset(getTopCurvePixelYAtX(pl.x, ctx, convertYToPixel), pl.yOffset, convertPixelToY)`，剥离 `yOffset`），写回 store 并持久化
- [x] 3.2 迁移 effect 守卫几何就绪（`chartDims` 非 0 且 `visibleYRange` 就绪），未就绪时不迁移、不写回
- [x] 3.3 保留 `braceY` 计算（`peak` + `gridTop` 下限）不删除，用于 legacy 分支与预览/对话框回退

## 4. BraceOverlay 渲染 / 放置 / 拖拽

- [x] 4.1 `BraceOverlay.tsx` 渲染（约 line 240）：brace path Y 改双分支 `brace.yOffset != null ? braceY + brace.yOffset : convertYToPixel(brace.y)`
- [x] 4.2 `BraceOverlay.tsx` 对话框位置（约 line 212）：改双分支 `editingBrace.yOffset != null ? braceY + editingBrace.yOffset - 60 : convertYToPixel(editingBrace.y) - 60`
- [x] 4.3 `BraceOverlay.tsx` 放置（约 line 141）：新 brace 改 `y: convertPixelToY(placementY)`，移除 `yOffset: placementY - braceY`
- [x] 4.4 `BraceOverlay.tsx` 拖拽（约 line 82-98）：纵向改 `y: convertPixelToY(convertYToPixel(dragging.origY) + dy)`（镜像点标签）；`dragging.origY` 改读 `brace.y`；横向 `startX/endX` 逻辑不变
- [x] 4.5 确认拖拽发生在首渲染迁移之后（legacy `yOffset` 已剥离），`origY` 必为绝对 Y

## 5. 导出路径

- [x] 5.1 `src/components/chart/exportImage.ts`（约 line 161）：brace Y 改双分支 `brace.yOffset != null ? (braceYBase + brace.yOffset) * pixelRatio : yToPixelExport(brace.y) * pixelRatio`
- [x] 5.2 `src/components/chart/exportPptx.ts`（约 line 227）：brace Y 改双分支 `brace.yOffset != null ? yToPixelExport(yMax) + 30 + brace.yOffset : yToPixelExport(brace.y)`
- [x] 5.3 验证 legacy brace 首次重开后导出位置与屏幕一致（接受 D5 决定的导出移位）

## 6. 回归测试与现有测试更新

- [x] 6.1 新增漂移回归测试（纯函数）：模拟 `offset.yOffset` 变化，断言绝对-Y brace 与曲线间距像点标签一样保持不变（钉住原 bug 契约，red-capable）
- [x] 6.2 `src/components/chart/__tests__/labelGeometry.test.ts`：补充/说明 `getTopCurvePixelYAtX` 作为点标签 legacy 迁移基线的用例
- [x] 6.3 更新 `__tests__` 中涉及 brace/点标签 fixture 与断言
- [x] 6.4 `npm test`（或项目既定命令）全量通过

## 7. 验收

- [x] 7.1 `openspec validate` 通过（delta specs 合法、scenario 4 个 `#`）
- [ ] 7.2 手动验收：放置/拖拽 brace 正常；上下平移图层时 brace 与点标签一致跟随曲线不漂移；导出 PNG/PPTX brace 位置与屏幕一致；旧工作区重开后 brace/点标签位置不变
