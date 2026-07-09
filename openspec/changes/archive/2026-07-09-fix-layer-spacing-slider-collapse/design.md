## Context

Y 轴层间距滑块位于 `WaterfallChart.tsx` 渲染树的最末尾，是一个垂直 `<input type="range">`，通过 `writing-mode: vertical-lr; direction: rtl;`（`src/index.css` 的 `.layer-slider`）实现垂直方向。其 DOM 层级为：

```
<div class="relative w-full h-full">               // .wc-root，高度确定（来自 CenterPanel 的 flex-1）
  ...ECharts / overlays...
  <div class="absolute top-1/2 right-1 -translate-y-1/2
              flex flex-col items-center gap-1.5 pointer-events-none">   // 包裹层，仅 top，无 height
    <span>{layerSpacing.toFixed(3)}</span>
    <input class="layer-slider h-3/5 w-3 pointer-events-auto" .../>     // h-3/5 = height:60%
  </div>
</div>
```

复现测得：包裹层高度 37.6px（auto），input 高度 14px（= thumb 尺寸，轨道 0px）。对照组给包裹层显式 300px 后 input 为 180px（= 60%），正常。

CSS 规则：百分比高度要解析，父级必须有确定高度。包裹层是 absolutely positioned 但只设了 `top`（无 `bottom`/`height`），高度为 auto；input 的 `height:60%` 因此被忽略，回退到内在高度。对 `writing-mode: vertical-lr` 的 range 控件，Chrome 117 下内在高度恰为 thumb 高度 14px。

## Goals / Non-Goals

**Goals:**
- 让滑块轨道在任何 re-render 后保持非零高度，确保可拖动并能取到 0..0.5 间任意值。
- 保持滑块垂直方向、宽度、视觉与现有一致。
- 保持滑块高度随图表区域高度按比例缩放的原意图（60%）。

**Non-Goals:**
- 不替换 `writing-mode` 垂直滑条方案为 `appearance: slider-vertical`（另议）。
- 不改动 `layerSpacing` 的 store 逻辑、范围（0..0.5）、步进（0.001）。
- 不调整滑块在右侧的水平位置或 z-index。

## Decisions

### 决策 1：把百分比高度从 `<input>` 移到包裹层

**选择**：包裹层 div 增加 `h-3/5`，input 由 `h-3/5` 改为 `flex-1`。

**理由**：包裹层是 absolutely positioned，其百分比高度的 containing block 是最近 positioned 祖先（`.wc-root`，`relative`，高度确定）。故 `h-3/5` 在包裹层上能正确解析为图表高度的 60%。input 作为 flex item 用 `flex-1` 填满包裹层扣除 span 后的剩余空间，轨道随之获得非零高度。

**备选方案与取舍**：
- A. 给 input 固定像素高度（如 `h-40`=160px）：简单，但失去随图表高度缩放的能力，大屏过短、小屏过长。
- B. 给包裹层固定像素高度：同 A 的缺点。
- C. 保留 `h-3/5` 在 input 上但给包裹层 `h-full`：包裹层 `h-full` 解析到 `.wc-root`（确定），然后 input `h-3/5` 解析到包裹层（确定）——也可行，但多一层间接，且包裹层会占满全高导致 thumb 居中偏移。
- **采用**：决策 1（包裹层 `h-3/5` + input `flex-1`），最直接、保留比例缩放、不改变定位语义。

### 决策 2：input 宽度保留 `w-3`

包裹层宽度仍为 auto（shrink-to-fit），input 维持 `w-3`（12px）。span 文本宽度由包裹层自适应。不引入 `w-full`，避免压缩 span。

## Risks / Trade-offs

- [Risk] `flex-1` 在 `<input type=range>` 上的兼容性：少数旧浏览器对 replaced element 的 flex 行为不一致。→ Mitigation：Chrome 117（目标环境）实测 `flex-1` 在 range input 上正常；若后续发现兼容问题，回退到决策 C（包裹层 `h-full` + input `h-3/5`）。
- [Risk] 包裹层 `h-3/5` 使其总高度增大，可能与其他 overlay（BraceOverlay/PointLabelOverlay）在最右侧产生重叠。→ Mitigation：滑条原本就在 `right-1` 最右边缘，overlay 主要在 grid 内部；且 `pointer-events-none` 包裹层只对 input 放行，不会拦截 overlay 交互。需在实现后目视确认。
- [Trade-off] span 高度（~14px）会从 60% 中扣除，使 input 实际高度略小于 60%。可接受，差异约 14px。
