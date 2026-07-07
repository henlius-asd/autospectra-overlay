## Why

当前 y 轴 `max` 精确等于最高曲线顶点的数据值，曲线占满整个 y 轴高度，区域标签（brace）和点标签（point label）被挤到图表顶部边缘甚至被裁切，没有专用空间显示。

## What Changes

- 在 y 轴顶部预留 15% 比例区域作为标签专用空间
- `yMaxForAxis` 在不动点公式结果上乘以 `(1 + 0.15)`，曲线顶点占 y 轴约 87%，顶部 13% 留给标签
- `maxY`（用于标签定位）同步增加相同 buffer，确保标签落在预留区域内
- 网站渲染（WaterfallChart.tsx）和导出渲染（exportImage.ts）使用相同的 buffer 系数

## Capabilities

### New Capabilities

（无新增 capability）

### Modified Capabilities

- `auto-layering`: y 轴显式边界计算增加标签预留区域，曲线不再占满 y 轴全高
- `brace-tool`: 标签定位的 `maxY` 增加相同 buffer，确保标签始终落在预留的顶部区域内

## Impact

- **修改文件**: `src/components/chart/WaterfallChart.tsx`（option useMemo 中的 `yMaxForAxis`、maxY useMemo）、`src/components/chart/exportImage.ts`（maxY 计算）
- **依赖**: 无新增依赖
- **向后兼容**: 无 breaking change，仅调整 y 轴可视范围比例
