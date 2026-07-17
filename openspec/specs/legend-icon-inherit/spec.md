# legend-icon-inherit Specification

## Purpose
图例图标使用 `icon: 'inherit'` 继承系列样式，同时展示线段和圆点，颜色统一。
## Requirements
### Requirement: 图例图标继承系列样式

图例图标 SHALL 使用 `icon: 'inherit'` 继承系列样式，同时展示线段和圆点符号（`symbol: 'circle'`），圆点颜色 SHALL 与线段颜色（`curve.color`）一致。

#### Scenario: 图例展示线段和圆点

- **WHEN** 图表加载多条可见曲线
- **THEN** 图例每项显示为线段 + 圆点的组合图标，线段和圆点颜色与对应曲线颜色一致

#### Scenario: 曲线不渲染圆点

- **WHEN** 图表渲染曲线
- **THEN** 曲线上不显示数据点圆点标记（`showSymbol: false`）