## 1. 精简 `normalizeYZoomRange`

- [x] 1.1 移除 `bounds` 参数（`YZoomRangeBounds` 接口），移除 `dataSpan` 参数传递
- [x] 1.2 移除 clamp 到 `[rawDataMin, rawDataMax]` 的逻辑（第 20-21 行）
- [x] 1.3 移除 minSeg 最小段强制逻辑（第 23-39 行）
- [x] 1.4 函数签名改为 `normalizeYZoomRange(lo: number, hi: number): [number, number]`，仅保留 `Math.min/Math.max` 排序

## 2. 更新 `__tests__/yZoomRange.test.ts`

- [x] 2.1 移除 clamp 相关测试用例（`clamps to [rawDataMin, rawDataMax]`、`clamps zoom ends`）
- [x] 2.2 移除 minSeg 相关测试用例（`enforces minimum segment`、`handles degenerate dataSpan`）
- [x] 2.3 保留 `normalizes inverted range` 测试，新增 `returns same values when already ordered` 测试

## 3. 更新 `WaterfallChart.tsx` 调用方

- [x] 3.1 `onDataZoom` 中 `normalizeYZoomRange` 调用移除 `{ rawDataMin, rawDataMax, dataSpan }` 参数
- [x] 3.2 `visibleYRange` 中当 `yZoomRange` 非 null 时直接返回 `yZoomRange`，不再调用 `normalizeYZoomRange`

## 4. 验证与回归

- [x] 4.1 `npx tsc --noEmit` 干净
- [x] 4.2 `npx vitest run` 全绿
- [x] 4.3 `npm run build` 成功
- [x] 4.4 人工回归：滚轮缩放 Y 轴平滑无断层（跨越 rawDataMax 边界）；拖拽 slider 正常；双击复位正常