# metadata-panel Specification

## Purpose
右侧栏元数据展示面板。选中曲线后显示对应文件的 metadata 键值对，支持切换曲线。

## ADDED Requirements

### Requirement: 元数据展示面板

右侧栏顶部 SHALL 显示元数据展示面板（MetadataPanel）。当用户选中某条曲线时，面板 SHALL 显示该曲线对应文件的 metadata 键值对。默认不选中任何曲线时，面板 SHALL 显示占位提示。

#### Scenario: 默认占位提示

- **WHEN** 右侧栏展开，未选中任何曲线
- **THEN** MetadataPanel 显示"点击曲线查看元数据"或类似的占位提示

#### Scenario: 点击曲线显示元数据

- **WHEN** 用户在曲线列表中点击某条曲线行（非双击、非 checkbox）
- **THEN** 该曲线被选中（`selectedCurveId` 更新），MetadataPanel 显示该曲线对应的 metadata 键值对列表

#### Scenario: 无 metadata 的曲线

- **WHEN** 用户选中的曲线没有 metadata 字段
- **THEN** MetadataPanel 显示"该曲线无元数据"提示

#### Scenario: 切换选中曲线

- **WHEN** 用户点击另一条曲线行
- **THEN** `selectedCurveId` 更新为新曲线 ID，MetadataPanel 内容切换为新曲线的 metadata

#### Scenario: 取消选中

- **WHEN** 用户再次点击已选中的曲线行
- **THEN** `selectedCurveId` 设为 null，MetadataPanel 恢复占位提示

### Requirement: 元数据传递

文件解析器 SHALL 将解析出的 metadata 从 `ParsedFile` 层级传递到每个 `CurveData` 中。`CurveData` 类型 SHALL 新增 `metadata?: Record<string, string>` 字段。

#### Scenario: 解析含 metadata 的 .arw 文件

- **WHEN** 解析包含标签头的 .arw 文件
- **THEN** 解析出的 metadata 键值对被存储在每条 `CurveData.metadata` 中

#### Scenario: 解析无 metadata 的文件

- **WHEN** 解析不含标签头的 .txt 或 .csv 文件
- **THEN** `CurveData.metadata` 为 undefined