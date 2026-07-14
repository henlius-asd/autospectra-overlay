# file-parser Delta Specification

## MODIFIED Requirements

### Requirement: 文件头跳过与元数据标签解析

系统 SHALL 自动跳过以 `#`、`//`、`[`、字母开头的注释/元数据行。以首个纯数字数据行为标签区与数据区的分界。`ParsedFile` 不包含 `tags` 字段；字母起始行被归类为注释/元数据行并跳过，仅 `"key"\t"value"` 格式的引号行进入 `metadata`。

#### Scenario: 带 # 注释行的文件

- **WHEN** 文件前 2 行为 `# Instrument: HPLC`, `# Date: 2024-01-15`，第 3 行起为数据
- **THEN** 注释行被跳过，数据从第 3 行开始解析

## REMOVED Requirements

### Requirement: 表头检测
**Reason**: There is no header detection. Letter-starting lines (e.g., `Time,ChannelA,ChannelB`) are classified as comment/metadata lines by `isCommentLine` (which matches `/^[a-zA-Z]/`) and are skipped. The `detectHeader` function only checks lines that are neither numeric nor comment-classified, so header rows starting with a letter are never detected as headers.

**Migration**: Remove the `Requirement: 表头检测` block and its scenarios from the main spec. Column names are auto-generated as `Time, Channel1, Channel2, ...` based on column count. No header row parsing occurs.

### Requirement: 文件头跳过与元数据标签解析 — Scenario "带字符串标签头的 .arw 文件" and `tags: string[]` field
**Reason**: The `tags: string[]` field does not exist in the `ParsedFile` type. Bare letter-starting lines are treated as comments/metadata and skipped; they are not collected into a `tags` array. Only `"key"\t"value"` quoted lines enter metadata.

**Migration**: Remove the `tags: string[]` field and the scenario about string tag headers from the main spec. Letter-starting lines are skipped uniformly with other comment lines. Any downstream code reading `tags` from `ParsedFile` MUST be removed.