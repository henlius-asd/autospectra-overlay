## Context

日志确认 `useEffect([baselineCurve])` 正确生效，ROI 设为 `[0.008, 45]`。但 `onChartReady` 中 `getXAxisExtent()` 被移除，导致 `xRange` 未精炼为图表实际范围。`onChartReady` 时 `getModel()` 已就绪，应恢复此调用。

## Goals / Non-Goals

**Goals:**
- ROI 初始值从 `baselineCurve` 快速设置，再由 `onChartReady` 精炼
- `onDataZoom` 时同步 zoom 范围

**Non-Goals:**
- 不修改 store 接口

## Decisions

**初始化两阶段：**

```
Phase 1: useEffect([baselineCurve]) → ROI = data[0][0] ~ data[last][0]  (快速)
Phase 2: onChartReady → getXAxisExtent() → xRange = chart actual range
         → useEffect([xRange]) → ROI = chart actual range  (精炼)
```

`onChartReady` 时图表已完全初始化，`getModel()` 可正确获取轴范围。

## Risks / Trade-offs

- [Risk] `onChartReady` 中 `getModel()` 仍可能失败 → 失败时 `xRange` 保持 Phase 1 的值，已有合理 fallback