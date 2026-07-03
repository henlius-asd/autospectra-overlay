## Context

1. `ReactECharts` 设置 `notMerge`，每次 offset 变化时 dataZoom 状态丢失。
2. `getXAxisExtent()` 在 `onChartReady` 时返回 `null`：`getModel()` 链可能未就绪，`getOption().xAxis[0].min/max` 不包含 ECharts 动态计算值。用户缩放后 `onDataZoom` 触发时 `getModel()` 已就绪，才能正确获取。

## Goals / Non-Goals

**Goals:**
- 对齐操作后保留 dataZoom 的当前缩放/平移状态
- 初始加载时 ROI 正确同步到图表实际可视范围

**Non-Goals:**
- 不修改 ECharts 配置的其他部分

## Decisions

### Decision 1: 移除 `notMerge` 属性

`notMerge` 默认为 `false`，ECharts 将新配置合并到现有图表，保留 dataZoom 状态。

### Decision 2: `getXAxisExtent()` 增加 `convertFromPixel` fallback

当前 `getXAxisExtent()` 有两条路径：
1. `getModel().axis.scale.getExtent()` — 最准确，但 `onChartReady` 时可能未就绪
2. `getOption().xAxis[0].min/max` — 不包含动态计算值

新增第三条 fallback：
3. `convertFromPixel` — 通过 grid 边界像素坐标反算 X 值，是公开 API，始终可用

```typescript
// Fallback: convertFromPixel (public API, always available)
const grid = chartInstance.getOption().grid?.[0];
const left = grid?.left ?? 60;
const right = grid?.right ?? 30;
const width = chartInstance.getWidth();
const min = chartInstance.convertFromPixel({ xAxisIndex: 0 }, [left, 0])[0];
const max = chartInstance.convertFromPixel({ xAxisIndex: 0 }, [width - right, 0])[0];
```

## Risks / Trade-offs

- [Risk] `convertFromPixel` 依赖 grid 尺寸正确 → grid 配置在 option 中已明确设置（left: 60, right: 30），风险低
- [Risk] 移除 `notMerge` 后 series 增删残留 → ECharts merge 模式会移除不在新 option 中的 series