## MODIFIED Requirements

### Requirement: 元数据展示面板

右侧栏顶部 SHALL 显示元数据展示面板（MetadataPanel）。当用户选中某条曲线时，面板 SHALL 显示该曲线对应文件的 metadata 键值对列表（包含 `fileName` 在内的所有键）。面板标题行 SHALL 显示该曲线的显示名称（按回退链 `displayName → name(SampleName) → fileName`）。默认不选中任何曲线时，面板 SHALL 显示占位提示。

#### Scenario: 默认占位提示

- **WHEN** 右侧栏展开，未选中任何曲线
- **THEN** MetadataPanel 显示"点击曲线查看元数据"或类似的占位提示

#### Scenario: 点击曲线显示元数据

- **WHEN** 用户在曲线列表中点击某条曲线行（非双击、非 checkbox）
- **THEN** 该曲线被选中（`selectedCurveId` 更新），MetadataPanel 标题显示该曲线显示名称，列表显示该曲线的 metadata 键值对（含 `fileName`）

#### Scenario: ARW 曲线显示完整元数据

- **WHEN** 用户选中一条 ARW 文件解析出的曲线
- **THEN** MetadataPanel 列出 `SampleName`、`Channel Description`、`fileName` 等所有元数据键值对

#### Scenario: 切换选中曲线

- **WHEN** 用户点击另一条曲线行
- **THEN** `selectedCurveId` 更新为新曲线 ID，MetadataPanel 内容切换为新曲线的 metadata

#### Scenario: 取消选中

- **WHEN** 用户再次点击已选中的曲线行
- **THEN** `selectedCurveId` 设为 null，MetadataPanel 恢复占位提示
