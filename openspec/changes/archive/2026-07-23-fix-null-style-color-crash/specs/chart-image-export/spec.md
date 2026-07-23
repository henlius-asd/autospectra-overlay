## ADDED Requirements

### Requirement: 图片导出对 null 标注颜色具有鲁棒性

PNG 导出 SHALL 在 `resolveLabelStyle` 返回的 `resolved.color` 为 `null` 时不会崩溃。当 brace 或点标签的 `labelStyle.color` 为显式 `null` 时，resolver SHALL 回落全局默认颜色，使导出正常完成。

#### Scenario: 标注颜色为 null 时 PNG 导出成功

- **WHEN** 某个 brace 的 `labelStyle.color` 为显式 `null`（如经 JSON 工作区导入）且用户触发 PNG 导出
- **THEN** 导出正常完成，标注使用全局默认颜色，不出现导出失败提示