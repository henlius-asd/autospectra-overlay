## MODIFIED Requirements

### Requirement: 图例仅以线条颜色表示

图表图例 SHALL 仅以线条颜色表示每条曲线：图例 marker SHALL 为线段（`icon: 'line'`），SHALL NOT 显示圆点/圆圈图标。图例线段颜色 SHALL 与对应曲线的线条颜色（`curve.color`）完全一致。图例 SHALL 在 `showLegend` 开启且可见曲线数大于 1 时显示。

#### Scenario: 图例无圆点且颜色与曲线一致

- **WHEN** 图表加载多条可见曲线，且 `showLegend` 为 `true`
- **THEN** 图例每项显示为一段细线段，颜色与对应曲线相同，不出现圆点图标

#### Scenario: 单条曲线时不显示图例

- **WHEN** 仅一条可见曲线
- **THEN** 图例不显示

#### Scenario: showLegend 关闭时不显示图例

- **WHEN** `showLegend` 为 `false`
- **THEN** 图例不显示，无论可见曲线数

## ADDED Requirements

### Requirement: 显示图例开关

系统 SHALL 在工具箱"显示设置"面板中提供"显示图例" checkbox（`showLegend`，默认 `true`）。开启时图表 SHALL 按现有规则显示图例（可见曲线数 > 1 时显示）；关闭时图表 SHALL 不显示图例。`showLegend` SHALL 存于 uiStore 并通过 localForage 持久化到 IndexedDB，纳入 workspace JSON。

#### Scenario: 默认显示图例

- **WHEN** 页面首次加载
- **THEN** "显示图例" checkbox 为勾选状态，图表在有多条曲线时显示图例

#### Scenario: 关闭后隐藏图例

- **WHEN** 用户取消勾选"显示图例"
- **THEN** 图表图例立即消失

#### Scenario: 刷新后图例开关保留

- **WHEN** 用户关闭"显示图例"后刷新页面
- **THEN** "显示图例" checkbox 仍为未勾选状态，图表不显示图例