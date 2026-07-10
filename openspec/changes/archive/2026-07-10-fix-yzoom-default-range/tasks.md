## 1. 修复 dispatchAction 默认范围

- [x] 1.1 `useEffect` 中 `yZoomRange === null` 时跳过 `dispatchAction`（不设 `[rawDataMin, rawDataMax]`），仅 `yZoomRange` 非 null 时执行
- [x] 1.2 `visibleYRange` null 分支改为返回 `[yAxisFullRange.yAxisMin, yAxisFullRange.yAxisMax]`

## 2. 验证与回归

- [x] 2.1 `npx tsc --noEmit` 干净
- [x] 2.2 `npx vitest run` 全绿
- [x] 2.3 `npm run build` 成功
- [x] 2.4 人工回归：未缩放时 Y slider 可在全轴范围内自由平移；workspace 加载恢复缩放范围；双击复位正常