## Context

当前图表标注与导出分散在 `WaterfallChart.tsx`、`PointLabelOverlay.tsx`、`BraceOverlay.tsx`、`exportImage.ts` 与 `computeYAxisRange.ts`。点标签与区域标签的纵向基线统一来自 `computeYAxisRange` 返回的 `maxY`（= `yAxisMax` = 预留区顶部，含 `LABEL_PADDING_RATIO=0.15` 的上方留白），因此标签悬在最高曲线之上较远处。导出走 `instance.getDataURL()`，整张画布原样导出，包含 `legend` 与底部 `dataZoom slider`。区域标签创建后仅支持点击编辑/删除，不可整体平移。

约束：屏幕端与导出端必须使用同一套基线与夹取逻辑，否则两处不一致；导出过程不得改变 `useUiStore.xRange` 或留下可见的图表闪烁；导出需保留用户当前的 dataZoom 缩放视图。

## Goals / Non-Goals

**Goals:**
- 导出画面跟随 `showAxes`：开则保留坐标轴、去图例与预览条；关则导出净图（透明背景）。
- 点标签默认贴近最高曲线上方约 10px，无外框/原点/虚线，仅文字。
- 区域标签默认贴近最高曲线峰值上方约 14px，且支持整段横向拖拽平移。
- 点标签与区域标签文字在 grid 内完整显示（竖直/水平夹取）。
- 屏幕端与导出端标注位置、样式完全一致。

**Non-Goals:**
- 不改 Y 轴预留区比例（`LABEL_PADDING_RATIO` 保持 0.15）。
- 不为 brace 增加纵向拖拽或 Y 方向 offset 字段（仅横向平移）。
- 不改数据解析、持久化格式、store 之外的状态结构。
- 不引入白色文字光晕（标签应在曲线上方而非压在曲线上）。

## Decisions

### D1：导出用 option 临时切换 + 同步截图 + 还原（而非裁剪画布）

`getDataURL` 无法按组件过滤。裁剪画布需精确知道 legend/slider 的像素带，且 slider 与 x 轴名称在底部边距内的纵向布局不稳定，边界易误伤坐标轴。因此选择：`structuredClone(instance.getOption())` 得到快照 → 在克隆上设 `legend.show=false`、`dataZoom=[{type:'inside', xAxisIndex:0, start, end}]`（`start/end` 从原 slider 拷贝以保留缩放视图）、`grid.top/bottom` 按 `showAxes` 收紧 → `setOption(exportOpt, { replaceMerge:['legend','dataZoom','grid','xAxis','yAxis','series'], lazyUpdate:false })` → 立即 `getDataURL` → 合成 SVG → `setOption(snapshot, { replaceMerge:[...] })` 还原。

**为何同步可行**：`animation:false` + canvas 渲染器，`setOption` 在 `lazyUpdate:false` 下同步重绘画布，紧接的 `getDataURL` 拿到新画面；整个过程在同一同步执行栈，浏览器无可见重绘闪烁。若实测发现 zrender 将刷新推迟到 rAF，降级为监听 `'finished'` 事件再截图（代价是一次极短闪烁）——作为兜底，不作为首选。

**替代方案（已否决）**：按 grid 矩形裁剪合成 canvas——会连坐标轴标签一起裁掉，与"跟随 showAxes 保留轴"冲突，且 slider/轴名称边界难精确测算。

### D2：点标签基线改为"最高曲线在 pl.x 处的像素 y"

`WaterfallChart` 新增 `getTopCurvePixelYAtX(xVal)`：取 `visibleIds[0]`（staging 顺序最顶曲线），在其 `data` 中按 `x+offset.xOffset` 找最接近 `pl.x` 的样本（线性插值），叠加该层 `layerYOffset = (visibleCount-1)*layerSpacing*yRangeForLayer` 与 `offset.yOffset`，经 `convertYToPixel` 转像素。作为 prop 传入 `PointLabelOverlay`，`py = baseYAtX(pl.x) + pl.yOffset`，默认 `yOffset = -10`。`exportImage.ts` 用同一公式（复用同一 helper，避免两处实现漂移）。

**语义变更**：`PointLabel.yOffset` 由"相对 maxY 线"变为"相对最高曲线在 x 处的像素 y"。已存标签会一次性下移贴近曲线——这是期望效果，无需迁移数据。

### D3：brace Y 基线改为最高曲线峰值

`braceY = max(gridTop+8, convertYToPixel(topCurvePeak) - 14)`，其中 `topCurvePeak = rawDataMin + yRangeForLayer`（`computeYAxisRange` 已返回这两项）。屏幕端 `WaterfallChart` 与导出端 `exportImage.ts` 同一公式。仍为单一 `braceY`（不按每段局部峰值计算），保持改动可控；贴合度已显著优于基于 maxY 的旧方案。

### D4：brace 整段横向拖拽，点击与拖拽用位移阈值区分

`curveStore` 新增 `updateBrace(id, updates)` action（与 `updatePointLabel` 对称）。`BraceOverlay` 增加拖拽状态 `{ id, startClientX, origStartX, origEndX }`，svg 上合并 placement 与 drag 的 move/up 处理。brace `<g>` 的 `onPointerDown` 启动拖拽并 `setPointerCapture`；move 时 `Δx` 经 `convertPixelToX` 换算后平移 `startX/endX`（宽度不变）。pointerup 时若累计位移 < 5px 视为点击 → 打开编辑弹窗（保留现 `handleBraceClick`），否则视为拖拽不弹窗。阈值判定参照现有 placement 逻辑（`BraceOverlay.tsx:71`）。

### D5：标签完整显示的夹取规则

- 竖直：`py = clamp(py, gridTop + labelHalfH, plotBottom - labelHalfH)`，`plotBottom = chartHeight - gridBottom`。预留区 15% 绘图高度足以容纳默认 -10 偏移；夹取兜底防止用户拖到极端。
- 水平：`textW = label.length * fontSize * 0.55`（估算），`px = clamp(px, gridLeft + textW/2, chartWidth - gridRight - textW/2)`。屏幕端可用 SVG `getBBox()` 精测后修正；导出端用同一估算公式，保证两处一致、不溢出 canvas。
- brace 文字同理水平夹取。

夹取 helper 抽到 `exportImage.ts` 与 overlay 共用的纯函数模块（如 `labelClamp.ts`），避免重复实现。

## Risks / Trade-offs

- **[Risk] 同步截图在 zrender 推迟刷新时拿到旧画面** → Mitigation：首选同步方案；实测不通则降级 `'finished'` 事件；同时在导出后校验画布尺寸未被 option 切换改变。
- **[Risk] 还原 option 时 dataZoom slider 的缩放位置丢失** → Mitigation：从原 `getOption()` 快照完整还原，且导出用的 inside dataZoom 拷贝了原 `start/end`，期间不修改 `useUiStore.xRange`。
- **[Risk] `getOption()` 返回对象含内部字段，直接 mutate 污染实例** → Mitigation：`structuredClone` 后再改，仅对克隆操作。
- **[Trade-off] 点标签 yOffset 语义变更导致已存标签位置跳变** → 接受，这是预期改善，不提供迁移。
- **[Trade-off] brace 用全局峰值而非每段局部峰值** → 跨段 brace 可能不贴局部最高点，但实现简单且 brace 可横向拖动微调；后续若需更贴合可再迭代。
- **[Risk] 文字宽度估算 0.55*fontSize 偏差导致边缘轻微溢出** → Mitigation：屏幕端用 `getBBox()` 校正；导出端估算偏保守（取稍大系数），宁可内缩不溢出。
