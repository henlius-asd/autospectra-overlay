## Why

`AlignmentControls` 中 `handleAlign` 在对齐时先对曲线数据应用当前偏置（`applyOffset`），然后在偏置后的数据上执行 ROI 提取（`extractROI`）。但 ROI 的 `[roiStart, roiEnd]` 来自 `xRange`（原始坐标系），而 `extractROI` 作用在偏置后的数据上。当曲线已有较大偏置时，偏置后的数据可能完全移出 ROI 窗口，导致 `extractROI` 返回空数组，对齐算法静默返回 `{xOffset: 0}`，对齐无法收敛。互相关波形对齐方法对此问题尤为敏感。

## What Changes

- 在 `AlignmentControls.handleAlign` 中，调用对齐算法前将 ROI 范围减去当前偏置（`roiStart - targetOffset.xOffset`, `roiEnd - targetOffset.xOffset`），使 ROI 与偏置后的数据坐标系对齐
- 修改同时应用于 ROI 最大峰对齐和互相关波形对齐两种方法
- 基准线（baseline）的偏置也需同步调整 ROI

## Capabilities

### New Capabilities

- `alignment-roi-offset-compensation`: 对齐算法在提取 ROI 时补偿曲线的当前偏置，确保 ROI 窗口与偏置后的数据坐标系一致

### Modified Capabilities

<!-- 此项为纯实现修复，不涉及 spec 级别需求变更。alignment-behavior 的 spec 已正确定义对齐幂等性行为，本次仅修复实现使其符合现有 spec。 -->

## Impact

- 受影响文件: `src/components/toolbox/AlignmentControls.tsx`
- 不影响对齐引擎 `src/engine/alignment.ts` 和 Web Worker `src/workers/alignment.worker.ts`
- 不影响 `WaterfallChart.tsx` 的渲染逻辑
- 不影响 store 层的数据结构