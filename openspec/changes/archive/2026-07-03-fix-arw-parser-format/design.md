## Context

当前 `detectFormat.ts` 的格式检测逻辑基于简单测试文件设计（[test/sample_tags.arw](test/sample_tags.arw)），元数据为纯文本单值行（`SampleA`、`254nm`），数据从第 3 行开始。真实 Waters Empower ARW 文件格式为：

- 元数据段：`"Key"\t"Value"` 格式的引号包裹 key-value 对，行数不定（empower_raw3570.arw 有 7 行）
- 数据段：`time\tvalue` 双列 tab 分隔数值，使用科学计数法

当前 `FormatInfo` 的 `tags: string[]` 扁平模型无法表达 key-value 结构。`findDataStartLine` 硬编码 5 行采样窗口，`isCommentLine` 不识别以 `"` 开头的行，`isTagLine` 拒绝含 tab 的行。

修改范围限于 `src/parser/` 和 `src/types/curve.ts`，不涉及 UI 层或数据引擎层。不保留对旧格式的向后兼容。

## Goals / Non-Goals

**Goals:**
- 正确识别 ARW 文件中的引号包裹 key-value 元数据行
- 在任意行数的元数据段后准确定位数据起始行
- 将元数据暴露为 `Record<string, string>` 供下游使用
- 用 `metadata` 字段完全替换 `tags` 字段

**Non-Goals:**
- 不修改 ECharts 渲染、对齐算法、UI 组件
- 不支持多通道 ARW 文件（当前数据为单通道 PDA 220nm）
- 不处理元数据中的数组或嵌套结构
- 不做文件编码检测（假定 UTF-8 或 ASCII）
- 不保留对旧 `.txt`、`.csv`、简单 `.arw` 格式的兼容

## Decisions

### Decision 1: `ParsedFile` 用 `metadata?: Record<string, string>` 替换 `tags` 字段

- **选择**: 删除 `tags`，新增 `metadata` 字段存放 key-value 对
- **备选方案**: 保留 `tags` 与 `metadata` 共存 → 拒绝，用户明确不需要向后兼容
- **理由**: 简化数据模型，下游只需关注一个元数据来源。`FormatInfo` 同步替换

### Decision 2: 扩大 `findDataStartLine` 搜索范围到全文件

- **选择**: 将 `findDataStartLine` 的搜索范围从 `sampleLines`（前 5 行）改为全部 `lines`
- **备选方案**: 将采样窗口从 5 扩大到 20 → 拒绝，同样有上限问题
- **理由**: 真实 ARW 文件的元数据行数因仪器方法和采集参数而异，无固定上限。全文件扫描开销可忽略（O(n) 单次遍历，n ~ 5000 行）

### Decision 3: `isCommentLine` 增加对引号开头的识别

- **选择**: 在 `isCommentLine` 中增加 `trimmed.startsWith('"')` 判断
- **备选方案**: 新增独立的 `isMetadataLine` 函数 → 拒绝，过度设计
- **理由**: 以 `"` 开头的行在 ARW 格式中始终是元数据，不是数据

### Decision 4: `extractTags` 重构为 `extractMetadata`，返回 `Record<string, string>`

- **选择**: 重命名函数，只处理 `"Key"\t"Value"` 格式，返回纯字典
- **理由**: 不再需要区分 tags 和 metadata，单一返回类型更简洁

## Risks / Trade-offs

- **全文件扫描性能**: 对于异常大的文件（>100k 行），全文件扫描可能增加 ~10ms 开销 → 实际 ARW 文件通常 <10k 行，可忽略
- **引号检测误判**: 如果未来有数据文件以 `"` 开头 → 极低概率，科学数据文件不会以引号开头
- **`detectDelimiter` 仍只采样前 5 行**: 元数据行含 tab 可能影响统计但不影响结果（tab 仍占多数）→ 暂不修改，保持简单