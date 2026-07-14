## ADDED Requirements

### Requirement: 图例仅以线条颜色表示

图表图例 SHALL 仅以线条颜色表示每条曲线：图例 marker SHALL 为线段（`icon: 'line'`），SHALL NOT 显示圆点/圆圈图标。图例线段颜色 SHALL 与对应曲线的线条颜色（`curve.color`）完全一致。图例 SHALL 仅在可见曲线数大于 1 时显示。

#### Scenario: 图例无圆点且颜色与曲线一致

- **WHEN** 图表加载多条可见曲线
- **THEN** 图例每项显示为一段细线段，颜色与对应曲线相同，不出现圆点图标

#### Scenario: 单条曲线时不显示图例

- **WHEN** 仅一条可见曲线
- **THEN** 图例不显示

### Requirement: 导出可选含图例

系统 SHALL 提供"导出含图例"开关（`exportWithLegend`，默认关闭）。PNG 与 PPTX 导出 SHALL 遵循该开关：开启时导出含图例（同样 `icon:'line'`、颜色与曲线一致、无圆点）；关闭时导出不含图例（保持现状）。

#### Scenario: 默认导出不含图例

- **WHEN** 用户未开启"导出含图例"并导出 PNG
- **THEN** 导出图不含图例

#### Scenario: 开启后导出含图例

- **WHEN** 用户勾选"导出含图例"并导出
- **THEN** 导出图含图例，每项为线段、颜色与曲线一致、无圆点

### Requirement: 图例开关持久化

`exportWithLegend` SHALL 存于 uiStore 并通过 localForage 持久化到 IndexedDB，纳入 workspace JSON。

#### Scenario: 刷新后图例开关保留

- **WHEN** 用户开启"导出含图例"后刷新页面
- **THEN** 该开关仍为开启
