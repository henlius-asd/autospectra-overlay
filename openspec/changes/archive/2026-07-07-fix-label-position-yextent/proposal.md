## Why

区域标签（brace）和点标签（point label）在导出图片和网站渲染中位置错误——显示在曲线中间而非所有曲线的上方。根因是 `layerYOffset` 和 `maxY` 的计算使用了 store 中可能 stale 的 `yRange`，而像素转换使用的是 ECharts 实际的 `yExtent`，两个不同的 Y 轴范围混用导致标签像素位置偏移。

## What Changes

- 统一使用 ECharts 实际 `yExtent`（从 `getModel()` 读取）替代 store 中的 `yRange` 来计算 `layerYOffset` 和 `maxY`
- 网站渲染（WaterfallChart.tsx）和导出渲染（exportImage.ts）使用相同的正确计算逻辑
- 添加 resize 事件监听，确保窗口尺寸变化时 `yRange` 同步更新
- 区域标签和点标签始终定位在所有可见曲线的上方

## Capabilities

### New Capabilities

（无新增 capability，这是现有功能的 bug 修复）

### Modified Capabilities

- `auto-layering`: `layerYOffset` 计算公式的乘数因子从 store `yRange` 改为 ECharts 实际 `yExtent`，确保分层偏移量准确
- `brace-tool`: 区域标签 Y 坐标计算从 stale `yRange` 改为实际 `yExtent`，确保标签始终定位在所有曲线上方

## Impact

- **修改文件**: `src/components/chart/WaterfallChart.tsx`（series 渲染、maxY 计算、convertYToPixel）、`src/components/chart/exportImage.ts`（maxY 计算、brace/point label 定位）
- **可能新增**: resize 事件监听逻辑
- **依赖**: 无新增依赖，仅修改现有 ECharts API 的使用方式
- **向后兼容**: 无 breaking change，仅修正计算逻辑
