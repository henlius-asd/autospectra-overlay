## Context

`AutoSpectraOverlay` 的 WaterfallChart 用 ECharts 渲染。X 轴缩放已用原生 `dataZoom`（`inside` + `slider`，`xAxisIndex: 0`）实现：轨道代表全量 X 范围，手柄在全量里选子区间，图表只显示该子区间，`xRange` 通过 `datazoom` 事件回写 `uiStore`。

Y 轴框选最近由手写 `YRangeSlider` overlay + `resolveYAxis` 实现：`yAxis.min/max = resolveYAxis(rangeResult, yZoomRange)`（框选范围），`YRangeSlider` 在绘图区左侧画两个手柄。结构性 bug：手柄坐标参考系是 `resolvedFrame`（= 框选范围 = yAxis 可见范围 = 绘图区），所以手柄永远贴绘图区上下边缘、无全量轨道上下文，拖动时"边界原点不随边界移动"。`convertYToPixel` 当前读 `resolvedFrame`（Task 4 起不再读 ECharts model）。

约束：`tsconfig` strict + noUnusedLocals/Parameters；vitest 仅纯函数/store 单测，无 React 组件测试栈；`computeYAxisRange` 算全量范围（含 15% 标签预留区，`LABEL_PADDING_RATIO`）；`curveScales`/`curveScaleOffsets` 每曲线缩放层（`CurveScaleOverlay`）独立，复用 `yToPixel`/`pixelToY`；工作区 JSON 持久化 `yZoomRange`。

## Goals / Non-Goals

**Goals:**
- Y 轴框选改用 ECharts 原生 `dataZoom`（竖向 slider + inside 滚轮），与 X 轴同款交互与样式。
- 修复"手柄不随边界移动"——原生滑条 track 代表全量 Y 范围，手柄在全量里选子区间。
- 屏幕、标签/brace、PNG 导出三者 Y 可见范围一致。
- 删除手写 `YRangeSlider`，减少自维护组件。
- `yZoomRange` 持久化格式不变（`[number, number] | null`），旧工作区存档可读。

**Non-Goals:**
- 不改每曲线独立缩放层（`CurveScaleOverlay`/`curveScaleMath`）的数据模型与交互，只改其可见 Y 范围的来源。
- 不改 `computeYAxisRange` 的全量范围公式。
- 不改 X 轴 dataZoom 行为。
- 不做预览图/minimap 框选（仍用滑条）。

## Decisions

### D1: 用 ECharts 原生 dataZoom 替换手写 YRangeSlider

`dataZoom` 增 yAxisIndex 项：`{ type: 'inside', yAxisIndex: 0 }` + `{ type: 'slider', yAxisIndex: 0, orient: 'vertical', left: <gridLeft-margin>, width: 14 }`。用 `dataZoomId` 标记（如 `'yZoom'`）以便事件区分 X/Y。

**理由**：原生滑条自带全量轨道、可拖手柄、中间平移、滚轮缩放、复位，且与 X 轴样式一致；直接消除"无全量上下文"的结构 bug。手写修复方案（把 track 改成全量范围 + 独立边距区）等于重写 dataZoom 已做好的事，仍留观感与维护负担。

**备选**：保留手写、把 `frame` 改成全量范围并把 track 移到独立边距区。否决：重复造轮子、仍丑。

### D2: yAxis.min/max 改回全量范围

`yAxis.min = rangeResult.yAxisMin`、`yAxis.max = rangeResult.yAxisMax`（含 15% 预留区），不再用 `resolveYAxis`。dataZoom 在 `[yAxisMin, yAxisMax]` 全量范围内选可见子区间。

**理由**：dataZoom 需要固定的全量范围作为轨道上下文；这与 X 轴（`xAxis.min/max = 全量`）一致。15% 预留区保留在全量范围上（未框选时标签有空间）。

### D3: yZoomRange ↔ dataZoom 双向同步

- **option 侧**：dataZoom 的 Y 项带 `startValue`/`endValue`（来自 `yZoomRange`，经 clamp）；`yZoomRange === null` 时不设（= 全量）。
- **事件侧**：`onDataZoom` 处理 `datazoom` 事件的 `batch`，按 `dataZoomId` 找到 Y 项，读 `startValue`/`endValue` → 经纯函数 `normalizeYZoomRange(lo, hi, bounds)` 规整（min/max 顺序、clamp 到 `[rawDataMin, rawDataMax]`、最小段 5% dataSpan）→ 写 `uiStore.setYZoomRange`。X 项仍写 `xRange`（不变）。
- **data 变化时 clamp**：`xRange`/曲线增删导致 `rawDataMin/Max` 重算后，若 `yZoomRange` 越界，在 option useMemo 里 clamp 后再传入 `startValue/endValue`（不丢用户框选，仅裁到合法区间）。

**理由**：与 X 轴 `xRange` 的同步模式对称；纯函数 `normalizeYZoomRange` 可单测。`resolveYAxis` 的 clamp 逻辑迁移到此纯函数，`resolveYAxis.ts` 可删除（其 `ResolvedYAxis` 类型不再需要）。

### D4: convertYToPixel / 导出改读 dataZoom 后的 model Y extent

恢复 `getYAxisExtent()`（读 `chartInstance.getModel().getComponent('yAxis',0).axis.scale.getExtent()`），`convertYToPixel` 用其返回的 `[yMin, yMax]` + grid 常量经 `yToPixel` 换算。dataZoom 后 model extent = 可见子区间，故标签/brace/overlay 自动跟随。`CurveScaleOverlay` 的可见 Y 范围同样来自 `convertYToPixel` 的 frame（经 model extent），不再依赖 `resolvedFrame` prop——改为接收 `convertYToPixel` 或等价 frame。

**理由**：这是 dataZoom 后唯一能反映"当前可见 Y 范围"的来源。当年刻意避开 model extent 是怕 ECharts 自动缩放正反馈漂移，但现在 yAxis 有**显式 min/max**（无 auto-scale），model extent = 显式范围经 dataZoom 调整，确定性、无反馈。

### D5: dataZoom filterMode = 'none' + clip:true

Y dataZoom 设 `filterMode: 'none'`，配合 series `clip: true`（已存在）。线段在范围边界被裁剪而非过滤，避免端点断裂。

### D6: 最小段约束用 dataZoom 原生 `minValueSpan`

Y dataZoom 设 `minValueSpan = 0.05 × dataSpan`（与原 `resolveYAxis` 的 5% 一致），由 ECharts 原生阻止过窄选择；`normalizeYZoomRange` 仍保留 5% clamp 作为事件回写时的兜底。

**理由**：原生 `minValueSpan` 在交互层就阻止退化，比仅在回写时 clamp 体验更好。

### D7: 允许框选进入标签预留区（取舍）

不强制把 dataZoom 可选范围限制在 `[rawDataMin, rawDataMax]`——dataZoom 在全量 `[yAxisMin, yAxisMax]`（含 15% 预留）内可选。框选到预留区时只是看到曲线上方的空白，标签仍由 `convertYToPixel` 跟随可见范围正确定位，无害。

**理由**：原生 dataZoom 限制可选子区间到轴的子段较麻烦（需额外 `start/end` 百分比钳制）；放宽限制换实现简洁。备选：强行限制到 `[rawDataMin, rawDataMax]`——否决，复杂度不值。

## Risks / Trade-offs

- [竖向 slider 与 Y 轴标签/左侧布局重叠] → 用 `left`/`width` 定位在 grid 左边距，必要时调 `grid.left`；人工验证不压标签。
- [datazoom 事件高频写 store 拖动卡顿] → 与 X 轴 `onDataZoom` 同模式（未 debounce），先对齐现状；若卡顿再加 rAF/throttle。
- [重新引入 model extent 依赖的正反馈风险] → yAxis 显式 min/max 已消除 auto-scale；model extent 确定性。回归测试覆盖"框选→标签跟随→导出一致"。
- [data 变化后 yZoomRange 越界] → option useMemo 内 clamp 后再传 startValue/endValue；`normalizeYZoomRange` 兜底。
- [CurveScaleOverlay 改 frame 来源可能影响每曲线缩放像素对齐] → 其 offset/scale 计算用 `pixelToY` delta（offset-invariant），改 frame 来源不改变 delta 语义；回归人工验证每曲线缩放仍贴曲线。
- [允许框选进预留区显空白] → 取舍，D7 已述；可接受。

## Migration Plan

1. 删除 `YRangeSlider.tsx` 及其在 `WaterfallChart` 的挂载与 props。
2. `WaterfallChart`：dataZoom 增 Y 项（id `yZoom`、startValue/endValue、minValueSpan、filterMode none、竖向 slider 定位）；yAxis.min/max 改全量；恢复 `getYAxisExtent`；`convertYToPixel` 改读 model extent；`onDataZoom` 增 Y 分支写 `yZoomRange`。
3. 新增纯函数 `normalizeYZoomRange`（含单测），迁移 `resolveYAxis` 的 clamp 逻辑；删除 `resolveYAxis.ts` 及其单测（或保留为 `normalizeYZoomRange` 别名，视重构整洁度）。
4. `CurveScaleOverlay`：可见 Y frame 改来自 `convertYToPixel`（或传入 model extent），移除 `resolvedFrame`/`fullRange` props 中不再需要者。
5. `exportImage`：导出 inside zoom 增 yAxisIndex 项并保留其 startValue/endValue；Y 像素换算改读 dataZoom 后 model extent。
6. 回归：vitest + tsc + build + 人工（框选/滚轮/平移/复位、标签跟随、导出一致、每曲线缩放仍贴曲线、旧工作区导入）。
7. 回滚：本变更在独立分支，不合即弃；`yZoomRange` 格式不变，回滚不影响已存工作区。

## Open Questions

- 竖向 slider 具体宽度/位置（`left`、`width`、是否需要 `labelFormatter`）需人工调参确认不压 Y 轴刻度——留实施时微调。
- `resolveYAxis.ts` 是整文件删除还是重命名为 `normalizeYZoomRange`——倾向删除并新建 `yZoomRange.ts` 放纯函数，保持文件名单一职责。
