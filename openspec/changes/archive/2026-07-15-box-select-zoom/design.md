## Context

当前 WaterfallChart 使用 ECharts 渲染多曲线瀑布图，已具备 X/Y 轴 dataZoom（滚轮缩放+拖拽平移+滑块）。用户需要更直观的局部放大方式：鼠标拖拽框选矩形区域直接缩放。ECharts 内置 `brush` 组件原生支持矩形框选，无需引入新依赖。

**关键发现**：ECharts brush 组件在不使用 toolbox 时，`brushModel.brushOption` 初始为空对象 `{}`，`enableBrush()` 不注册 pointer handler，导致 brush 不响应鼠标。必须通过 `takeGlobalCursor` dispatch action 激活。

## Goals / Non-Goals

**Goals:**
- 工具栏新增"框选缩放"按钮，与其他交互模式互斥
- 激活后，用户拖拽绘制矩形框，松开后 X 轴和 Y 轴同时缩放至该区域
- 框选完成后自动退出模式，恢复默认交互
- 框选缩放通过 dataZoom 更新实现，自动纳入 zundo 撤销栈

**Non-Goals:**
- 不支持框选完成后保留矩形供调整（单次即生效）
- 不提供独立的"重置缩放"按钮（依赖 Ctrl+Z）
- 不自定义框选视觉样式（使用 ECharts 默认样式）

## Decisions

### 1. 使用 ECharts brush 组件而非自定义 SVG 叠加层

**选择 ECharts brush**。理由：
- 原生输出 `coordRange`（rect 类型为 `[[xMin, xMax], [yMin, yMax]]` 二维数组），无需手动坐标系转换
- 与 dataZoom 的 `startValue`/`endValue` 直接对接

**替代方案**：自定义 SVG 叠加层——需要重新实现像素→数据坐标转换、拖拽状态机，增加维护成本。

### 2. 通过 `takeGlobalCursor` dispatch 激活 brush

**根因分析**：ECharts brush 组件在无 toolbox 时，`BrushModel.setBrushOption()` 永远不会被调用，`brushModel.brushOption` 保持空对象 `{}`。`BrushView._updateController()` 调用 `enableBrush({})` 时，`brushType` 为 `undefined`（falsy），`_doEnableBrush()` 不执行，zrender 上不注册 pointer handler。

**解决方案**：在 `useEffect` 中监听 `brushMode`，当为 `true` 时 dispatch `takeGlobalCursor` action（这是 toolbox 内部使用的同一 API）：
```js
chartInstance.dispatchAction({
  type: 'takeGlobalCursor',
  key: 'brush',
  brushOption: { brushType: 'rect', brushMode: 'single' },
});
```
停用由 `replaceMerge` 移除 brush 组件自动处理，无需额外 dispatch。

### 3. 监听 `brushEnd` 事件而非 `brushSelected`

**根因分析**：`brushSelected` 事件依赖视觉编码阶段（`inBrush`/`outOfBrush` 配置），项目未配置 `brushLink`，导致该事件不触发。`brushEnd` 由 `BrushController` 在 mouseup 时直接 dispatch，不依赖视觉编码。

### 4. `requestAnimationFrame` + `dispatchAction` 延迟应用缩放

**根因分析**：`handleBrushEnd` 中调用 `setBrushMode(false)` 触发 React 重渲染，`echarts-for-react` 用 `replaceMerge: ['dataZoom']` 调用 `setOption`，替换整个 dataZoom 数组，丢失刚设的 `startValue`/`endValue`。Y 轴有 `yZoomRange` useEffect 反向同步，X 轴没有。

**解决方案**：先更新 store（`setXRange`、`setYZoomRange`），然后 `setBrushMode(false)` 触发重渲染，最后在 `requestAnimationFrame` 回调中使用 `dispatchAction` 重新应用 dataZoom 范围。rAF 确保在 `echarts-for-react` 的 `setOption` 完成后执行。

### 5. 框选模式下禁用 dataZoom inside

**根因分析**：dataZoom `type: 'inside'` 的拖拽平移行为与 brush 的矩形框选行为冲突——两者都依赖 mousedown/mousemove/mouseup。必须禁用 inside 才能让 brush 捕获鼠标事件。

**解决方案**：将 `disableInside` 条件从 `scaleModeActive` 扩展为 `scaleModeActive || brushMode`，框选模式下将 `type: 'inside'` 替换为 `type: 'slider'` + `show: false`（隐藏 slider）。

### 6. `replaceMerge` 包含 `'brush'`

将 `replaceMerge` 从 `['series', 'dataZoom']` 扩展为 `['series', 'dataZoom', 'brush']`，确保 brushMode 切换时 brush 组件正确创建/销毁。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| `requestAnimationFrame` 回调在组件卸载后执行 | 使用 `brushRafId` ref 存储 rAF ID，unmount 时 `cancelAnimationFrame` 清理 |
| `dispatchAction` 在 HMR 时对已销毁实例调用 | 所有 `dispatchAction` 调用包裹 `try-catch` |
| `coordRange` 二维数组格式差异 | 同时支持一维 `[xMin,xMax,yMin,yMax]` 和二维 `[[xMin,xMax],[yMin,yMax]]` 格式解构 |
| 框选模式下 dataZoom inside 不可用（用户无法滚轮缩放） | 框选为临时模式，单次框选后自动退出，恢复 inside 行为 |