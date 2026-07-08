## Context

当前 AutoSpectraOverlay 使用 ECharts 渲染瀑布色谱图叠图。曲线渲染路径为 `y + layerYOffset + offset.yOffset`，所有曲线共享同一 Y 轴量程。颜色通过 `visibleIndex` 取模固定 10 色调色板分配。坐标轴默认显示。

约束：
- ECharts 单 Y 轴实例不支持 per-series 独立坐标轴刻度
- 现有 HTML 覆盖层（BraceOverlay、PointLabelOverlay）依赖像素坐标转换函数
- `exportImage.ts` 独立镜像了渲染逻辑，需同步更新
- 工作区 JSON 序列化需向后兼容

## Goals / Non-Goals

**Goals:**
- 实现 per-curve 独立 Y 轴缩放，通过图表区域直接拖拽交互
- 曲线颜色默认黑色，用户可通过颜色选择器自定义
- 坐标轴默认隐藏

**Non-Goals:**
- 不实现 ECharts 多 Y 轴（每个轴占用视觉空间，与瀑布图布局冲突）
- 不实现曲线颜色自动分配算法（用户手动指定）
- 不在此次变更中移除坐标轴渲染代码（仅标记弃用、改默认值）

## Decisions

### 1. Y 轴缩放：per-curve 数据拉伸 + HTML 覆盖层手柄

**选择**：在数据层对每条曲线应用 `y * scale` 变换，通过 HTML 覆盖层渲染拖拽手柄，而非 ECharts 原生交互。

**替代方案**：
- *ECharts 多 Y 轴*：每个轴渲染独立刻度线，占用额外空间，与瀑布图紧凑布局冲突
- *ECharts dataZoom 缩放*：仅支持全局 Y 轴缩放，无法 per-curve
- *曲线列表侧边滑块*：不够直观，用户需要在图表区直接看到缩放效果

**原理**：ECharts 只负责数据渲染，交互逻辑由 HTML 覆盖层实现。`ScaleHandle.tsx` 在选中曲线峰值像素位置渲染手柄，拖拽时计算缩放倍率并更新 `curveScales` store，触发 ECharts 重渲染。

**缩放的几何基准**：`y * scale` 以 y=0 为基准点进行缩放。色谱数据通常从 0 开始（AU 值），此行为符合直觉。缩放后 Y 轴范围由 `computeYAxisRange` 重新计算。

### 2. 缩放倍率计算：相对拖拽距离

**选择**：`newScale = startScale × (1 + deltaY / chartHeight)`，钳制 [0.1, 10.0]。

**替代方案**：
- *绝对像素映射*：将手柄像素位置直接映射到 scale 值，但不同曲线峰值高度不同，映射不统一
- *步进式增减*：固定步长不够精细

**原理**：相对变化率使缩放感受与曲线当前高度成正比——曲线越高，相同拖拽距离产生的缩放变化越大，符合直觉。

### 3. 曲线颜色：存储在 CurveData 而非独立映射

**选择**：`CurveData.color?: string`，默认 `#000000`。

**替代方案**：
- *独立 `curveColors: Record<string, string>` 映射*：增加状态碎片化，CurveData 是曲线的自然归属
- *固定调色板 + 用户覆盖*：增加复杂度，不如直接由用户控制

**原理**：颜色是曲线的固有属性，应随曲线数据存储。黑色默认值确保未自定义的曲线有统一的视觉表现。

### 4. 坐标轴默认值：直接改初始状态

**选择**：`uiStore.ts` 中 `showAxes: true` → `false`，不引入新常量或配置。

**原理**：这是最小化改动，现有 `toggleShowAxes` 按钮功能不受影响。坐标轴渲染代码保留，仅标记 `@deprecated`。

## Risks / Trade-offs

- **[风险] per-curve 缩放后 Y 轴刻度语义模糊**：不同曲线缩放倍率不同时，Y 轴刻度值对任一单条曲线都不再准确 → **缓解**：用户使用场景是曲线间相对比较，绝对数值意义有限；坐标轴默认隐藏进一步降低此问题的影响
- **[风险] 拖拽手柄与 ECharts 渲染不同步**：手柄像素位置基于 JavaScript 计算，与 ECharts 内部渲染可能存在微小偏移 → **缓解**：复用现有 `convertYToPixel` 函数，该函数已在 BraceOverlay 和 PointLabelOverlay 中验证可用
- **[风险] 缩放后的曲线峰值可能超出可见区域**：scale > 1 时曲线峰值可能超出 Y 轴范围，手柄不可见 → **缓解**：`computeYAxisRange` 已基于缩放后数据计算 Y 轴范围，确保可见
- **[风险] 工作区 JSON 向后兼容**：旧工作区文件不包含 `curveScales` 和 `color` 字段 → **缓解**：导入时使用默认值 `scale=1.0`、`color=#000000`
- **[权衡] 坐标轴默认隐藏**：这是 **BREAKING** 视觉变更，用户首次打开可能不适应 → **缓解**：工具栏 "坐标轴" 按钮一键恢复，无需迁移