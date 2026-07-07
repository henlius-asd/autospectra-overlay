## Context

AutoSpectraOverlay 是一个纯前端色谱曲线叠图可视化工具（React 18 + ECharts 6 + Tailwind 3 + Zustand 5）。当前标注系统使用花括号（brace）进行区间标注，层间距通过原生 `<input type="range">` 竖向滑条控制，曲线列表通过 ID 哈希取色。已识别 7 个 UI/UX 问题需集中修复，并需新增单点标签工具和网格/坐标轴显隐控制。

约束：
- 100% 离线前端，无后端 API
- 使用 ECharts 渲染图表，SVG overlay 实现标注
- Zustand + zundo 管理状态（50 步 undo/redo）
- 导出通过 canvas composite（ECharts PNG + SVG brace → 合成 PNG）

## Goals / Non-Goals

**Goals:**
- 大括号标注视觉专业化，弹窗体验改善
- 大括号位置动态跟随数据（最高曲线上方）
- 层间距滑条去除负值、细化粒度、视觉美化
- 修复曲线列表颜色与图表不一致的 bug
- 移除多余的基准线星标
- 提供网格/坐标轴显隐开关，导出图片仅包含曲线和标签
- 新增单点标签工具（放置、拖拽、编辑、导出）

**Non-Goals:**
- 不改变 ECharts 渲染核心逻辑（replaceMerge、dataZoom 等）
- 不改变曲线数据结构（CurveData、DataPoint）
- 不改变 store 的 zundo temporal 机制
- 不改变文件解析（parser）和对齐引擎（engine）
- 不引入外部 UI 组件库（保持 Tailwind 原生）

## Decisions

### D1: 大括号样式 — I-beam 方括号风格

**选择**: 将花括号 bezier 路径替换为 "I-beam"（水平线 + 两端竖线 + 标签背景框）。

**理由**: 花括号在科学图表中不够常见，bezier 曲线在小尺寸下渲染不清晰。I-beam 风格是科学文献中标注区间的标准做法，视觉干净、辨识度高。

**替代方案**: 保留花括号但优化 bezier 参数 — 不够根本，仍显花哨。使用纯线段（无端竖线）— 端点不够突出。

### D2: 弹窗 — absolute HTML 浮层替代 foreignObject

**选择**: 将标签编辑弹窗从 SVG `<foreignObject>` 改为 React `absolute` 定位的 HTML `<div>`，叠加在 SVG 之上。

**理由**: `foreignObject` 在 SVG 内渲染 HTML 有兼容性和样式限制，定位不灵活。absolute HTML 浮层可以使用完整的 CSS 能力，定位精确，样式更丰富。

**替代方案**: 使用 `<foreignObject>` 但改进样式 — 仍有兼容性风险，不如直接换。使用 React Portal — 过度复杂，不需要脱离 DOM 层级。

### D3: 大括号位置 — 动态计算最高曲线上方

**选择**: 遍历可见曲线在 xRange 内的数据，找到最大 Y 值，通过 `convertYToPixel` 转换为像素坐标，在其上方 18px 处绘制。

**理由**: 固定位置（gridTop + 12）在数据值域集中时远离曲线，视觉脱节。动态位置始终紧贴数据。

**实现注意**: 需要 WaterfallChart 传入 `convertYToPixel` 函数和考虑 layerYOffset 后的实际渲染数据。性能上，每次渲染时计算 maxY 即可（数据已在水循环中遍历）。

### D4: 层间距滑条 — 自定义竖向滑条组件

**选择**: 使用 `min=0, max=0.5, step=0.001`，用 Tailwind + CSS 自定义美化原生 range input 的 track 和 thumb。

**理由**: 完全自定义 SVG 滑条复杂度过高且需要处理 pointer events。CSS 自定义 range 在主流浏览器（Chrome/Firefox/Edge）中支持良好，代码量少。

**替代方案**: 按钮式（▲▼）— 交互不够直观，无法连续调节。SVG 自定义滑条 — 过于复杂。

### D5: 颜色统一 — 提取共享 CURVE_COLORS + visibleIndex 取色

**选择**: 将 `CURVE_COLORS` 提取到 `src/lib/colors.ts`，CurveList 和 WaterfallChart 均从此导入。CurveList 中的颜色点改为使用 visibleIndex（该 curve 在 stagingOrder 过滤可见后的位置）取色，与 WaterfallChart 一致。

**理由**: 两处独立定义相同常量且取色逻辑不同是 bug 根源。统一为 visibleIndex 保证列表和图表颜色一致。

### D6: 单点标签 — 像素偏移模型

**选择**: PointLabel 存储 `x`（数据坐标）和 `yOffset`（相对最高曲线的像素偏移，负数=向上）。渲染时通过 `convertXToPixel(x)` 得到像素 X，通过曲线顶部像素 Y + yOffset 得到像素 Y。

**理由**: X 用数据坐标保证缩放时位置正确；Y 用像素偏移保证标签始终在曲线上方固定距离，不受 Y 轴缩放影响。拖拽时只修改 yOffset 和 x 的像素偏移转换。

**替代方案**: 全用数据坐标 (x, y) — Y 方向会随缩放漂移，拖拽体验差。全用像素坐标 — 缩放后位置不对。

### D7: 导出 — 临时 setOption 隐藏 grid/axes

**选择**: 导出时读取 store 中 showGrid/showAxes 状态，若当前开启则在导出前临时 `setOption({ xAxis: { show: false, splitLine: { show: false } }, yAxis: { show: false, splitLine: { show: false } } })`，导出后恢复。pointLabels 直接在 SVG 层渲染叠加。

**理由**: 避免维护两套 option 配置。临时修改 → 导出 → 恢复的模式简单可靠。

## Risks / Trade-offs

- **[R1] convertYToPixel 精度** → ECharts 内部模型可能在不同版本有差异。Mitigation: 使用 `(chartInstance as any)` 访问内部模型，与现有 getXAxisExtent 相同的模式，已在项目中验证。
- **[R2] 大括号动态位置性能** → 每次渲染遍历所有可见曲线数据计算 maxY。Mitigation: 曲线数据已加载在内存中，遍历一次 O(N) 开销极小（每曲线最多 ~100k 点，但可在 lttb 采样后数据上计算）。
- **[R3] CSS range 跨浏览器** → `::-webkit-slider-thumb` 和 `::-moz-range-thumb` 需分别写。Mitigation: 在 `index.css` 中写两组前缀，覆盖 Chrome/Edge/Firefox。
- **[R4] 导出时临时修改 option 的竞态** → setOption 触发重渲染，可能在导出过程中闪烁。Mitigation: 导出函数内用 `await` 顺序执行，getDataURL 是同步的 canvas 读取，闪烁时间 < 100ms 可接受。
- **[R5] PointLabel 拖拽与 dataZoom 冲突** → 拖拽标签时可能触发 dataZoom 的 inside 事件。Mitigation: 标签 pointerdown 时 `stopPropagation()`，与 BraceOverlay 的处理方式一致。

## Migration Plan

无需数据迁移。所有改动向后兼容：
- `pointLabels` 新增字段，旧 workspace JSON 导入时默认为 `[]`
- `showGrid/showAxes` 新增字段，旧 workspace JSON 导入时默认为 `true`
- 现有 `braces` 数据结构不变（仅渲染样式改变）
- `layerSpacing` 值域从 [-0.5, 0.5] 缩至 [0, 0.5]，旧数据中负值自动 clamp 为 0

## Open Questions

无。所有设计决策已在上方明确。
