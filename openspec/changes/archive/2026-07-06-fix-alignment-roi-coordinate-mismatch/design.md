## Context

当前 `AlignmentControls.handleAlign` 的数据流：

```
rawData + currentOffset → applyOffset → adjData
                                            ↓
adjData + [roiStart, roiEnd] → extractROI → roiData
```

`roiStart`/`roiEnd` 来自 `xRange`（原始坐标系），但 `extractROI` 的输入 `adjData` 的 X 坐标是 `rawX + offset.xOffset`。当 `offset.xOffset` 较大时，`adjData` 的 X 范围可能完全在 `[roiStart, roiEnd]` 之外，导致 `extractROI` 返回空数组。

已有 `replaceMerge={['series']}` 修复了 dataZoom 重置问题，但 ROI 坐标系不匹配这个问题是独立的。

## Goals / Non-Goals

**Goals:**
- 对齐算法在提取 ROI 时补偿曲线的当前偏置，使 ROI 与偏置后的数据坐标系一致
- 修复互相关波形对齐在大偏置下无法收敛的问题
- 修复 ROI 最大峰对齐在相同场景下的潜在问题
- 保持对齐算法的增量累加语义不变

**Non-Goals:**
- 不改变对齐算法的核心计算逻辑
- 不改变 `applyOffset` 或 `extractROI` 的函数签名
- 不改变 ROI 的 UI 显示（用户仍看到原始坐标系的 ROI 值）

## Decisions

### Decision 1: 将目标数据偏置到基准线坐标系

**选择**: 在 `handleAlign` 中，对目标曲线数据应用 `baselineOffset.xOffset`（而非 `targetOffset.xOffset`），使两组数据处于同一坐标系，ROI 提取自然正确

**代码位置**: [AlignmentControls.tsx:48-84](src/components/toolbox/AlignmentControls.tsx#L48-L84)

**修改前**:
```typescript
const adjTarget = applyOffset(targetCurve.data, targetOffset);
const result = roiMaxPeakAlignment.align(adjBaseline, adjTarget, roiStart, roiEnd);
newOffsets[id] = { ...targetOffset, xOffset: targetOffset.xOffset + result.xOffset };
```

**修改后**:
```typescript
// Shift target to baseline's coordinate system
const adjTarget = applyOffset(targetCurve.data, {
  xOffset: baselineOffset.xOffset,  // ← baseline's offset, not target's!
  yOffset: targetOffset.yOffset,
});
const result = roiMaxPeakAlignment.align(adjBaseline, adjTarget, roiStart, roiEnd);
// result is in baseline's CS; convert to absolute offset
newOffsets[id] = { ...targetOffset, xOffset: result.xOffset + baselineOffset.xOffset };
```

**理由**:
- 对齐算法（`roiMaxPeakAlignment` 和 `crossCorrelate`）对两组数据使用相同的 `roiStart`/`roiEnd`，无法分别调整
- 将两组数据偏置到同一坐标系（基准线坐标系）后，原始 ROI 自然正确
- 数学等价性验证：
  - 修改前：`newXOffset = targetOffset + (baselineRaw[peak] + baselineOffset - targetRaw[peak] - targetOffset) = baselineRaw[peak] + baselineOffset - targetRaw[peak]`
  - 修改后：`newXOffset = (baselineRaw[peak] - targetRaw[peak]) + baselineOffset = baselineRaw[peak] + baselineOffset - targetRaw[peak]`
  - 结果一致 ✓

**替代方案考虑**:
- 调整 ROI（`roiStart - targetOffset.xOffset`）：对齐算法对两组数据使用同一 ROI，无法分别调整 → 不可行
- 在 `extractROI` 内部补偿：需要修改引擎函数签名，影响范围更大
- 在原始数据上执行对齐（不应用偏置）：会丢失增量对齐的收敛性

## Risks / Trade-offs

- **Risk**: 基准线偏置坐标系转换后，对齐结果可能受到基准线偏置精度影响
  - **Mitigation**: 数学上等价于原始方法，无精度损失。TypeScript 编译验证通过

- **Risk**: 如果基准线偏置非常大，偏置后的目标数据可能超出原始数据范围
  - **Mitigation**: `extractROI` 已有边界检查，不会崩溃

- **Trade-off**: 修改了偏置计算方式（从 `targetOffset + result` 改为 `result + baselineOffset`）
  - 数学等价，但代码语义不同。已通过数学推导验证一致性