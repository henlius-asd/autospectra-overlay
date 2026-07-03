## Why

当前 ARW 文件解析器是为简单测试格式（纯文本单值 tag + 数值数据）设计的，无法正确解析 Waters Empower 色谱数据系统导出的标准 `.arw` 文件。真实 ARW 文件使用引号包裹的 key-value 元数据段（`"Key"\t"Value"`），且元数据行数可能超过当前硬编码的 5 行采样窗口。这导致 `detectFormat` 无法正确识别数据起始行，`parseFileContent` 在解析时崩溃。用户需要能够导入真实的 Empower 原始数据文件进行色谱分析。

## What Changes

- **BREAKING**: 元数据模型从 `tags?: string[]` 替换为 `metadata?: Record<string, string>`，不再兼容旧的简单 tag 格式
- 新增带引号 key-value 元数据行的识别能力（`"Key"\t"Value"` 格式）
- 扩大 `findDataStartLine` 的搜索范围，从前 5 行扩展到全文件
- `isCommentLine` 增加对以 `"` 开头的行的识别
- 解析数据行前去除引号包裹的值
- 删除 `tags` 字段及相关逻辑，统一使用 `metadata` 字典
- 更新测试文件匹配真实 ARW 格式

## Capabilities

### New Capabilities
- `arw-metadata-parsing`: 解析 Waters Empower ARW 文件的引号包裹 key-value 元数据段，提取为结构化 metadata 字典
- `robust-data-detection`: 健壮的数据起始行检测，不限于前 5 行采样，正确跳过任意长度的元数据段

### Modified Capabilities
<!-- 无现有 spec 需要修改，项目尚无 openspec/specs/ -->

## Impact

- `src/parser/detectFormat.ts` — `detectFormat`、`isCommentLine`、`isTagLine`、`extractTags`、`findDataStartLine` 逻辑修改，`FormatInfo.tags` 替换为 `metadata`
- `src/parser/parseFile.ts` — `parseFileContent` 使用 `metadata` 替代 `tags`
- `src/types/curve.ts` — `ParsedFile` 类型 `tags` 字段替换为 `metadata`
- `test/sample_tags.arw` — 更新为真实 ARW 格式的测试用例