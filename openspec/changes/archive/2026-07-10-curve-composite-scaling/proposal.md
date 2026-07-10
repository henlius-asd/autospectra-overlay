## Why

当前系统仅支持单条曲线分别缩放（Y缩放模式），缺少「所有曲线一起缩放」和「归一化」的能力。用户需要全局倍率统一调节所有曲线，以及一键将各曲线峰值对齐到基准线使整体高度一致，且归一化后仍可单独微调。

## What Changes

- 新增三层复合缩放模型：归一化层（`normalizeFactors`，每曲线） × 全局层（`globalScale`，共享） × 手动层（`curveScales`，每曲线），三层相乘 = 最终倍率。仅作用于 Y 值，不改 X。
- 新增归一化动作：一键将各可见曲线峰值对齐到基准线（最底可见曲线）峰值，整体高度一致。一次性动作，非持久模式。
- **两个独立缩放工具**（非三态循环）：「全局缩放」和「单曲线缩放」各自独立开关，分别控制 `globalScale` 和 `curveScales`，两者可同时激活。缩放仅用滚轮，弃用拖拽缩放。
- **统一曲线选中**：删除 `activeScaledCurveId`，`selectedCurveId` 成为唯一选中态，同时驱动元数据面板、列表高亮、缩放目标。曲线列表点击和图表渲染区点击均可选中曲线。
- **移除全屏覆盖层**，改用原生 `addEventListener('wheel', handler, { passive: false })` 挂载到图表容器，修复 React 合成 onWheel passive listener 导致 ECharts 抢占滚轮的 bug。
- 图表渲染区支持点击曲线选中：ECharts series 添加 `id`，`onEvents` 添加 `click` 处理器。
- 保留 Shift+拖拽 单曲线平移（`curveScaleOffsets`），不加全局偏移。
- 扩展 `computeYAxisRange` 按缩放后数据计算 Y 轴范围，使缩放曲线不被 `clip:true` 裁剪。
- 持久化 `globalScale` 和 `normalizeFactors` 到 workspace JSON。
- 重命名「清除归一」为「还原归一」。

## Capabilities

### New Capabilities

- `curve-composite-scale`：三层复合缩放模型（数据层、渲染、全局/单曲线交互、持久化、Y 轴范围自适应）

### Modified Capabilities

- `scale-slider`：单曲线缩放工具改为复合模型中的手动层入口；缩放由拖拽改为滚轮；三态循环改为两个独立按钮
- `metadata-panel`：曲线选中统一为单一 `selectedCurveId`，支持图表渲染区点击选中（不再仅限列表点击）

## Impact

- `src/store/curveStore.ts` — 新增字段 + 动作
- `src/store/uiStore.ts` — 删除 `activeScaledCurveId`，`scaleMode` 三态改为 `globalScaleMode` + `perCurveScaleMode` 两个独立布尔
- `src/components/chart/curveScaleMath.ts` — 新增 `computePeakNormalizeFactor`，移除 `scaleByDrag`
- `src/components/chart/CurveScaleOverlay.tsx` — 移除全屏覆盖层 div，改用原生 `addEventListener` 挂载 wheel/mousedown；badge 改为 `pointerEvents: 'none'` 纯展示
- `src/components/chart/WaterfallChart.tsx` — 渲染应用复合公式；ECharts series 加 `id`；`onEvents` 加 `click` 选中；移除覆盖层渲染
- `src/components/chart/computeYAxisRange.ts` — 扩展为按缩放数据算 Y 范围
- `src/components/chart/exportImage.ts` — 调用方传入缩放参数
- `src/components/data/CurveList.tsx` — 点击始终设 `selectedCurveId`（不再分支 scaleMode）
- `src/components/toolbar/Toolbar.tsx` — 两个独立缩放按钮 + 归一化按钮 + 还原归一按钮
- `src/persistence/index.ts` — 持久化新字段
- 测试更新：`curveScaleMath.test.ts`、`curveStore.test.ts`、`computeYAxisRange.test.ts`