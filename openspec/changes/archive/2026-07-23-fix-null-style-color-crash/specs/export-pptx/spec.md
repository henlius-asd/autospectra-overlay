## ADDED Requirements

### Requirement: 导出对 null 样式颜色具有鲁棒性

PPTX 导出 SHALL 在 `resolveLineStyle` 或 `resolveLabelStyle` 返回的 `resolved.color` 为 `null` 时不会崩溃。当 override 中 `color` 字段为 `null` 时，resolver SHALL 回落全局默认颜色，使导出正常完成而非静默 toast 失败。

#### Scenario: 曲线覆盖颜色为 null 时导出成功

- **WHEN** 某条曲线 `lineStyle.color` 为显式 `null`（如经 JSON 工作区导入）且用户点击导出 PPTX
- **THEN** 导出正常完成，生成 `chromatogram.pptx` 文件，该曲线使用全局默认颜色，不出现「导出 PPTX 失败」toast

#### Scenario: 标注覆盖颜色为 null 时导出成功

- **WHEN** 某个 brace 或点标签的 `labelStyle.color` 为显式 `null` 且用户导出 PPTX
- **THEN** 导出正常完成，标注使用全局默认颜色，不崩溃

## MODIFIED Requirements

### Requirement: 标注样式与屏幕一致

PPTX 中的点标签与区间标签 SHALL 读取与屏幕同一 `labelStyle`（字号、字体、字重、颜色、背景色）。每条曲线折线 shape 与图例 SHALL 读取级联解析后的线条样式（`resolveLineStyle(curve.lineStyle, globalLineStyle)`）：粗细、线型、颜色 SHALL 与屏幕一致。线型 SHALL 通过 `mapLineTypeToPptxDash` 映射为 PPTX dashType（`solid`→省略、`dashed`→`dash`、`dotted`→`dot`）。**`resolveLineStyle` 和 `resolveLabelStyle` 的 null 回落行为 SHALL 在导出中生效——override 中的显式 null 字段回落默认值，不会导致导出 crash。**

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

#### Scenario: null 覆盖颜色回落全局默认后导出成功

- **WHEN** 某曲线 `lineStyle.color` 为 `null`，全局默认颜色为 `#000000`，用户导出 PPTX
- **THEN** PPT 中该曲线折线 shape 颜色为 `#000000`，导出正常完成不崩溃