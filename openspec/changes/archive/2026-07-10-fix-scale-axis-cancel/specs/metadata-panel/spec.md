# metadata-panel Delta Specification

## Purpose
修复 ECharts click 事件中 `seriesId` 不可靠的问题：改用 `seriesIndex` 映射 `visibleIds` 获取正确的曲线 store ID。

## MODIFIED Requirements

### Requirement: ECharts series 点击选中

ECharts 系列 SHALL 设置 `id` 字段为曲线 store ID。`onEvents` SHALL 包含 `click` 处理器，点击系列时 SHALL 通过 `params.seriesIndex` 映射 `visibleIds[params.seriesIndex]` 获取曲线 ID，调用 `setSelectedCurveId(id)`。若 `seriesIndex` 无效或超出范围 SHALL 不操作。

#### Scenario: 点击曲线选中

- **WHEN** 用户在图表中点击某条曲线的系列
- **THEN** `selectedCurveId` 设为 `visibleIds[params.seriesIndex]`，元数据面板更新，曲线列表高亮与该曲线一致

#### Scenario: 点击空白区域不选中

- **WHEN** 用户在图表中点击非曲线区域
- **THEN** `seriesIndex` 为 undefined，`selectedCurveId` 不变