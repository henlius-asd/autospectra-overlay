## Context

`normalizeYZoomRange` 当前做三件事：min/max 顺序排列、clamp 到 `[rawDataMin, rawDataMax]`、最小段 5% dataSpan 强制。后两者在 `onDataZoom` 事件回写时修改了用户操作的原始值。

dataZoom 的操作范围由 `yAxis.min/max` 决定（`yAxisFullRange.yAxisMin/yAxisMax`），包含层间距扩展和 15% 标签预留，远大于 `rawDataMin/Max`。`normalizeYZoomRange` 的 clamp 边界比 dataZoom 的操作范围窄，产生了"断层"边界。

同时，dataZoom 已通过 `minValueSpan = 0.05 * stableDataRange.dataSpan` 在交互层阻止过窄选择，`normalizeYZoomRange` 的 minSeg 强制是冗余的。

## Goals / Non-Goals

**Goals:**
- 用户滚轮缩放 Y 轴时，`onDataZoom` 事件回写不修改用户操作值，仅做 min/max 顺序排列。
- 消除 clamp 边界导致的断层跳跃。

**Non-Goals:**
- 不改 dataZoom 的 `minValueSpan` 配置。
- 不改 `yAxis.min/max` 的计算方式。
- 不改 `visibleYRange` 的整体逻辑（仅移除多余的 clamp 参数）。

## Decisions

### D1: `normalizeYZoomRange` 精简为仅 min/max 顺序排列

移除 `bounds` 参数，移除 clamp 和 minSeg 逻辑。函数签名变为 `normalizeYZoomRange(lo: number, hi: number): [number, number]`。

**理由**：dataZoom 原生 `minValueSpan` 已阻止过窄，ECharts 内部 `yAxis.min/max` 已约束边界。clamp 和 minSeg 在事件回写时执行只会造成 store 与 ECharts 状态不一致。

**备选**：保留 clamp 但改为 clamp 到 `[yAxisMin, yAxisMax]` → 需要传递额外参数，且 minSeg 仍需处理。复杂度高，收益低——dataZoom 内部已约束。

### D2: `visibleYRange` 不再调用 `normalizeYZoomRange`

当 `yZoomRange` 非 null 时，`visibleYRange` 直接返回 `yZoomRange`（已经是 `[min, max]` 顺序）。当 `yZoomRange` 为 null 时，返回 `[stableDataRange.rawDataMin, stableDataRange.rawDataMax]`。

**理由**：`inDataZoom` 中的 `normalizeYZoomRange` 已经只做排序，`yZoomRange` 存储值已经是排序后的。直接使用即可，无需额外调用。

## Risks / Trade-offs

- [用户可缩放到数据边界外的空白区域] → D7 已明确允许（设计取舍）。若用户缩放到纯空白区，曲线被 `clip: true` 裁剪，可见范围为空。这是可恢复的（双击复位或滚轮回退）。可接受。

- [minSeg 移除后无兜底保护] → dataZoom 的 `minValueSpan` 配置在交互层阻止过窄，但 ECharts 内部可能因浮点精度产生极窄值。若出现可后续加回 minSeg 作为兜底。当前优先消除断层。

- [旧 workspace 中 yZoomRange 越界] → 不在事件回写时 clamp，旧 workspace 加载的越界值直接传给 dataZoom。ECharts 内部 clamp 到 `[yAxisMin, yAxisMax]` 显示，用户下次操作 slider 时被 `onDataZoom` 更新（仅排序）。