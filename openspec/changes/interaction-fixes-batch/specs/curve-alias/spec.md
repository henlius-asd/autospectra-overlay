## MODIFIED Requirements

### Requirement: 曲线原始名称与显示名称

每条曲线 SHALL 拥有原始名称（`name`，对应 ARW 元数据 `SampleName`，作为唯一标识符）和可选的显示名称（`displayName`，用于图表区分各曲线）。原始名称 SHALL 不可修改，显示名称 SHALL 可编辑。曲线在列表与图例中的显示名称 SHALL 按回退链确定：`displayName` → `name`（即 `SampleName`）→ `metadata.fileName`。

#### Scenario: SampleName 存在时作为原始名称

- **WHEN** 解析 ARW 文件且其 metadata 含 `SampleName`
- **THEN** `CurveData.name` 设为 `SampleName` 的值，列表与图例在未设 `displayName` 时显示该 `SampleName`

#### Scenario: SampleName 缺失时回退文件名

- **WHEN** 解析的文件无 `SampleName` 元数据（如非 ARW 文件）
- **THEN** `CurveData.name` 回退为去扩展名的文件名，列表与图例显示该文件名

#### Scenario: 设置显示名称

- **WHEN** 用户为曲线设置 `displayName`
- **THEN** 曲线列表和图表图例使用 `displayName` 显示，原始名称保留在 `name` 中不变

#### Scenario: 清除显示名称

- **WHEN** 用户清除曲线的 `displayName`（设为空字符串）
- **THEN** 曲线列表和图表图例回退显示 `name`（`SampleName` 或文件名）

## ADDED Requirements

### Requirement: 文件名作为元数据保留

解析器 SHALL 将原始文件名（含扩展名）存入 `CurveData.metadata.fileName`，作为元数据的一部分持久保留。

#### Scenario: ARW 文件名入元数据

- **WHEN** 解析名为 `empower_raw3570.arw` 的 ARW 文件
- **THEN** 每条 `CurveData.metadata` 含 `fileName: "empower_raw3570.arw"`，且 `SampleName` 等其他元数据键同时保留
