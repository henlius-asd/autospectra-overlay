## ADDED Requirements

### Requirement: 文本框尺寸从字号换算

PPTX 中所有 `addText` 的文本框宽度(w)和高度(h) SHALL 从 PPT 字号(`fontSize`)直接换算为英寸,SHALL NOT 经过图表像素到幻灯片的缩放因子(`scale`)。换算公式: `w = charCount × fontSize × 0.55 / 72`, `h = fontSize × 1.5 / 72`。文本框位置(x, y) SHALL 仍使用缩放因子定位。

#### Scenario: 标签文字在文本框内正常显示不堆叠

- **WHEN** 用户导出包含大括号标签或点标签的 PPTX
- **THEN** 标签文字水平排列,中文字符不竖向堆叠,英文单词不换行

#### Scenario: 文本框宽度与字号成比例

- **WHEN** 标签字号为 10pt,文字为 3 个字符
- **THEN** 文本框宽度 ≥ 3 × 10 × 0.55 / 72 ≈ 0.23 英寸,高度 ≥ 10 × 1.5 / 72 ≈ 0.21 英寸

### Requirement: 轴名与图例文字宽度自适应

轴名(如"时间"/"强度")、刻度标签、图例文字的文本框宽度 SHALL 根据实际文字内容和字号计算,SHALL NOT 使用固定像素值。

#### Scenario: 图例文字完整显示

- **WHEN** 曲线名称为 20 个字符,字号为 8pt
- **THEN** 图例文本框宽度 ≥ 20 × 8 × 0.55 / 72 ≈ 1.22 英寸,文字完整显示不截断