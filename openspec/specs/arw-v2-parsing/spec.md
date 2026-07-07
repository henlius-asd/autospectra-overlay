# arw-v2-parsing Specification

## Purpose
TBD - created by archiving change adapt-empower-arw-v2. Update Purpose after archive.
## Requirements
### Requirement: ARW V2 格式识别
系统 SHALL 在 `parseFileContent` 入口处对 `.arw` 文件执行 V2 探测；当以下条件全部满足时判定为 V2 并走独立解析分支：
1. 文件名（不区分大小写）以 `.arw` 结尾；
2. 前 20 行不含 `"` 字符；
3. 前 20 行不含 `\t` 字符；
4. 前 10 行中至少 5 行以已知 key 之一结尾（`SampleName` / `Channel Description` / `Date Acquired` / `Det. Units` / `Acq Method Set` / `Instrument Method Name` / `Comments`）；
5. 首个数值行按空格 split 后恰好得到 2 列。

#### Scenario: 典型 V2 文件被识别
- **WHEN** 输入文件为 `empower_raw2407.arw`，前 8 行为无引号无 TAB 的 key-value 串联行，第 9 行起为两列数值
- **THEN** 系统判定为 V2 格式，进入 `parseEmpowerV2` 分支，不走 `detectFormat` 的通用路径

#### Scenario: V1 文件不被误判为 V2
- **WHEN** 输入文件为 `empower_raw3570.arw`（含 `"Key"\t"Value"` 元数据 + TAB 分隔数据）
- **THEN** 系统不判定为 V2，继续走原有 `detectFormat` 路径

#### Scenario: 非 ARW 文件不触发 V2 探测
- **WHEN** 输入文件为 `data.csv` 或 `data.txt`
- **THEN** 系统不执行 V2 探测，直接走通用路径

### Requirement: V2 元数据重组
系统 SHALL 按 Empower 输出顺序固定的 7 个已知 key（`SampleName` / `Channel Description` / `Date Acquired` / `Det. Units` / `Acq Method Set` / `Instrument Method Name` / `Comments`）扫描头部非数值行，通过"行尾匹配当前期望 key"的方式把串联书写拆分为独立键值对，写入 `ParsedFile.metadata` 与每条 `CurveData.metadata`。

#### Scenario: 完整 7 key 解析
- **WHEN** V2 文件头部 8 行依次为：`SampleName` / `ASD-A-2604002-001 NR Channel Description` / `PDA - 220 nm Date Acquired` / `4/30/2026 11:54:06 PM CST Det. Units` / `au Acq Method Set` / `HLX109_TP_003_01_CE_153_IM Instrument Method Name` / `HLX109_TP_003_01_CE_153_IM Comments` / `Run samples 0.008333334`
- **THEN** `metadata` 包含：`SampleName=ASD-A-2604002-001 NR`、`Channel Description=PDA - 220 nm`、`Date Acquired=4/30/2026 11:54:06 PM CST`、`Det. Units=au`、`Acq Method Set=HLX109_TP_003_01_CE_153_IM`、`Instrument Method Name=HLX109_TP_003_01_CE_153_IM`、`Comments=Run samples`

#### Scenario: 跨行值累加
- **WHEN** 某 key 的值跨越多行（罕见但可能）
- **THEN** 多行内容以空格拼接为该 key 的完整值

#### Scenario: 无法匹配全部 key 时保留警告
- **WHEN** 头部行未能匹配到全部 7 个已知 key
- **THEN** 系统仍然返回已匹配的部分 metadata，并在 `metadata.__v2ParseWarning` 中记录未匹配到的 key 列表

### Requirement: SamplingInterval 字段写入 metadata
系统 SHALL 在 V2 解析时识别 `Run samples <数值>` 行，将该数值作为 `SamplingInterval` 写入 `ParsedFile.metadata` 与每条 `CurveData.metadata`。

#### Scenario: 标准科学计数法采样间隔
- **WHEN** 头部出现行 `Run samples 0.008333334`
- **THEN** `metadata.SamplingInterval` 为字符串 `"0.008333334"`

#### Scenario: 采样间隔以科学计数法表示
- **WHEN** 头部出现行 `Run samples 1.5e-3`
- **THEN** `metadata.SamplingInterval` 为 `"1.5e-3"`

#### Scenario: 采样间隔行缺失
- **WHEN** 头部不出现 `Run samples` 行
- **THEN** `metadata` 中不包含 `SamplingInterval` 字段，解析不报错

### Requirement: V2 曲线命名使用 SampleName
系统 SHALL 在 V2 分支下将 `CurveData.name` 设为 `metadata.SampleName`；若 `SampleName` 缺失，则回退到文件名去扩展名。

#### Scenario: 单曲线使用 SampleName
- **WHEN** V2 文件 `metadata.SampleName` 为 `ASD-A-2604002-001 NR`
- **THEN** 解析得到 1 条 `CurveData`，其 `name` 为 `ASD-A-2604002-001 NR`

#### Scenario: SampleName 缺失时回退到文件名
- **WHEN** V2 文件头部无法解析出 `SampleName`，文件名为 `empower_raw2407.arw`
- **THEN** `CurveData.name` 为 `empower_raw2407`

### Requirement: V2 数据区空格分隔解析
系统 SHALL 从首个数值行起以空白字符 split 每行，过滤空 token 后按两列解析为 `[time, value]` 数据点；任何非两列行 SHALL 被跳过或抛出含行号的 `ParseError`。

#### Scenario: 正常两列数据行
- **WHEN** 数据行为 `-3.30694e-05 0.01666667`
- **THEN** 解析为数据点 `[-3.30694e-05, 0.01666667]`

#### Scenario: 行首/行尾多余空格
- **WHEN** 数据行为 `  -3.30694e-05   0.01666667  `
- **THEN** 解析结果与无多余空格时一致

#### Scenario: 数据行非两列
- **WHEN** 某数据行 split 后不为 2 列
- **THEN** 系统抛出 `ParseError`，消息包含行号与该行内容

### Requirement: V2 行分隔符兼容
系统 SHALL 在 V2 分支下把 `\r\r\n`、`\r\n`、`\n` 均视为合法行分隔符，不依赖特定序列。

#### Scenario: `\r\r\n` 行分隔
- **WHEN** 文件使用 `\r\r\n` 作为行分隔（如 `empower_raw2407.arw`）
- **THEN** 解析结果与使用 `\n` 时完全一致

#### Scenario: 混合行分隔
- **WHEN** 文件中混用 `\r\n` 与 `\n`
- **THEN** 解析不报错，结果正确

