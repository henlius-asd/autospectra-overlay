## Why

ECharts 的 `setOption` 默认 merge 行为导致空状态标题在数据加载后无法自动清除，用户看到曲线已渲染但"尚未加载曲线数据"文字仍覆盖在图表上方。这是一个视觉 bug，影响用户体验。

## What Changes

- 在 `WaterfallChart` 组件的非空 option 中显式设置 `title: { show: false }`，让 ECharts merge 时清除空状态标题

## Capabilities

### New Capabilities
<!-- No new capabilities — this is a bug fix, not a new feature -->

### Modified Capabilities
<!-- No requirement-level changes — the behavior spec (chart displays empty state when no data, curves when data loaded) remains the same. This is a rendering-level fix. -->

## Impact

- **Affected code**: `src/components/chart/WaterfallChart.tsx` — 在 `useMemo` 返回的 option 中添加一行 `title: { show: false }`
- **No API changes**, **no dependency changes**, **no breaking changes**