# arw-v2-parsing Delta Specification

## MODIFIED Requirements

### Requirement: V2 元数据重组
系统 SHALL 按 Empower 输出顺序固定的 7 个已知 key（`SampleName` / `Channel Description` / `Date Acquired` / `Det. Units` / `Acq Method Set` / `Instrument Method Name` / `Comments`）扫描头部非数值行，通过"行尾匹配当前期望 key"的方式把串联书写拆分为独立键值对，写入 `ParsedFile.metadata` 与每条 `CurveData.metadata`。每行仅对应一个 sequential key，不支持跨行值累加。

#### Scenario: 完整 7 key 解析
- **WHEN** V2 文件头部 8 行依次为：`SampleName` / `ASD-A-2604002-001 NR Channel Description` / `PDA - 220 nm Date Acquired` / `4/30/2026 11:54:06 PM CST Det. Units` / `au Acq Method Set` / `HLX109_TP_003_01_CE_153_IM Instrument Method Name` / `HLX109_TP_003_01_CE_153_IM Comments` / `Run samples 0.008333334`
- **THEN** `metadata` 包含：`SampleName=ASD-A-2604002-001 NR`、`Channel Description=PDA - 220 nm`、`Date Acquired=4/30/2026 11:54:06 PM CST`、`Det. Units=au`、`Acq Method Set=HLX109_TP_003_01_CE_153_IM`、`Instrument Method Name=HLX109_TP_003_01_CE_153_IM`、`Comments=Run samples`

#### Scenario: 无法匹配全部 key 时抛出错误
- **WHEN** 头部行未能匹配到全部 7 个已知 key（某行不以预期 key 结尾）
- **THEN** 系统 SHALL 抛出 `Error`，消息包含行号与失败行内容，不返回部分 metadata，不写入 `__v2ParseWarning` 字段

### Requirement: V2 数据区空格分隔解析
系统 SHALL 从首个数值行起以空白字符 split 每行，过滤空 token 后按两列解析为 `[time, value]` 数据点；任何非两列行 SHALL 被跳过并在 `__v2ParseWarnings` 中记录警告，同时通过 `console.warn` 输出。

#### Scenario: 正常两列数据行
- **WHEN** 数据行为 `-3.30694e-05 0.01666667`
- **THEN** 解析为数据点 `[-3.30694e-05, 0.01666667]`

#### Scenario: 行首/行尾多余空格
- **WHEN** 数据行为 `  -3.30694e-05   0.01666667  `
- **THEN** 解析结果与无多余空格时一致

#### Scenario: 数据行非两列
- **WHEN** 某数据行 split 后不为 2 列
- **THEN** 该行 SHALL 被跳过（不抛出 `ParseError`，不静默丢弃），且 SHALL 在 `ParsedFile.__v2ParseWarnings: Array<{line:number, content:string}>` 中追加一条警告，同时通过 `console.warn` 输出；警告对象包含行号（1-indexed）和原始行内容

## REMOVED Requirements

### Requirement: SamplingInterval 字段写入 metadata
**Reason**: The `Run samples <value>` tag does not exist in real ARW V2 files. The first data point's x-coordinate is used as the time coordinate of the first data point, not stored as a `SamplingInterval` metadata field.

**Migration**: Remove any code that looks for `Run samples` lines to extract `SamplingInterval`. The first numeric token in the transition line (line 7, containing `CommentsValue x1`) is parsed as `x1` — the first data point's time coordinate — and is used in the data pipeline, not in metadata. Downstream consumers that previously read `metadata.SamplingInterval` MUST instead obtain the first x-coordinate from `CurveData.data[0][0]`.

### Requirement: V2 跨行值累加（场景 "跨行值累加"）
**Reason**: The implementation uses one line per sequential key — there is no cross-line value accumulation. Each key-value pair is parsed from a single line.

**Migration**: Remove the "跨行值累加" scenario from the main spec. Each key's value is taken from a single contiguous segment on its line.