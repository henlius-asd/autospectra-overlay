## Context

当前瀑布图（`WaterfallChart.tsx`）和导出图片（`exportImage.ts`）的 Y 轴范围计算基于一个隐含假设：所有数据值 ≥ 0。具体表现为：

1. `yAxis.min` 硬编码为 `0`
2. 仅追踪 `rawDataMax`，无 `rawDataMin`
3. `rawDataMax <= 0` 时强制钳位为 `1`
4. 不动点公式 `yRangeForLayer = rawDataMax / (1 - spacingBudget)` 仅基于最大值

当数据包含负值（如基线校正后的光谱、差分信号），负值部分被裁剪在可视区域之外。这影响了数据的正确展示。

涉及的代码位置：
- `src/components/chart/WaterfallChart.tsx`：`option` useMemo（第 132–150 行）、`yAxis.min`（第 227 行）、`maxY` useMemo（第 283–302 行）
- `src/components/chart/exportImage.ts`：范围计算（第 97–112 行）

## Goals / Non-Goals

**Goals:**

- Y 轴范围能正确覆盖包含负值的数据集，使所有可见曲线的全部数据点都在可视区域内
- 分层偏移公式在正负混合、全正、全负三种场景下均能正确工作
- 导出图片（`exportImage.ts`）的渲染逻辑与屏幕保持一致
- 现有正数据场景不退化（向后兼容）

**Non-Goals:**

- 不改变分层滑块的用户交互方式或 UI 布局
- 不改变 X 轴范围计算逻辑
- 不改变 BraceOverlay / PointLabelOverlay 的 X 轴过滤逻辑（它们不涉及 Y 值处理）
- 不引入用户自定义 Y 轴范围的手动输入（保持自动计算）

## Decisions

### Decision 1: 引入 `rawDataMin` 并与 `rawDataMax` 并行追踪

**选择**: 在范围计算循环中同时追踪 `rawDataMin` 和 `rawDataMax`。

**理由**: 这是最直接的方案——只需在现有循环中增加一个 `if (adjusted < rawDataMin) rawDataMin = adjusted` 判断，性能开销可忽略。

**备选方案**:
- 使用 ECharts 的 `dataMin`/`dataMax` 自动计算 → 放弃了显式控制，与现有不动点公式设计哲学冲突
- 在数据预处理阶段归一化到非负 → 改变了原始数据语义，影响 tooltip 显示和导出准确性

### Decision 2: Y 轴下界取 `Math.min(0, rawDataMin)`

**选择**: `yAxis.min = Math.min(0, rawDataMin) - padding`，其中 padding 为数据跨度的小比例。

**理由**: 当所有数据为正时，行为与当前一致（下界为 0）；当存在负值时，自动扩展下界。添加少量 padding 避免最底部曲线紧贴轴底线。

### Decision 3: 不动点公式改用数据跨度 `dataSpan = rawDataMax - rawDataMin`

**选择**: 将 `yRangeForLayer` 公式中的 `rawDataMax` 替换为 `dataSpan`：

```
dataSpan = rawDataMax - rawDataMin
yRangeForLayer = dataSpan / (1 - spacingBudget)
```

然后各曲线的层偏移仍按 `layerIndex × layerSpacing × yRangeForLayer` 计算，但 Y 轴范围变为 `[rawDataMin - padding, rawDataMin + yRangeForLayer × (1 + LABEL_PADDING_RATIO)]`。

**理由**: 现有公式 `yRangeForLayer = rawDataMax / (1 - spacingBudget)` 的物理含义是"顶层曲线从 0 到 rawDataMax，下方有 (visibleCount-1) 层的间距空间"。改用 `dataSpan` 后含义变为"每层曲线占据 rawDataMin 到 rawDataMax 的范围，下方有同样的间距空间"。这在 `rawDataMin = 0` 时退化为原公式，保证向后兼容。

**备选方案**:
- 只改 `yAxis.min` 不改公式 → 层间距仍然基于 `rawDataMax` 计算，当数据全为负值时 `rawDataMax` 很小，层间距会过小
- 将曲线偏移到非负区域再渲染 → 改变了 Y 轴的物理含义，tooltip 显示的值不再是真实数据值

### Decision 4: 提取共享的范围计算函数

**选择**: 将 `rawDataMin`/`rawDataMax`/`yRangeForLayer`/`yMaxForAxis` 的计算提取为一个纯函数，供 `WaterfallChart.tsx` 的 `option` useMemo、`maxY` useMemo、`exportImage.ts` 共同调用。

**理由**: 目前三个位置有几乎相同的重复代码。提取后修复 bug 只需改一处，也减少未来不一致的风险。

**备选方案**:
- 在三处分别修复 → 容易遗漏，且 `exportImage.ts` 已经证明会出现不同步的问题

### Decision 5: 移除 `rawDataMax <= 0` 钳位

**选择**: 移除 `if (!isFinite(rawDataMax) || rawDataMax <= 0) rawDataMax = 1` 这行兜底逻辑。

**理由**: 这行代码在全负数据场景下会将范围错误地设为 `[0, 1]`。改用 `dataSpan` 后，只要 `rawDataMax !== rawDataMin`（即数据不全相同），公式就有意义。对于全相同数据（`dataSpan = 0`）的退化情况，使用一个默认跨度（如 `1`）即可。

## Risks / Trade-offs

- **[风险] 现有正数据场景的层间距视觉变化** → 缓解：当 `rawDataMin = 0` 时，新公式 `dataSpan = rawDataMax - 0 = rawDataMax`，与旧公式完全一致，不会退化。
- **[风险] 全负数据场景下 `yRangeForLayer` 的分母 `1 - spacingBudget` 仍可能 ≤ 0** → 缓解：保留 `spacingBudget >= 1` 的安全回退分支，改用 `dataSpan * 10`。
- **[风险] 提取共享函数时引入接口不兼容** → 缓解：新函数为纯计算函数，输入输出明确（visibleIds、curves、offsets、xRange、layerSpacing → 范围参数），不涉及 store 或 React 状态。
- **[权衡] 引入 `rawDataMin` 后 Y 轴范围变大** → 可接受：更大的范围意味着曲线在垂直方向更压缩，但这是正确性的必要代价。用户仍可通过 dataZoom 缩放查看细节。
