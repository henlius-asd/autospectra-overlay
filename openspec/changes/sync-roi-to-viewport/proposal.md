## Why

当前 ROI 对齐范围在加载曲线时默认设为全量数据范围，之后不再更新。用户缩放/平移图表后，ROI 范围仍保持旧值，需要手动输入数值才能对齐到当前可视区域。这不符合直觉——用户看到什么范围，就应能直接对那个范围执行对齐。

ROI 范围应当自动同步到当前 X 轴可视范围，每次 zoom/pan 操作后自动更新。

## What Changes

- `uiStore` 新增 `xRange` 字段和 `setXRange` action，存储当前图表 X 轴可视范围
- `WaterfallChart` 将本地 `xRange` state 替换为 `uiStore.xRange`，在 `onDataZoom` 和 `onChartReady` 时写入 store
- `AlignmentControls` 订阅 `uiStore.xRange`，`useEffect` 同步 `roiStart`/`roiEnd`

## Capabilities

### New Capabilities
<!-- No new capabilities -->

### Modified Capabilities
- `state-management`: uiStore 新增 `xRange` 字段和 `setXRange` action
- `alignment-behavior`: ROI 默认范围由"全量数据范围"改为"当前 X 轴可视范围"，并随 zoom 动态更新

## Impact

- 受影响文件：`src/store/uiStore.ts`、`src/components/chart/WaterfallChart.tsx`、`src/components/toolbox/AlignmentControls.tsx`
- 无 API 变更，无 breaking changes
- 不影响对齐算法或 store 其他接口