## Context

`onDataZoom` 事件处理器当前流程：

```
1. getXAxisExtent() → setXRange(xExtent)     // zustand set → 同步渲染
2. 遍历 batch → setYZoomRange(normalized)    // zustand set → 同步渲染
```

zustand 的 `set` 不经过 React 批处理，每次调用立即触发订阅组件渲染。ReactECharts 在 `useEffect` 中将新 option 应用到 ECharts。两次独立 `set` → 两次 `useEffect` → 两次 `setOption`。

第一次 `setOption` 携带**旧的** `yZoomRange`（Y 事件尚未处理），ECharts 通过 `replaceMerge: ['series', 'dataZoom']` 将 Y dataZoom 的 `startValue/endValue` 回退到旧值。浏览器可能在两次 effect 之间绘制，用户看到 Y 范围短暂扩大（曲线变小）。

约束：`onDataZoom` 是 `useCallback`（空依赖），不能直接读取组件 state；`stableDataRangeRef` 已通过 ref 模式提供稳定数据边界。

## Goals / Non-Goals

**Goals:**
- 滚轮缩放 Y 轴时无闪烁、无回退。
- `onDataZoom` 在单次渲染周期内完成所有 store 更新。
- X 范围未变时不触发无意义渲染。

**Non-Goals:**
- 不改 `replaceMerge` 策略（已在 `stabilize-y-axis-zoom-range` 变更中改为 `['series', 'dataZoom']`）。
- 不改 `normalizeYZoomRange` 规整逻辑。
- 不改 dataZoom 配置结构。

## Decisions

### D1: `setXRange` 添加值相等检查

`onDataZoom` 中，`getXAxisExtent()` 返回的 X 范围可能未变（用户只滚 Y 轴时）。当前无条件写入 `setXRange`，即使值相同也会创建新数组引用 → zustand 触发渲染。

改为：读取 `useUiStore.getState().xRange`，比较值相等后跳过写入。

**理由**：消除 Y-only 缩放时由 `setXRange` 触发的无意义渲染，从源头减少滞后值覆盖的机会。

### D2: 合并 `setXRange` 与 `setYZoomRange` 为单次 `setState`

当 X 与 Y 均需更新时，用 `useUiStore.setState({ xRange, yZoomRange })` 一次性写入两个字段，zustand 只触发一次渲染，ReactECharts 只执行一次 `useEffect` → 一次 `setOption`，ECharts 接收的是**最新的**两个值。

```ts
const updates: Partial<UiState> = {};
if (xChanged) updates.xRange = xExtent;
if (yChanged) updates.yZoomRange = normalized;
if (Object.keys(updates).length > 0) useUiStore.setState(updates);
```

**理由**：根本消除"第一次渲染发旧 Y 值"的窗口。zustand 原生支持 `setState(partial)` 合并写入。

**备选**：用 `useTransition` / `flushSync` 包裹 → 过度复杂，zustand `setState` 足够。

## Risks / Trade-offs

- [`getState().xRange` 值比较的浮点精度] → X 范围来自 ECharts model extent，可能含浮点误差。用严格 `===` 比较可能误判"已变"。缓解：ECharts extent 在无交互时返回相同引用值，`===` 足够；若出现精度问题可加 epsilon 容差。

- [合并 setState 后 `rangeResult` 依赖 `xRange` 的 recompute 时机] → `xRange` 更新后 `rangeResult` 在同一渲染周期内 recompute，option useMemo 拿到的是新 `xRange` + 新 `yZoomRange`，无滞后。正确。

- [Y-only 事件时 `updates` 仅含 `yZoomRange`] → D1 跳过 X 写入，D2 只写 Y，单次渲染。正确。