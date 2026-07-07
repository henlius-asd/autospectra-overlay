## Why

近期导出的 Waters Empower ARW 文件（`raw_data/empower_raw2407.arw`）采用了与旧版完全不同的文件结构：元数据不再以 `"Key"\t"Value"` 形式存在，而是以"下一行行首为上一键的值、同行尾部为下一个键"的串联方式书写；行分隔符由 `\r` 变为 `\r\r\n`；数据区由 TAB 分隔变为空格分隔。当前解析器（`src/parser/parseFile.ts` + `detectFormat.ts`）假设旧版结构，遇到新文件会因"检测不到 metadata / 识别不到列分隔符"而直接抛 `ParseError`。需要扩展解析器以同时兼容新旧两种格式，并保证旧格式的解析行为不回归。

## What Changes

- **新增 ARW V2 格式识别**：在 `detectFormat.ts` 增加 `isEmpowerV2(lines)` 探测函数（基于"无引号、无 TAB、头部多行纯文本、后续两列数值"等特征）。
- **新增 V2 解析分支**：在 `parseFile.ts` 的 `parseFileContent` 中检测到 V2 后分发给新函数 `parseEmpowerV2`。
- **V2 元数据重组算法**：按 7 个已知 key（`SampleName` / `Channel Description` / `Date Acquired` / `Det. Units` / `Acq Method Set` / `Instrument Method Name` / `Comments`）的顺序扫描头部非数值行，将下一行的头部文本作为当前 key 的值、同行尾部的文本作为下一个 key 的起始；`Comments` 之后的 `Run samples <数值>` 拆分为 `Comments=Run samples` 与新增的 `SamplingInterval=<数值>`。
- **`SamplingInterval` 字段**：作为新增的 metadata 键写入 `ParsedFile.metadata` 与每条 `CurveData.metadata`。
- **曲线命名统一**：V2 下单曲线命名继续使用 `SampleName`（与旧格式行为一致），不使用 `Channel Description`。
- **回归保护**：旧版 ARW（`empower_raw3570/3574/3578.arw`）解析路径保持不变；新增单元测试覆盖 V2 的正常解析、metadata 完整性、曲线命名。

## Capabilities

### New Capabilities
- `arw-v2-parsing`: 识别并解析 Waters Empower ARW V2 导出结构（无引号行串联式元数据 + 空格分隔数据 + `SamplingInterval` 字段），并在 `ParsedFile` / `CurveData` 的 metadata 中保留所有已知键。

### Modified Capabilities
- `arw-metadata-parsing`: 明确该能力覆盖"V1 `"Key"\t"Value"` 格式"；新增对"V2 格式走独立解析分支、不经过 `detectFormat` 的 `extractMetadata`"的约束说明，避免两套规则混淆。
- `robust-data-detection`: 增加一条约束——当识别为 ARW V2 时，跳过 `detectDelimiter` / `findDataStartLine` 的通用逻辑，使用 V2 专用探测路径。

## Impact

- **代码**：`src/parser/detectFormat.ts`、`src/parser/parseFile.ts`、`src/parser/__tests__/parseFile.test.ts`。
- **类型**：不变（`ParsedFile.metadata` 已是 `Record<string, string>`，可直接容纳 `SamplingInterval`）。
- **上游消费方**：`FileUpload`、`LeftPanel`、`metadata-panel` 等已使用 `metadata` 字段的组件无需修改，自动展示新增的 `SamplingInterval`。
- **依赖**：无新增。
- **破坏性变更**：无。
