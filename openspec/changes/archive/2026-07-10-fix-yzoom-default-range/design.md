## Context

`decouple-yzoom-from-option` 变更中为处理外部变更（workspace 加载、reset）新增了 `useEffect` + `dispatchAction`。当前实现中 `yZoomRange === null` 时也执行 dispatch，将范围设为 `[rawDataMin, rawDataMax]`。

ECharts 的 dataZoom 默认操作范围是 `[yAxis.min, yAxis.max]`，即 `[yAxisFullRange.yAxisMin, yAxisFullRange.yAxisMax]`——包含 2% padding、层间距扩展和 15% 标签预留区。当 `yZoomRange === null` 时，用户期望 ECharts 使用此默认范围，而非被 dispatch 限制到更窄的 `[rawDataMin, rawDataMax]`。

## Goals / Non-Goals

**Goals:**
- 未缩放状态下用户可自由平移 Y 轴，范围不受 `[rawDataMin, rawDataMax]` 限制。
- `visibleYRange` 与 ECharts 实际显示范围一致。

**Non-Goals:**
- 不改 `dispatchAction` 在 `yZoomRange` 非 null 时的行为。
- 不改 `yAxisFullRange` 的计算方式。

## Decisions

### D1: `yZoomRange === null` 时跳过 dispatch

```ts
if (yZoomRange && chartInstance) {
  chartInstance.dispatchAction({ ... });
}
```

ECharts 在 dataZoom 未设 `startValue`/`endValue` 时默认显示完整轴范围 `[yAxisMin, yAxisMax]`。不 dispatch 即表示"使用默认"。

**理由**：ECharts 原生行为即为用户期望——全轴范围自由平移。额外 dispatch 反而施加了不必要的限制。

### D2: `visibleYRange` null 分支改用 `yAxisFullRange`

```ts
if (!yZoomRange) return [yAxisFullRange.yAxisMin, yAxisFullRange.yAxisMax];
```

**理由**：`visibleYRange` 用于 `convertYToPixel` 换算像素位置，应与 ECharts 实际显示的可见范围一致。未缩放时 ECharts 显示 `[yAxisMin, yAxisMax]`，故 `visibleYRange` 应返回相同值。

## Risks / Trade-offs

- [初始加载时曲线可能显示在轴范围内较窄的区域] → 未缩放时 `yAxisFullRange` 包含层间距扩展，曲线可能集中在轴的下半部分。用户可通过平移调整。可接受。