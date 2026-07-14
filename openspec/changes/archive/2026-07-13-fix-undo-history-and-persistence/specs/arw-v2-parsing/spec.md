# arw-v2-parsing Delta

## ADDED Requirements

### Requirement: V2 转换剥离 UTF-8 BOM

系统 SHALL 在 `transformEmpowerV2ToV1` 归一化行尾之前，剥离文件起始位置的 UTF-8 BOM（U+FEFF）。BOM 剥离 SHALL 与 `parseFileContent` 入口的行为一致，使用显式 Unicode 转义（`/^\uFEFF/`）以避免字面 BOM 字符在源码编辑/传输中丢失。BOM 剥离 SHALL 在行尾归一化与行分割之前执行，确保 BOM 不附着于首行内容。

#### Scenario: V2 文件含 UTF-8 BOM

- **WHEN** 输入 V2 `.arw` 文件首字节为 UTF-8 BOM（`EF BB BF`），其后为标准 V2 内容
- **THEN** `transformEmpowerV2ToV1` 产出的 V1 文本首行不以 BOM 开头，元数据解析与数据解析结果与无 BOM 时完全一致

#### Scenario: V2 文件不含 BOM

- **WHEN** 输入 V2 文件不含 BOM
- **THEN** BOM 剥离为 no-op，解析结果不变
