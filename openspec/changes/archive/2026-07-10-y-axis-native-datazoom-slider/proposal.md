## Why

全局 Y 轴框选目前由手写 React overlay `YRangeSlider` 实现，存在两个问题：(1) 观感与 X 轴原生 dataZoom 滑条不一致，显得粗糙；(2) 结构性 bug——滑条 track 与手柄的坐标参考系是**当前框选范围**（`resolvedFrame`）而非全量范围，而 yAxis.min/max 又等于框选范围，导致绘图区本身就是框选范围、手柄永远贴在绘图区上下边缘，拖动时"边界原点不随边界移动"，无法像 X 轴滑条那样在全量轨道里选子区间。X 轴已用 ECharts 原生 dataZoom 滑条干净地实现同等交互，Y 轴应改用同一机制。

## What Changes

- 用 ECharts 原生 `dataZoom`（`type: 'slider'` + `type: 'inside'`，`yAxisIndex: 0`，`orient: 'vertical'`）替换手写 `YRangeSlider` overlay，获得与 X 轴一致的轨道/手柄/滚轮/平移/复位交互及样式。
- `yAxis.min/max` 改回 `computeYAxisRange` 计算的**全量范围**（含 15% 标签预留区），由 dataZoom 在全量范围内选可见子区间；不再用 `resolveYAxis` 的结果作为 yAxis 边界。
- `yZoomRange`（uiStore）改为镜像 dataZoom 的 `startValue/endValue`：通过 `datazoom` 事件回写 store，初始化时由 store 值设置 dataZoom。格式不变（`[number, number] | null`），工作区 JSON 持久化不变（已存在）。
- `convertYToPixel` 与 PNG 导出改读 dataZoom 调整后的 Y 可见范围（ECharts model 的 yAxis extent），使屏幕渲染、标签/brace 跟随、导出三者一致。
- 每曲线缩放 overlay（`CurveScaleOverlay`）的像素↔数据换算改为基于 dataZoom 后的可见 Y 范围，保证缩放交互与屏幕曲线对齐。
- `resolveYAxis` 降级为对 dataZoom 范围做 clamp 的纯函数工具（锁在 `[rawDataMin, rawDataMax]`、最小段 5% dataSpan），或在 dataZoom 原生 `minValueSpan`/`maxValueSpan` 足够时移除。
- 删除 `src/components/chart/YRangeSlider.tsx`。

非破坏性：数据/持久化层 `yZoomRange` 格式不变，旧工作区存档仍可读（`null` = 全量）。交互从自定义手柄改为原生滑条。

## Capabilities

### New Capabilities

- `y-axis-zoom`: 全局 Y 轴可见范围框选——通过 ECharts 原生 dataZoom（竖向滑条 + 滚轮 inside）在全量 Y 范围内选一段可见子区间，带全量轨道上下文（手柄随边界移动）、平移、复位，范围持久化于工作区 JSON。

### Modified Capabilities

- `chart-image-export`: 导出 SHALL 在隐藏 dataZoom 滑条的同时保留 Y 轴框选范围（与现有 X 轴缩放保留行为对齐），使导出 PNG 的 Y 可见范围与屏幕一致。

## Impact

- `src/components/chart/WaterfallChart.tsx`：`dataZoom` 配置增 yAxisIndex 项；`yAxis.min/max` 改回全量范围；`convertYToPixel` 改读 model Y extent；`onDataZoom` 同步 `yZoomRange`；移除 `YRangeSlider` 挂载与相关 props。
- `src/components/chart/exportImage.ts`：导出 option 的 inside zoom 增 yAxisIndex 并保留其 `startValue/endValue`；Y 像素换算改读 dataZoom 后范围。
- `src/components/chart/YRangeSlider.tsx`：删除。
- `src/components/chart/resolveYAxis.ts`：职责缩减为 clamp 工具或移除（视 dataZoom 原生约束是否足够）。
- `src/components/chart/CurveScaleOverlay.tsx`：可见 Y 范围来源改读 dataZoom 后的 extent（经 `convertYToPixel` 或等价）。
- `src/store/uiStore.ts`：`yZoomRange` 语义不变，但写入方由 `YRangeSlider` 改为 `datazoom` 事件处理。
- 测试：`resolveYAxis`/`yPixelMath` 单测视职责调整更新；新增 dataZoom↔yZoomRange 同步的覆盖（纯函数化同步逻辑以便单测）。
