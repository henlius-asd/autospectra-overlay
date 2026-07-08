## Why

用户在叠图分析中反馈三个核心交互痛点：(1) 无法对单条曲线进行独立的 Y 轴缩放，只能调整曲线间距，限制了对比分析能力；(2) 所有曲线使用固定调色板自动分配颜色，用户无法自定义，且颜色随曲线增删/排序而漂移；(3) 坐标轴默认渲染占用视觉空间，且用户实际使用中关注的是曲线相对关系而非绝对数值。这三个问题直接影响色谱图叠图对比的核心工作流效率和视觉体验。

## What Changes

- **Y 轴缩放工具**：新增 "Y缩放" 工具栏模式，在图表区域点击曲线选中后，通过拖拽峰值处手柄实时拉伸/压缩单条曲线的 Y 轴比例，不同曲线可有独立缩放倍率（0.1x–10x）
- **曲线颜色自定义**：所有曲线默认渲染为黑色，曲线列表中每条曲线左侧显示颜色色块，点击可弹出颜色选择器自定义颜色，颜色随曲线持久化（工作区导出/导入保留）
- **默认隐藏坐标轴**：`showAxes` 默认值从 `true` 改为 `false`，坐标轴默认不渲染，用户可通过工具栏 "坐标轴" 按钮手动开启。坐标轴相关代码标记为待弃用

## Capabilities

### New Capabilities
- `y-scale-tool`: 工具栏新增 "Y缩放" 模式，在图表区域通过点击选中曲线并拖拽峰值手柄实现独立 Y 轴缩放，支持 per-curve 缩放倍率存储与渲染
- `curve-color-customization`: 曲线默认黑色，用户可通过曲线列表中的颜色色块自定义每条曲线的颜色，颜色持久化到工作区

### Modified Capabilities
- `auto-layering`: Y 轴范围计算需考虑每条曲线的独立缩放因子，`computeYAxisRange` 接口变更以接收 `curveScales` 参数
- `state-management`: 新增 `curveScales`、`yScaleToolMode`、`activeScaledCurveId` 状态字段，`CurveData` 新增 `color` 字段
- `chart-image-export`: 导出图片时需同步应用 per-curve 缩放因子，与屏幕渲染保持一致

## Impact

- **状态层**：`curveStore.ts` 新增 `curveScales` 记录和 `setCurveScale` action；`uiStore.ts` 新增 `yScaleToolMode` 和 `activeScaledCurveId`；`CurveData` 类型新增 `color` 字段
- **渲染层**：`WaterfallChart.tsx` 数据渲染路径从 `y + offset` 改为 `y * scale + offset`；`computeYAxisRange.ts` 接口扩展接收 `curveScales`；`labelGeometry.ts` 同步更新
- **导出层**：`exportImage.ts` 镜像渲染逻辑
- **UI 层**：`Toolbar.tsx` 新增 "Y缩放" 按钮；`CurveList.tsx` 色块改为颜色选择器；新增 `ScaleHandle.tsx` 覆盖层组件
- **工作区序列化**：`Toolbar.tsx` 导出/导入逻辑需包含 `curveScales` 和 `color` 字段
- **向后兼容**：`curveScales` 默认值 1.0 保证旧工作区数据正常渲染；`color` 默认 `#000000` 保证旧曲线正常显示；`showAxes` 默认值变更为 **BREAKING** 视觉变更