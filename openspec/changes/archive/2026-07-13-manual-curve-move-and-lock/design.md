## Context

`curveStore.offsets{id:{xOffset,yOffset}}` 当前仅由"一键对齐"写入，对齐基于当前已偏移数据计算增量（幂等）。`CurveScaleOverlay` 的 shift+drag 写 `curveScaleOffset`（缩放纵向偏移），与 `xOffset`/`yOffset` 是不同字段。无锁定字段。曲线数据已持久化、参与 zundo。

## Goals / Non-Goals

**Goals:**
- 单曲线手动横向/纵向移动，写 `xOffset`/`yOffset`，纳入 undo 与持久化。
- 横向锁定，锁定后横向拖拽禁用；纵向可调。
- 与自动对齐协同：对齐尊重锁定、不累积偏移。

**Non-Goals:**
- 不改对齐算法主体（仅加锁定跳过）。
- 不做批量框选多曲线同时移动（后续可扩展）。
- 不与缩放模式（CurveScaleOverlay）合并——手动移动是独立模式。

## Decisions

### D1: 独立"手动移动"模式 + ManualMoveOverlay

新增模式枚举值，与 brace/point-label/scale 模式互斥。`ManualMoveOverlay`（SVG，pointerEvents 接管）捕获拖拽：水平→`xOffset`（像素→数据坐标换算复用 `convertPixelToX`），垂直→`yOffset`（像素→y 数据换算复用 `yPixelMath`）。选中曲线通过点击拾取（复用 seriesIndex→visibleIds 映射）。

**理由**：独立模式避免与缩放/标注模式冲突；overlay 方式与 BraceOverlay/PointLabelOverlay 一致。

### D2: `locked` per-curve，作用于横向

curve 数据新增 `locked?: boolean`。锁定仅禁横向拖拽（满足"锁定后无法横向移动"）；纵向调间距不受限。工具栏"锁定横向"toggle 作用于当前选中曲线，右键菜单亦提供。

### D3: 对齐算法跳过锁定曲线

对齐 action 遍历曲线时，`locked` 为 true 的曲线跳过 xOffset 写入（保留原值），其余照常。手动写入的 xOffset/yOffset 作为"当前已偏移数据"基线，沿用现有幂等算法，无需改算法主体。

## Risks / Trade-offs

- [手动移动与自动对齐的交互预期] → 文档化：锁定=固定横向；未锁定+手动移动后可再次对齐（手动位移作为新基线）。
- [模式切换成本] → 新增模式按钮，工具栏略增；与既有模式互斥逻辑统一处理。
- [纵向 yOffset 与 layerSpacing 关系] → 纵向手动调间距直接改 yOffset，不改 layerSpacing（全局）；单曲线纵向微调需求满足。
