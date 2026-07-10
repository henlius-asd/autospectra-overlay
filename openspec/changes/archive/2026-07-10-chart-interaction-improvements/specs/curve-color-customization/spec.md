# curve-color-customization Specification

## Purpose
曲线颜色自定义功能，允许用户为每条曲线指定颜色。所有曲线默认渲染为黑色，用户可通过曲线列表中的颜色色块自定义颜色。

## ADDED Requirements

### Requirement: 曲线默认黑色

所有新添加的曲线 SHALL 默认渲染为黑色（`#000000`）。系统 SHALL NOT 自动为曲线分配调色板颜色。

#### Scenario: 新曲线默认黑色

- **WHEN** 用户导入新曲线数据
- **THEN** 曲线在图表中渲染为黑色，曲线列表中的颜色色块显示为黑色

#### Scenario: 多条曲线均为黑色

- **WHEN** 图表中有多条可见曲线且用户未自定义任何颜色
- **THEN** 所有曲线均渲染为黑色

### Requirement: 曲线颜色自定义

系统 SHALL 在曲线列表的每条曲线行左侧渲染一个颜色色块。用户点击色块 SHALL 弹出浏览器原生颜色选择器，选择颜色后 SHALL 实时更新该曲线的渲染颜色和色块显示。

#### Scenario: 点击色块弹出颜色选择器

- **WHEN** 用户点击曲线列表中某条曲线的颜色色块
- **THEN** 浏览器原生颜色选择器弹出，当前颜色为色块当前值

#### Scenario: 选择颜色后实时更新

- **WHEN** 用户在颜色选择器中选择新颜色（如红色 `#FF0000`）
- **THEN** 该曲线在图表中立即渲染为红色，曲线列表中的色块同步更新为红色

#### Scenario: 颜色选择器取消不改变

- **WHEN** 用户打开颜色选择器后点击取消或关闭
- **THEN** 曲线颜色保持原值不变

### Requirement: 曲线颜色持久化

曲线颜色 SHALL 存储在 `CurveData.color` 字段中。工作区导出/导入 SHALL 包含颜色字段，确保颜色随曲线持久化。

#### Scenario: 导出包含颜色

- **WHEN** 用户导出工作区 JSON
- **THEN** 导出的每条曲线数据包含 `color` 字段

#### Scenario: 导入恢复颜色

- **WHEN** 用户导入包含 `color` 字段的工作区 JSON
- **THEN** 各曲线恢复导入文件中的颜色

#### Scenario: 旧工作区兼容

- **WHEN** 用户导入不含 `color` 字段的旧工作区 JSON
- **THEN** 曲线颜色默认为黑色 `#000000`

### Requirement: 颜色存储位置

曲线颜色 SHALL 作为 `CurveData` 的可选字段 `color?: string` 存储，而非独立的状态映射。SHALL 提供 `setCurveColor(id: string, color: string)` action 用于更新曲线颜色。

#### Scenario: CurveData 类型扩展

- **WHEN** 开发者从 `@/types/curve` 导入 `CurveData`
- **THEN** `CurveData` 类型包含 `color?: string` 可选字段，TypeScript 编译通过

#### Scenario: 设置曲线颜色

- **WHEN** 调用 `setCurveColor('curve_1', '#FF0000')`
- **THEN** 曲线 'curve_1' 的 `color` 字段更新为 `#FF0000`，图表和列表中的颜色同步更新