## Why

用户需要在图表上通过鼠标拖拽框选矩形区域，自动缩放到该区域以查看局部细节。当前缺少便捷的局部区域放大功能，用户难以快速聚焦到感兴趣的数据区间。

## What Changes

- 新增工具栏"框选缩放"按钮，与其他交互模式（支架、点标签、手动移动、全局缩放、单曲线缩放）互斥
- 激活后，框选模式下禁用 `dataZoom inside`（替换为隐藏 slider），释放鼠标事件给 brush 组件
- 使用 ECharts `takeGlobalCursor` dispatch action 激活 brush 交互（无 toolbox 时 brush 默认不激活）
- 监听 `brushEnd` 事件（而非 `brushSelected`，后者依赖视觉编码且不触发）
- 框选后通过 `requestAnimationFrame` + `dispatchAction` 延迟应用 dataZoom 缩放，避免被 `replaceMerge` 重渲染覆盖
- 框选完成后自动退出框选模式，恢复默认交互
- 所有 `dispatchAction` 调用包裹 `try-catch` 处理 HMR 时实例销毁警告

## Capabilities

### New Capabilities
- `box-select-zoom`: 通过鼠标拖拽框选矩形区域，自动缩放图表至该区域的数据范围

### Modified Capabilities
<!-- No existing spec requirements are changing -->

## Impact

- `src/components/chart/WaterfallChart.tsx` — brush 组件配置、`takeGlobalCursor` 激活、`brushEnd` 事件处理、`requestAnimationFrame` + `dispatchAction` 缩放、`replaceMerge` 含 `'brush'`
- `src/components/toolbar/Toolbar.tsx` — 新增"框选缩放"按钮，所有模式互斥 handler 更新
- `src/store/uiStore.ts` — 新增 `brushMode` 状态、`setBrushMode` action
- `src/types/curve.ts` — `DEFAULT_LABEL_STYLE.backgroundColor` 从 rgba 改为 hex（修复 `<input type="color">` 警告）