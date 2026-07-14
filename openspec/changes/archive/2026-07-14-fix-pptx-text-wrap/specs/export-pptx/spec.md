## ADDED Requirements

### Requirement: 文本框禁止换行

PPTX 中所有 `addText` 文本框 SHALL 设置 `wrap: false`,生成 `wrap="none"`。文字 SHALL 保持单行,不换行、不竖向堆叠。文字宽度超出文本框时 SHALL 横向溢出(可见,不裁剪)。

#### Scenario: 中文标签保持单行横向排列

- **WHEN** 用户导出包含中文标签(大括号/点标签)的 PPTX 并在 PowerPoint 中查看
- **THEN** 标签文字横向排列,中文字符不竖向堆叠,不换行

#### Scenario: 英文长标签不换行

- **WHEN** 图例文字为 20 个字符的英文名
- **THEN** 文字保持单行,不换行