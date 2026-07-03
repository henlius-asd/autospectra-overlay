## Why

多次点击"一键对齐"按钮后，曲线偏移量会持续累积，导致曲线越来越不齐。根因有两个层面：

1. **Stale Closure**：`handleAlign` 使用闭包捕获的过期 `offsets` 快照，每次迭代展开旧快照覆盖了前一次迭代的更新结果，叠加 React 18 批处理导致仅最后一条曲线的 offset 被保留，其余丢失。

2. **算法操作原始数据**（更根本）：对齐算法接收的是原始曲线数据，返回的是从原始位置到对齐位置所需的**绝对偏移量**。但代码将其当作**增量**叠加到已有 offset 上（`current.xOffset + result.xOffset`）。即使修复了 stale closure，再次点击时算法仍返回相同的绝对偏移值，导致 offset 不断累积。

此外，ROI 范围默认值 `[0, 10]` 对于实际数据范围（如 0–30 分钟）过小，应默认为全局数据范围。

## What Changes

- 修复 `AlignmentControls.tsx` 中 `handleAlign` 的 stale closure：循环前通过 `getState()` 读取最新状态，循环内累积变更，循环结束后一次性 `setState`
- 对齐前将当前 offset 应用到数据上（`applyOffset` 辅助函数），使算法计算的是增量调整而非绝对偏移，实现对齐幂等性
- ROI 起始/结束默认值改为基线曲线的全局数据范围

## Capabilities

### New Capabilities
<!-- No new capabilities — this is a bug fix -->

### Modified Capabilities
<!-- No spec-level requirement changes — the store API and alignment algorithm interfaces remain unchanged -->

## Impact

- 受影响文件：`src/components/toolbox/AlignmentControls.tsx`
- 无 API 变更，无 breaking changes
- 不影响 store 接口、类型定义或对齐算法