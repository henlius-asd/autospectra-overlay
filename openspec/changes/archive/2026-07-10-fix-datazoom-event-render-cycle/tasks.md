## 1. onDataZoom 重构

- [x] 1.1 在 `onDataZoom` 中，读取 `useUiStore.getState().xRange`，与 `getXAxisExtent()` 返回值做值相等比较（`===` 逐元素），仅在变化时标记 `xChanged`
- [x] 1.2 在 `onDataZoom` 中，遍历 `event.batch` 提取 Y dataZoom 的 `startValue/endValue`，经 `normalizeYZoomRange` 规整后标记 `yChanged` 与 `normalizedYRange`
- [x] 1.3 将 `setXRange` 与 `setYZoomRange` 合并为单次 `useUiStore.setState({ xRange, yZoomRange })` 调用，仅写入标记为 changed 的字段；无变化时不写入
- [x] 1.4 移除 `onDataZoom` 中无条件 `setXRange(xExtent)` 的写法

## 2. 验证与回归

- [x] 2.1 `npx tsc --noEmit` 干净
- [x] 2.2 `npx vitest run` 全绿
- [x] 2.3 `npm run build` 成功
- [x] 2.4 人工回归：滚轮缩放 Y 轴无闪烁无回退；Y-only 缩放不触发 X 写入；X+Y 同时缩放单次渲染；拖拽 slider 正常；双击复位正常