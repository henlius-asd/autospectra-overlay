## MODIFIED Requirements

### Requirement: 图例仅以线条颜色表示

图表图例 SHALL 使用 `icon: 'inherit'` 继承系列样式，同时展示线段和圆点符号。圆点颜色 SHALL 与对应曲线的线条颜色（`curve.color`）完全一致。曲线本身 SHALL NOT 渲染数据点圆点（`showSymbol: false`）。图例 SHALL 仅在可见曲线数大于 1 时显示。

#### Scenario: 图例展示线段和圆点且颜色一致

- **WHEN** 图表加载多条可见曲线
- **THEN** 图例每项显示为线段+圆点的组合图标，颜色与对应曲线相同，曲线上不显示圆点

#### Scenario: 单条曲线时不显示图例

- **WHEN** 仅一条可见曲线
- **THEN** 图例不显示

### Requirement: 导出可选含图例

系统 SHALL 提供"导出含图例"开关（`exportWithLegend`，默认关闭）。PNG 与 PPTX 导出 SHALL 遵循该开关：开启时导出含图例（同样 `icon:'inherit'`、颜色与曲线一致、展示线段+圆点）；关闭时导出不含图例（保持现状）。

#### Scenario: 默认导出不含图例

- **WHEN** 用户未开启"导出含图例"并导出 PNG
- **THEN** 导出图不含图例

#### Scenario: 开启后导出含图例

- **WHEN** 用户勾选"导出含图例"并导出
- **THEN** 导出图含图例，每项为线段+圆点组合图标、颜色与曲线一致