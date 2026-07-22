## Why

区间标签（brace）的括号形状和标签定位存在三个设计问题：
1. 工具栏图标（两个并排竖花括号）与图表实际绘制的括号不对应；
2. 图表上的括号是 I-beam（水平线+两端短竖线），视觉上不够醒目，用户希望改为 PPT 风格的扁平括号；
3. 区间标签和点标签的标签位置被钉在顶曲线附近，无法靠近下层曲线，且被 clamp 约束限制在 grid 内——用户希望完全自由放置和拖拽。

## What Changes

- **Brace 形状更新**：括号从 I-beam 改为 PPT 风格扁平括号——水平主线 + 中央锐角三角尖刺（向上，无圆角，底宽 2px）+ 两端小钩（向下，圆角 3px），整体高度 14px。尖刺朝上指向标签，钩朝下指向曲线。
- **Brace 图标更新**：工具栏图标从两个并排竖花括号改为单个水平 overbrace ⏜（尖点朝上），与图表绘制形状一致。
- **区间标签自由纵向定位**：`BraceAnnotation` 新增 `yOffset` 字段（像素偏移），拖拽从仅横向扩展为 2D（dx+dy），支持自由纵向拖拽。默认 `braceY` 调整为贴近顶曲线峰值。
- **点标签自由放置**：放置时落在点击的像素 Y（而非固定顶曲线 Y-10）；保留纵向拖拽能力。
- **移除标签位置约束**：区间标签和点标签的 `clampLabelX`/`clampLabelY` 均移除，标签可放置在画布任意位置，无边界裁切。
- **导出同步**：图片导出和 PPTX 导出同步应用新形状、yOffset 和移除 clamp。

## Capabilities

### New Capabilities
- `brace-ppt-style`: PPT 风格扁平括号形状——水平主线 + 中央锐角三角尖刺 + 两端圆角小钩，替换原 I-beam。
- `label-free-positioning`: 区间标签和点标签不再受 clamp 约束，可自由放置在画布任意位置；区间标签新增纵向拖拽（yOffset）。

### Modified Capabilities
- `brace-tool`: 括号形状从 I-beam 改为 PPT 风格；拖拽从仅横向扩展为 2D；新增 yOffset 支持自由纵向定位；移除 clamp 标签位置约束；默认 braceY 基线调整。
- `point-label-tool`: 放置时落在点击像素 Y 而非固定顶曲线 Y-10；移除 clamp 标签位置约束。
- `toolbar-tool-system`: BraceIcon 图标从两个并排竖花括号改为单个水平 overbrace ⏜。

## Impact

- `src/types/brace.ts` — BraceAnnotation 新增 yOffset 字段
- `src/components/chart/bracePath.ts` — 完全重写（新形状 + bracePathPoints）
- `src/components/ui/icons.tsx` — BraceIcon 重写
- `src/components/chart/BraceOverlay.tsx` — 2D 拖拽、yOffset、移除 clamp、标签 Y 更新
- `src/components/chart/PointLabelOverlay.tsx` — 点击像素 Y 放置、移除 clamp、移除不再需要的 props
- `src/components/chart/WaterfallChart.tsx` — braceY 默认值调整、PointLabelOverlay props 精简
- `src/components/chart/exportImage.ts` — yOffset、移除 clamp、新形状、标签 Y 更新
- `src/components/chart/exportPptx.ts` — yOffset、移除 clamp、新形状（custGeom 采样点）、标签 Y 更新
- 持久化（IndexedDB / JSON）自动兼容：yOffset 为可选字段，旧快照无此字段默认 0