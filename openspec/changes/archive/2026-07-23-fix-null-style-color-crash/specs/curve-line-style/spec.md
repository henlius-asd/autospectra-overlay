## MODIFIED Requirements

### Requirement: 曲线线条样式级联模型

系统 SHALL 采用级联模型解析每条曲线的线条样式：全局默认 `LineStyle`（`width`/`type`/`color`）存放于 `uiStore`，每条曲线可持有 `CurveData.lineStyle?: Partial<LineStyle>` 覆盖对象。渲染时 SHALL 通过纯函数 `resolveLineStyle(override, defaultStyle)` 按字段合并——覆盖对象中存在的字段优先，缺失字段回落全局默认。**覆盖对象中值为显式 `null` 的字段 SHALL 视为未覆盖，回落全局默认。**`addCurves` 创建新曲线时 SHALL NOT 设置 `lineStyle` 或顶层 `color`，使新曲线完全走全局默认。

#### Scenario: 全局改粗细对所有曲线生效

- **WHEN** 用户在「曲线样式」面板将全局粗细从 1.5 改为 3
- **THEN** 所有未覆盖粗细的曲线渲染粗细变为 3；覆盖了粗细的曲线保持其覆盖值

#### Scenario: 单曲线覆盖粗细不影响其他曲线

- **WHEN** 用户选中曲线 A 并取消勾选「使用全局默认·粗细」，设为 2
- **THEN** 仅曲线 A 渲染粗细为 2，其他曲线仍为全局默认值

#### Scenario: 新建曲线走全局默认

- **WHEN** 用户导入新曲线（全局默认颜色为 `#000000`、粗细 1.5、线型 solid）
- **THEN** 新曲线渲染为黑色、粗细 1.5、实线，无单独覆盖对象

#### Scenario: 覆盖颜色为 null 时回落全局默认

- **WHEN** 某曲线 `lineStyle` 覆盖对象中 `color` 字段为显式 `null`（如经 JSON 导入或旧版本迁移引入）
- **THEN** 该曲线渲染颜色为全局默认颜色，不会因 null 导致渲染异常或 PPTX 导出 crash