## Context

当前 `ScaleHandle` 通过 ECharts `click` 事件选中曲线，在峰值处显示拖拽手柄。ECharts 的 `click` 事件仅在点击数据点时触发，`large: true` + `lttb` 采样导致数据点稀疏，曲线无法选中，工具不可用。

## Goals / Non-Goals

**Goals:**
- 提供可靠的曲线选中机制（曲线列表点击）
- 提供直观的垂直缩放滑条（左侧，拖拽滑块）
- 拖拽过程实时预览，mouseup 提交

**Non-Goals:**
- 不保留图表点击选中（ECharts 限制无法解决）
- 不改变缩放算法（仍为 `y * scale`）

## Decisions

### 1. 选中机制：曲线列表点击

**选择**：在 Y 缩放模式下，点击曲线列表中的曲线行选中该曲线。

**原理**：曲线列表始终可交互，不受 ECharts 渲染影响。`CurveList.tsx` 中已有 `handleCurveClick` 处理点击事件，在 Y 缩放模式下复用该逻辑设置 `activeScaledCurveId`。

### 2. 滑条定位：曲线渲染区域左侧

**选择**：滑条定位在 ECharts grid 左侧，垂直范围与选中曲线对齐。滑块 Y 位置映射到缩放倍率（顶端 = ×10.0，底端 = ×0.1）。

**计算**：
```
sliderTop = convertYToPixel(peakY)  // 曲线峰值像素位置
sliderBottom = convertYToPixel(0)   // 曲线基线像素位置
sliderHeight = sliderBottom - sliderTop
sliderLeft = gridLeft - 24          // grid 左侧留间距
```

**原理**：滑条与曲线区域对齐，视觉上明确关联。滑块位置与倍率呈对数映射（中段 = ×1.0），使拖拽感受均匀。

### 3. 倍率映射：对数映射

**选择**：滑块位置到倍率使用对数映射：
```
progress = (sliderBottom - thumbY) / sliderHeight  // 0~1, 0=底端=×0.1, 1=顶端=×10.0
scale = 10 ^ (progress * 2 - 1)  // 0.1 ~ 10.0
```

**原理**：对数映射使 ×1.0 在滑条中点，放大和缩小方向感受对称。

### 4. 拖拽提交：与 ScaleHandle 一致

**选择**：`mousemove` 更新 `displayScale`（预览），`mouseup` 提交 `setCurveScale`。使用 `pendingScaleRef` 避免闭包问题。

## Risks / Trade-offs

- **[风险] 曲线列表行高度小，点击区域有限** → **缓解**：已有 `handleCurveClick` 点击整行，无需额外改动
- **[权衡] 移除图表点击选中** → ECharts 限制无法解决，曲线列表点击更可靠