## 1. 命中区域扩大

- [x] 1.1 BraceOverlay：括号路径下方叠加 16px 宽透明描边命中路径（`src/components/chart/BraceOverlay.tsx`）
- [x] 1.2 BraceOverlay：标签文字下方叠加透明矩形命中区域
- [x] 1.3 PointLabelOverlay：标签文字下方叠加透明矩形命中区域（`textW + 8px` × `fontSize * 1.4`）（`src/components/chart/PointLabelOverlay.tsx`）

## 2. 双击编辑

- [x] 2.1 BraceOverlay：所有标签/括号 `onClick` → `onDoubleClick`（4 处），编辑浮层按钮保留 `onClick`
- [x] 2.2 PointLabelOverlay：所有标签/命中区域 `onClick` → `onDoubleClick`（2 处），编辑浮层按钮保留 `onClick`

## 3. 区间标签放置定位

- [x] 3.1 BraceOverlay `handlePointerDown`：记录 `placementY = e.clientY - rect.top`（`src/components/chart/BraceOverlay.tsx`）
- [x] 3.2 BraceOverlay `handlePointerUp`：创建 brace 时 `yOffset = placementY - braceY`
- [x] 3.3 预览虚影 `bracePath(previewLeft, previewRight, placementY ?? braceY)`
- [x] 3.4 所有取消路径（区间过小、Escape、条件不满足）清除 `placementY`

## 4. dataZoom 修复

- [x] 4.1 xZoom 和 yZoom 非 select 模式：`{ type: 'inside', disabled: true }` 替代 `{ type: 'slider', show: false }`（`src/components/chart/WaterfallChart.tsx`）

## 5. 点标签 Y 解耦

- [x] 5.1 `PointLabel.yOffset` → `PointLabel.y`（`src/types/pointLabel.ts`）
- [x] 5.2 PointLabelOverlay 接口：新增 `convertYToPixel` 和 `convertPixelToY` props，移除 `getLabelBaseYAtX`（`src/components/chart/PointLabelOverlay.tsx`）
- [x] 5.3 放置逻辑：`y = convertPixelToY(py)`（替代 `yOffset = py - baseY`）
- [x] 5.4 渲染逻辑：`py = convertYToPixel(pl.y)`（替代 `getLabelBaseYAtX(pl.x) + pl.yOffset`）
- [x] 5.5 拖动逻辑：`y = convertPixelToY(origPixelY + dy)`（替代 baseY 补偿）
- [x] 5.6 拖动状态：`origYOffset` → `origY`（`useState` 类型更新）
- [x] 5.7 WaterfallChart：新增 `convertPixelToY`；传 `convertYToPixel`/`convertPixelToY` 给 PointLabelOverlay；移除 `getLabelBaseYAtX`（`src/components/chart/WaterfallChart.tsx`）
- [x] 5.8 导入 `pixelToY` from `yPixelMath`；移除未使用的 `getTopCurvePixelYAtX` 导入

## 6. 导出同步

- [x] 6.1 exportImage：`yToPixelExport(pl.y)` 替代 `getTopCurvePixelYAtX(pl.x, ...) + pl.yOffset`；移除 `geometryCtx`；移除未使用导入（`src/components/chart/exportImage.ts`）
- [x] 6.2 exportPptx：同上；移除未使用导入（`src/components/chart/exportPptx.ts`）

## 7. 持久化迁移

- [x] 7.1 `applyWorkspaceSnapshot`：旧标签 `yOffset` → `y: 0`（`src/persistence/index.ts`）
- [x] 7.2 测试数据更新：`yOffset` → `y`（`src/store/__tests__/curveStore.test.ts`）

## 8. 验证

- [x] 8.1 TypeScript 编译通过（`npx tsc --noEmit`）
- [x] 8.2 单元测试全部通过（13 文件 / 103 测试）
- [x] 8.3 e2e 测试确认不受影响