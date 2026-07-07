## Context

上一个变更 `fix-label-position-yextent` 采用了不动点公式 `yRange = rawDataMax / (1 - (n-1) × layerSpacing)` 并设置显式 yAxis `min: 0, max: yMaxForAxis`，解决了标签位置漂移问题。但 `yMaxForAxis` 精确等于最高曲线顶点，曲线占满 y 轴全高，标签（brace 和 point label）被挤到顶部边缘甚至裁切。

**关键代码位置**:
- `WaterfallChart.tsx` option useMemo — `yMaxForAxis = yRangeForLayer`（yAxis max）
- `WaterfallChart.tsx` maxY useMemo — 返回 `yRangeForLayer`（标签定位基准）
- `exportImage.ts` — maxY 计算使用相同不动点公式

## Goals / Non-Goals

**Goals:**
- y 轴顶部预留固定比例（15%）区域作为标签专用空间
- 标签始终落在预留区域内，不被裁切
- 网站渲染和导出渲染使用相同的 buffer 系数

**Non-Goals:**
- 不改变不动点公式本身
- 不改变 `layerSpacing` 滑块语义
- 不改变标签定位公式（`convertYToPixel(maxY) - 18` 等）

## Decisions

### Decision 1: 使用比例 buffer 而非固定像素值

**选择**: `yMaxForAxis = yRangeForLayer × (1 + 0.15)`，预留 15% 比例。

**备选方案**:
- A) 固定像素 buffer（如 30px）→ 需要在数据值和像素之间转换，且依赖图表高度，resize 时会变化
- B) 固定数据值 buffer（如 rawDataMax × 0.1）→ 当 rawDataMax 很小时 buffer 过小

**理由**: 比例 buffer 与数据尺度无关，且预留区域的相对大小稳定。15% 是经验值，足以容纳 brace 标签文字（约 18px 高度 + 10px 间距）和 point label 框（约 18px 高度）。

### Decision 2: maxY 与 yMaxForAxis 使用相同 buffer

**选择**: maxY useMemo 返回值也乘 `(1 + 0.15)`。

**理由**: `maxY` 是标签定位的基准（`convertYToPixel(maxY) - 18`）。如果只给 yAxis max 加 buffer 而 maxY 不加，标签仍会定位在曲线顶点处，不会利用到预留区域。两者必须同步。

### Decision 3: 导出复用相同 buffer 系数

**选择**: `exportImage.ts` 的 maxY 计算也乘 `(1 + 0.15)`。

**理由**: 单一数据源原则。导出时 ECharts 的 yExtent 会反映显式 yAxis max（含 buffer），像素转换自动正确；maxY 也需含 buffer 才能与网站一致。

### Decision 4: buffer 系数提取为常量

**选择**: 定义 `LABEL_PADDING_RATIO = 0.15` 常量，在两处 useMemo 和导出函数中引用。

**备选方案**: 硬编码字面量 → 修改时需多处同步

**理由**: 集中管理，便于后续调整。

## Risks / Trade-offs

- **[曲线可视高度略减]** → 曲线占 y 轴约 87% 高度而非 100%，视觉上略矮，但换取了标签空间的可用性，值得
- **[layerSpacing 极大时预留区域比例变化]** → 当 spacingBudget 接近 1 时，yRangeForLayer 急剧增大，15% buffer 的绝对值也增大，预留区域仍然充足，无负面影响
- **[常量同步风险]** → 若只在 WaterfallChart 修改而忘记 exportImage → Mitigation: tasks 中明确列出两处修改，并在 design 中强调
