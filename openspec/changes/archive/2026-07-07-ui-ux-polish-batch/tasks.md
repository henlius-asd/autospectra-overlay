## 1. 共享基础设施

- [x] 1.1 创建 `src/lib/colors.ts`，提取共享 `CURVE_COLORS` 常量数组
- [x] 1.2 修改 `src/components/chart/WaterfallChart.tsx`，从 `@/lib/colors` 导入 `CURVE_COLORS`，删除本地定义
- [x] 1.3 修改 `src/components/data/CurveList.tsx`，从 `@/lib/colors` 导入 `CURVE_COLORS`，删除本地定义

## 2. 修复曲线颜色不一致 Bug（#4）

- [x] 2.1 修改 `src/components/data/CurveList.tsx`，将曲线色点取色逻辑从 ID 哈希改为 `visibleIndex`（该 curve 在 stagingOrder 过滤可见后的位置索引），未可见曲线使用灰色 `#ccc`

## 3. 移除基准线星标（#5）

- [x] 3.1 修改 `src/components/data/CurveList.tsx`，删除 `isBaseline && <span>★</span>` 的 3 行渲染代码

## 4. 层间距滑条改进（#3）

- [x] 4.1 修改 `src/components/chart/WaterfallChart.tsx`，将滑条参数改为 `min={0}, max={0.5}, step={0.001}`
- [x] 4.2 在 `src/index.css` 中添加 range input 自定义样式（`::-webkit-slider-thumb`、`::-moz-range-thumb`、track 样式），与主题蓝色搭配
- [x] 4.3 优化滑条容器布局：调整数值标签和滑条的间距、对齐

## 5. 网格/坐标轴显隐控制（#6）

- [x] 5.1 修改 `src/store/uiStore.ts`，添加 `showGrid: boolean`（默认 true）、`showAxes: boolean`（默认 true）状态及 toggle actions
- [x] 5.2 修改 `src/components/chart/WaterfallChart.tsx`，在 ECharts option 中响应 `showGrid`/`showAxes`：`xAxis.show`、`yAxis.show`、`splitLine.show` 对应设置
- [x] 5.3 修改 `src/components/toolbar/Toolbar.tsx`，添加"网格"和"坐标轴"两个 toggle 按钮
- [x] 5.4 修改 `src/persistence/index.ts`，确保 `showGrid`/`showAxes` 在 workspace 导入时兼容旧数据（默认 true）

## 6. 大括号样式重做 + 弹窗改进（#1）

- [x] 6.1 重写 `src/components/chart/bracePath.ts`，将花括号 bezier 路径改为 I-beam 方括号路径（水平线 + 两端竖线 + 标签背景框）
- [x] 6.2 修改 `src/components/chart/BraceOverlay.tsx`，将标签编辑弹窗从 `<foreignObject>` 改为 `absolute` 定位的 HTML `<div>` 浮层
- [x] 6.3 改善弹窗样式：白色背景、圆角、阴影、合适的 padding、focus ring，定位在大括号中心上方
- [x] 6.4 修改 `src/components/chart/exportImage.ts`，导出时使用新的 I-beam 路径渲染大括号

## 7. 大括号位置动态化（#2）

- [x] 7.1 修改 `src/components/chart/WaterfallChart.tsx`，新增 `convertYToPixel` 函数，传入 BraceOverlay
- [x] 7.2 修改 `src/components/chart/BraceOverlay.tsx`，接收 `convertYToPixel` 和可见曲线数据，动态计算最大 Y 值，将大括号 Y 位置设为 `convertYToPixel(maxY) - 18`，clamp 在 `gridTop + 5` 以下
- [x] 7.3 修改 `src/components/chart/exportImage.ts`，导出时同步使用动态 Y 位置计算

## 8. 单点标签工具（#7）— 类型和 Store

- [x] 8.1 创建 `src/types/pointLabel.ts`，定义 `PointLabel { id: string; x: number; yOffset: number; label: string }`
- [x] 8.2 修改 `src/types/index.ts`，导出 `PointLabel` 类型
- [x] 8.3 修改 `src/store/curveStore.ts`，添加 `pointLabels: PointLabel[]` 状态，添加 `addPointLabel`、`updatePointLabel`、`removePointLabel` actions
- [x] 8.4 修改 `src/store/uiStore.ts`，添加 `pointLabelPlacementMode: boolean` 状态及 `setPointLabelPlacementMode` action
- [x] 8.5 修改 `src/persistence/index.ts`，确保 `pointLabels` 在 workspace 导入时兼容旧数据（默认 `[]`）

## 9. 单点标签工具（#7）— UI 和交互

- [x] 9.1 创建 `src/components/chart/PointLabelOverlay.tsx`，实现：放置模式下点击放置标签（计算最上方曲线 maxY 位置）、absolute 定位的编辑浮层、非放置模式下的拖拽交互（pointerdown/move/up）
- [x] 9.2 修改 `src/components/chart/WaterfallChart.tsx`，在 ReactECharts 同级渲染 PointLabelOverlay，传入坐标转换函数和曲线数据
- [x] 9.3 修改 `src/components/toolbar/Toolbar.tsx`，添加"点标签"按钮，实现与大括号模式的互斥切换

## 10. 单点标签工具（#7）— 导出

- [x] 10.1 修改 `src/components/chart/exportImage.ts`，在导出 SVG 层中增加 pointLabels 的渲染（标签框 + 竖线 + 圆点）

## 11. 集成验证

- [x] 11.1 加载多条曲线，验证 CurveList 色点颜色与图表曲线颜色一致
- [x] 11.2 设置基准线，确认 CurveList 中不再显示 ★ 标记
- [x] 11.3 拖动层间距滑条，确认无负值、粒度精细、样式美观
- [x] 11.4 切换网格/坐标轴开关，确认图表实时更新；导出图片确认无网格/坐标轴
- [x] 11.5 放置大括号，确认新 I-beam 样式；编辑弹窗确认 absolute 浮层样式
- [x] 11.6 放置大括号，确认位于最高曲线上方适当位置
- [x] 11.7 使用点标签工具：点击放置 → 输入文字 → 拖拽移动 → 导出图片包含标签
