# metadata-panel Delta Specification

## Purpose
更新曲线选中机制：统一为单一 `selectedCurveId`，新增图表渲染区点击选中（不再仅限列表点击）。删除 `activeScaledCurveId`。

## MODIFIED Requirements

### Requirement: 元数据展示面板

右侧栏顶部 SHALL 显示元数据展示面板（MetadataPanel）。当用户选中某条曲线时，面板 SHALL 显示该曲线对应文件的 metadata 键值对。默认不选中任何曲线时，面板 SHALL 显示占位提示。选中态 SHALL 由 `selectedCurveId` 统一驱动，不再有 `activeScaledCurveId`。

#### Scenario: 默认占位提示

- **WHEN** 右侧栏展开，未选中任何曲线
- **THEN** MetadataPanel 显示"点击曲线查看元数据"或类似的占位提示

#### Scenario: 列表点击曲线显示元数据

- **WHEN** 用户在曲线列表中点击某条曲线行（非双击、非 checkbox）
- **THEN** `selectedCurveId` 更新，MetadataPanel 显示该曲线对应的 metadata 键值对列表

#### Scenario: 图表渲染区点击曲线显示元数据

- **WHEN** 用户在图表渲染区点击某条曲线
- **THEN** `selectedCurveId` 更新为该曲线 ID，MetadataPanel 显示该曲线对应的 metadata 键值对列表

#### Scenario: 无 metadata 的曲线

- **WHEN** 用户选中的曲线没有 metadata 字段
- **THEN** MetadataPanel 显示"该曲线无元数据"提示

#### Scenario: 切换选中曲线

- **WHEN** 用户点击另一条曲线（列表或图表）
- **THEN** `selectedCurveId` 更新为新曲线 ID，MetadataPanel 内容切换为新曲线的 metadata

#### Scenario: 取消选中

- **WHEN** 用户再次点击已选中的曲线（列表或图表）
- **THEN** `selectedCurveId` 设为 null，MetadataPanel 恢复占位提示

### Requirement: ECharts series 点击选中

ECharts 系列 SHALL 设置 `id` 字段为曲线 store ID（确保唯一性，不依赖可能重名的 `name`）。`onEvents` SHALL 包含 `click` 处理器，点击系列时 SHALL 调用 `setSelectedCurveId(params.seriesId)`。

#### Scenario: 点击曲线选中

- **WHEN** 用户在图表中点击某条曲线的系列
- **THEN** `selectedCurveId` 设为该系列的 `id`，元数据面板更新

#### Scenario: 点击空白区域不选中

- **WHEN** 用户在图表中点击非曲线区域
- **THEN** `selectedCurveId` 不变