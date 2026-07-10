## Context

X dataZoom 的 option 配置不含 `start`/`end`（仅 `{ id: 'xZoom', type: 'inside', xAxisIndex: 0 }`），`replaceMerge` 合并时 ECharts 保留内部状态。Y dataZoom 当前在 option 中设置 `startValue`/`endValue`（从 store `yZoomRange` 取值），每次 React 渲染都发回 ECharts。

用户快速滚动时，`onDataZoom` 事件 → store 写入 → React 渲染 → ReactECharts `useEffect` → `setOption` 的链路存在延迟，option 携带的是上一次事件的 store 值（滞后于 ECharts 内部已更新的状态），导致 ECharts 被迫回退。

`replaceMerge: ['dataZoom']` 按 `id` 合并：若新配置含 `startValue`/`endValue` 则覆盖旧值；若不含则保留旧值。

## Goals / Non-Goals

**Goals:**
- 用户交互期间 Y dataZoom 范围由 ECharts 内部管理，option 不覆盖，避免回退断层。
- 外部变更（workspace 加载、reset）时通过 `dispatchAction` 设置范围。

**Non-Goals:**
- 不改 `onDataZoom` 事件回写 store 的逻辑。
- 不改 `replaceMerge` 配置。
- 不改 X dataZoom 行为。

## Decisions

### D1: 从 option 中移除 `startValue`/`endValue`

Y dataZoom 配置不再包含 `startValue`/`endValue`，与 X 对齐：

```ts
const ySlider: Record<string, unknown> = {
  id: 'yZoomSlider', type: 'slider', yAxisIndex: 0, orient: 'vertical',
  left: 60 - 14 - 4, width: 14, filterMode: 'none', minValueSpan: yMinSpan,
};
```

`replaceMerge` 合并时 ECharts 保留内部状态，不产生回退。

**理由**：X 轴已验证此模式可行且平滑。`startValue`/`endValue` 仅在初始化时需要设置（chart ready 或 workspace 加载），交互期间不应由 option 控制。

**备选**：保留 `startValue`/`endValue` 但用 `useRef` 防止重复设置 → 仍有时序问题，不如直接移除。

### D2: 用 `dispatchAction` 处理外部变更

新增 `yZoomRangeSource` ref 标记变更来源：

```ts
const yZoomRangeSource = useRef<'event' | 'external' | null>(null);
```

在 `onDataZoom` 中标记 `'event'`；在 `useEffect` 中检查：

```ts
useEffect(() => {
  if (yZoomRangeSource.current === 'event') {
    yZoomRangeSource.current = null;
    return;
  }
  yZoomRangeSource.current = null;
  if (chartInstance && yZoomRange) {
    chartInstance.dispatchAction({
      type: 'dataZoom',
      dataZoomId: 'yZoom',
      startValue: yZoomRange[0],
      endValue: yZoomRange[1],
    });
  }
}, [yZoomRange]);
```

**理由**：区分事件回写（ECharts 已更新，不需要 dispatch）和外部变更（workspace 加载 / reset，需要 dispatch）。`dispatchAction` 是 ECharts 命令式 API，不触发 `datazoom` 事件，无反馈循环。

**备选**：在 `onChartReady` 中一次性设置 → 仅覆盖初始渲染，不覆盖 workspace 加载后的变更。

## Risks / Trade-offs

- [初次渲染时 dataZoom 可能从全量开始] → `onChartReady` 中 `dispatchAction` 设置初始范围。若 `yZoomRange` 为 null，全量即为默认（正确）。

- [reset 时 `yZoomRange` 变为 null → dataZoom 需要复位] → 在 `useEffect` 中，当 `yZoomRange` 变为 null 时，调用 `dispatchAction` 设置 `startValue`/`endValue` 为 `[stableDataRange.rawDataMin, stableDataRange.rawDataMax]`（默认可见范围）。

- [ref 模式在 StrictMode 下可能重复触发] → `useEffect` 在 mount 时执行一次，`yZoomRangeSource` ref 在 `onDataZoom` 中设置，StrictMode double-invoke 时 ref 已被重置为 null，第二次 `useEffect` 会正常 dispatch。可接受。