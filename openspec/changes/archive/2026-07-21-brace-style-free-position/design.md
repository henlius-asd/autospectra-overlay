## Context

区间标签（brace）的括号形状经历了两轮迭代：最初是 I-beam（水平线+两端短竖线），然后尝试了多段贝塞尔花括号 ⏜，最终用户提供了 PPT 截图参考，敲定为扁平括号——水平主线 + 中央锐角三角尖刺 + 两端圆角小钩。同时，区间标签和点标签的标签定位一直被 clamp 约束在 grid 边界内，且区间标签仅支持横向拖拽——用户要求完全自由放置。

该变更跨 8 个文件，涉及类型定义、渲染路径、React 组件、导出管线，但所有变更都在现有架构内，无新依赖。

## Goals / Non-Goals

**Goals:**
- 括号形状改为 PPT 风格扁平括号（水平主线 + 锐角三角尖刺 + 圆角钩）
- 区间标签支持纵向拖拽（yOffset），实现完全自由的二维定位
- 点标签放置时落在点击像素 Y（而非固定 yOffset=-10）
- 移除区间标签和点标签的 clamp 位置约束
- 图片导出和 PPTX 导出同步新形状和定位逻辑

**Non-Goals:**
- 不改变 brace 的放置流程（仍为拖拽选择区间 + 编辑浮层）
- 不改变点标签的编辑流程
- 不改变 labelStyle 样式系统
- 不增加每标签样式覆盖
- 不修改 ECharts 渲染管线（graphic 组件）

## Decisions

### 1. 括号形状：三角形尖刺 + 圆角钩

**选型**：用户提供 PPT 截图参考，明确要求尖刺为锐角三角形（无圆角）、钩为圆角。尖刺底宽 2px，钩圆角半径 3px。

**替代方案**：曾尝试多段贝塞尔花括号（C1 光滑版），用户反馈不是想要的样式，且手写控制点难以微调。

**实现**：用单一 stroked 路径绘制——`M` 起点于左钩底 → `Q` 左钩圆角 → `L` 水平线至尖刺左底 → `L` 尖刺顶 → `L` 尖刺右底 → `L` 水平线至右钩 → `Q` 右钩圆角。尖刺为 `L` 直线（无贝塞尔），钩为 `Q` 二次贝塞尔，stroke-linecap="round" 使钩端圆润。

### 2. yOffset 字段设计

**选型**：`BraceAnnotation.yOffset?: number`（像素偏移，默认 0）。纵向拖拽直接读写 yOffset。`y = braceY + (brace.yOffset ?? 0)`。

**替代方案**：绝对 Y 坐标——需要额外存储，且与 dataZoom 联动的基线计算耦合。yOffset 相对默认 braceY 更简洁，且旧快照自动兼容（缺省 `yOffset` 时为 0）。

### 3. 2D 拖拽

**选型**：扩展现有拖拽状态 `{startClientX, startClientY, origStartX, origEndX, origYOffset}`，在 handlePointerMove 中同时计算 dx/dy。横向更新 startX/endX，纵向更新 yOffset。阈值检查改为 `|dx|<5 && |dy|<5`（任一方向超过阈值即触发拖拽）。

### 4. 移除 clamp

**选型**：完全移除 `clampLabelX`/`clampLabelY` 调用。BraceOverlay 和 PointLabelOverlay 中标签 X/Y 直接使用原始计算值，不被 grid 边界裁切。

**风险**：标签可能被拖到画布外不可见。用户明确要求"无任何约束"，接受此风险。

### 5. 默认 braceY 调整

**选型**：`braceY = Math.max(gridTop + BRACE_HEIGHT/2 + BRACE_LABEL_GAP + 2, convertYToPixel(peak) - BRACE_HEIGHT/2)`。BRACE_HEIGHT/2 = 7px（HOOK_H），使钩端贴近曲线峰值约 7px。

**原公式**：`Math.max(gridTop + 8, convertYToPixel(peak) - 14)`（适配 I-beam，主线在峰值上方 14px）。

### 6. 导出一致性

图片导出（exportImage.ts）使用同一 `bracePath()` 函数，形状自动同步。PPTX 导出（exportPptx.ts）用 `bracePathPoints()` 采样贝塞尔/直线段为折线点，通过 `addCustGeom` 绘制。yOffset 和 clamp 移除在两处导出中同步应用。

## Risks / Trade-offs

- **[Risk] 旧快照无 yOffset** → **Mitigation**: yOffset 为可选字段，缺失时默认 0，与旧行为一致。
- **[Risk] 移除 clamp 后标签可能出画布** → **Mitigation**: 用户明确要求无约束，且可自由拖回。导出时标签位置与屏幕一致。
- **[Risk] PPTX custGeom 折线采样可能不平滑** → **Mitigation**: 每段采样 6 点，尖刺为直线无需采样，钩用二次贝塞尔采样。如需更平滑可增加采样点。
- **[Risk] 钩端 stroke-linecap="round" 在 PPTX 中无法完美复现** → **Mitigation**: PPTX 折线端点天然为平头，视觉差异极小，可接受。