## 1. 从 option 中移除 startValue/endValue

- [x] 1.1 移除 option dataZoom 配置中 `if (yZoomRange)` 分支的 `startValue`/`endValue` 赋值
- [x] 1.2 移除 option dataZoom 配置中 `else` 分支（`yZoomRange === null`）的 `startValue`/`endValue` 赋值
- [x] 1.3 Y dataZoom 配置（`yInside`、`ySlider`）仅保留 `id`、`type`、`yAxisIndex`、`filterMode`、`minValueSpan`、`orient`、`left`、`width`，与 X 对齐

## 2. dispatchAction 处理外部变更

- [x] 2.1 新增 `yZoomRangeSource` ref（`useRef<'event' | 'external' | null>(null)`）
- [x] 2.2 在 `onDataZoom` 中 Y 事件处理前标记 `yZoomRangeSource.current = 'event'`
- [x] 2.3 新增 `useEffect` 监听 `yZoomRange`，当 `yZoomRangeSource.current !== 'event'` 时通过 `dispatchAction` 设置范围
- [x] 2.4 `useEffect` 中当 `yZoomRange === null` 时，dispatch 默认可见范围 `[stableDataRange.rawDataMin, stableDataRange.rawDataMax]`
- [x] 2.5 `useEffect` 末尾重置 `yZoomRangeSource.current = null`
- [x] 2.6 在 `onChartReady` 中，若 `yZoomRange` 非 null，dispatch 设置初始范围

## 3. 验证与回归

- [x] 3.1 `npx tsc --noEmit` 干净
- [x] 3.2 `npx vitest run` 全绿
- [x] 3.3 `npm run build` 成功
- [x] 3.4 人工回归：快速滚轮缩放 Y 轴平滑无断层；workspace 加载恢复 Y 范围；双击复位正常；拖拽 slider 正常