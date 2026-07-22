## 1. 数据层

- [x] 1.1 `BraceAnnotation` 新增 `yOffset?: number` 字段（`src/types/brace.ts`）

## 2. 括号形状

- [x] 2.1 重写 `bracePath()`：水平主线 + 中央锐角三角尖刺（`L` 直线，底宽 2px）+ 两端圆角钩（`Q` 二次贝塞尔，半径 3px），整体高度 14px（`src/components/chart/bracePath.ts`）
- [x] 2.2 新增 `bracePathPoints()`：采样括号形状为折线点，供 PPTX `custGeom` 使用
- [x] 2.3 更新 `BRACE_HEIGHT` = 14、`BRACE_LABEL_GAP` = 6 常量

## 3. 工具栏图标

- [x] 3.1 重写 `BraceIcon`：从两个并排竖花括号改为单个水平 overbrace ⏜（`src/components/ui/icons.tsx`）

## 4. 区间标签自由定位

- [x] 4.1 BraceOverlay 支持 2D 拖拽（dx+dy）：拖拽状态扩展 `startClientY` 和 `origYOffset`，横向更新 startX/endX，纵向更新 yOffset（`src/components/chart/BraceOverlay.tsx`）
- [x] 4.2 每 brace 独立 `y = braceY + (brace.yOffset ?? 0)`（替代全局 `y`）
- [x] 4.3 移除 `clampLabelX` 调用，标签 X 直接使用 `(px1+px2)/2`
- [x] 4.4 标签 Y 更新为 `y - BRACE_HEIGHT/2 - BRACE_LABEL_GAP`（尖刺上方）
- [x] 4.5 编辑浮层 `dialogTop` 跟随编辑 brace 的实时 y（含 yOffset）
- [x] 4.6 拖拽预览使用默认 `braceY`（`bracePath(previewLeft, previewRight, braceY)`）

## 5. 点标签自由放置

- [x] 5.1 放置时落在点击像素 Y：`yOffset = py - getLabelBaseYAtX(dataX)`（`src/components/chart/PointLabelOverlay.tsx`）
- [x] 5.2 移除 `clampLabelX` 和 `clampLabelY` 调用
- [x] 5.3 移除不再需要的 props（`gridBottom`、`chartWidth`、`gridLeft`、`gridRight`）

## 6. 默认 braceY 调整

- [x] 6.1 WaterfallChart `braceY` = `Math.max(gridTop + BRACE_HEIGHT/2 + BRACE_LABEL_GAP + 2, convertYToPixel(peak) - BRACE_HEIGHT/2)`（水平主线贴近峰值约 7px）（`src/components/chart/WaterfallChart.tsx`）
- [x] 6.2 精简 PointLabelOverlay 传入的 props

## 7. 导出同步

- [x] 7.1 exportImage：应用 `brace.yOffset`、移除 clamp、更新标签 Y、braceY 基线调整（`src/components/chart/exportImage.ts`）
- [x] 7.2 exportPptx：应用 `brace.yOffset`、移除 clamp、用 `bracePathPoints()` + `addCustGeom` 绘制新形状、更新标签 Y（`src/components/chart/exportPptx.ts`）

## 8. 验证

- [x] 8.1 TypeScript 编译通过（`npx tsc --noEmit`）
- [x] 8.2 单元测试全部通过（13 文件 / 103 测试）
- [x] 8.3 e2e 测试确认不受影响（`viewport-preserve.spec.ts` 通过 store API 切模式，不依赖图标 DOM）