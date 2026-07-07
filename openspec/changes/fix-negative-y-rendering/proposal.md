## Why

当前 Y 轴范围计算（`WaterfallChart.tsx` 与 `exportImage.ts`）假设所有数据均为非负值：`yAxis.min` 被硬编码为 `0`，范围计算只追踪 `rawDataMax` 而完全忽略 `rawDataMin`。当曲线包含负值（如基线校正后的光谱数据、差分信号等常见场景）时，负值部分落在可视区域之外，用户看不到这些曲线段。这是一个影响数据正确性的渲染缺陷。

## What Changes

- 修改 Y 轴范围计算逻辑，同时追踪 `rawDataMin` 和 `rawDataMax`，使 Y 轴下界能延伸到负值区域。
- 移除 `yAxis.min = 0` 的硬编码，改为基于数据最小值（或 0，取更小者）动态计算。
- 调整不动点公式，使 `yRangeForLayer` 反映完整的数据跨度（`rawDataMax - rawDataMin`），而非仅最大值。
- 移除 `rawDataMax <= 0` 时强制钳位为 1 的兜底逻辑，改为在全负数据场景下也能正确计算轴范围。
- 同步修复 `WaterfallChart.tsx` 中 `maxY` useMemo（用于 brace/point-label 定位）和 `exportImage.ts` 中相同的范围计算逻辑，确保导出图片与屏幕渲染一致。

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `auto-layering`: Y 轴范围计算需要支持负值数据，使分层偏移和轴边界能正确覆盖包含负值的数据集。现有 spec 中关于 `yRangeForLayer` 不动点公式和 `yMaxForAxis` 的描述需要扩展以涵盖负值场景。

## Impact

- **受影响代码**:
  - `src/components/chart/WaterfallChart.tsx` — `option` useMemo 中的 Y 轴范围计算（第 132–150 行）、`yAxis.min` 设置（第 227 行）、`maxY` useMemo（第 283–302 行）
  - `src/components/chart/exportImage.ts` — 相同的范围计算逻辑（第 97–112 行）
- **不受影响**: `curveStore.ts`、`BraceOverlay.tsx`、`PointLabelOverlay.tsx`、`alignment.ts`、`parseFile.ts`（均不涉及 Y 值过滤）
- **依赖**: 无新增依赖
- **风险**: 修改 Y 轴范围公式会影响所有曲线的分层偏移量计算，需要验证现有正数据场景不退化
