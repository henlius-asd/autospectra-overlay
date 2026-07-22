## MODIFIED Requirements

### Requirement: 标注样式与屏幕一致

PPTX 中的点标签与区间标签 SHALL 读取与屏幕同一 `labelStyle`（字号、字体、字重、颜色、背景色）。每条曲线折线 shape 与图例 SHALL 读取级联解析后的线条样式（`resolveLineStyle(curve.lineStyle, globalLineStyle)`）：粗细、线型、颜色 SHALL 与屏幕一致。线型 SHALL 通过 `mapLineTypeToPptxDash` 映射为 PPTX dashType（`solid`→省略、`dashed`→`dash`、`dotted`→`dot`）。

#### Scenario: 标签字号跟随样式设置

- **WHEN** 用户将默认标签字号设为 14 后导出 PPTX
- **THEN** PPT 中标签文本框字号为 14

#### Scenario: 曲线粗细与屏幕一致

- **WHEN** 用户将某曲线粗细覆盖为 2.5 后导出 PPTX
- **THEN** PPT 中该曲线折线 shape 的线宽与屏幕一致（2.5 对应的 PPT 宽度）

#### Scenario: 曲线线型与屏幕一致

- **WHEN** 用户将某曲线线型设为 `dashed` 后导出 PPTX
- **THEN** PPT 中该曲线折线 shape 使用虚线 dashType，与屏幕渲染一致

#### Scenario: 全局默认颜色在 PPTX 中生效

- **WHEN** 用户将全局默认颜色设为红色、某曲线未覆盖颜色，导出 PPTX
- **THEN** PPT 中该曲线折线 shape 与图例色块为红色，与屏幕一致
