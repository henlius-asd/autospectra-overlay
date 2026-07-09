## Why

Y 轴层间距滑块在数据导入并调整颜色后退化成一个圆点，无法拖动调整。根因已通过复现确认：滑块包裹层（`absolute top-1/2 right-1 -translate-y-1/2`，仅设 `top` 无 `height`）高度为 auto，导致其上的 `<input class="layer-slider h-3/5">` 百分比高度被浏览器忽略，回退到内在高度 14px（仅 thumb），轨道塌缩为 0px。复现测试测得 input 高度 14px、对照组（父级显式 300px）为 180px，差异确凿。这使得 `auto-layering` 规约中"拖动滑块调整层间距"的场景失效。

## What Changes

- 将 Y 轴层间距滑块的百分比高度 `h-3/5` 从 `<input>` 移到其包裹层 `div`（包裹层为 absolutely positioned，百分比高度会正确解析到 `.wc-root` 的确定高度），input 改用 `flex-1` 填充包裹层剩余空间。
- 确保滑块在数据导入、颜色调整等触发 re-render 的操作后仍保持可拖动、轨道可见。

## Capabilities

### New Capabilities
<!-- 无新增能力 -->

### Modified Capabilities
- `auto-layering`: 补充并强化滑块可交互性要求——滑块轨道 SHALL 在任何 re-render 后保持非零高度且可拖动，确保用户能取到 0 与 max 之间的任意中间值。

## Impact

- `src/components/chart/WaterfallChart.tsx`：滑块包裹层与 input 的 className 调整（1 处 JSX）。
- `src/index.css`：`.layer-slider` 样式无需改动（已正确），但本次变更依赖其既有定义。
- 无 store / API / 依赖变更。
