# state-management Delta Spec

## ADDED Requirements

### Requirement: curveStore 新增 curveScales 状态

curveStore SHALL 新增 `curveScales: Record<string, number>` 字段，存储每条曲线的 Y 轴缩放倍率。初始值为空对象，访问不存在键时默认值为 1.0。SHALL 提供 `setCurveScale(id: string, scale: number)` action。

#### Scenario: 初始状态

- **WHEN** 应用首次加载
- **THEN** `curveScales` 为空对象

#### Scenario: 设置缩放倍率

- **WHEN** 调用 `setCurveScale('curve_1', 2.0)`
- **THEN** `curveScales['curve_1']` 为 2.0

#### Scenario: 未设置时默认值

- **WHEN** 读取 `curveScales` 中不存在的键
- **THEN** 默认返回 1.0

#### Scenario: 删除曲线时同步清理

- **WHEN** 调用 `removeCurve('curve_1')`
- **THEN** `curveScales` 中不再包含 'curve_1'

### Requirement: curveStore 新增 setCurveColor action

curveStore SHALL 提供 `setCurveColor(id: string, color: string)` action，用于更新指定曲线的颜色字段。

#### Scenario: 设置曲线颜色

- **WHEN** 调用 `setCurveColor('curve_1', '#FF0000')`
- **THEN** 曲线 'curve_1' 的 `color` 字段更新为 `#FF0000`

### Requirement: uiStore 新增 Y 缩放工具状态

uiStore SHALL 新增 `yScaleToolMode: boolean` 字段（默认 false）和 `activeScaledCurveId: string | null` 字段（默认 null）。SHALL 提供 `setYScaleToolMode(active: boolean)` 和 `setActiveScaledCurveId(id: string | null)` action。

#### Scenario: 初始状态

- **WHEN** 应用首次加载
- **THEN** `yScaleToolMode` 为 false，`activeScaledCurveId` 为 null

#### Scenario: 进入 Y 缩放模式

- **WHEN** 调用 `setYScaleToolMode(true)`
- **THEN** `yScaleToolMode` 为 true

#### Scenario: 选中曲线

- **WHEN** 调用 `setActiveScaledCurveId('curve_1')`
- **THEN** `activeScaledCurveId` 为 'curve_1'

### Requirement: CurveData 新增 color 字段

`CurveData` 类型 SHALL 新增 `color?: string` 可选字段。`addCurves` action SHALL 将新曲线 `color` 初始化为 `'#000000'`。

#### Scenario: 类型包含新字段

- **WHEN** 开发者从 `@/types/curve` 导入 `CurveData`
- **THEN** `CurveData` 类型包含 `color?: string` 可选字段，TypeScript 编译通过

#### Scenario: 新曲线默认黑色

- **WHEN** 调用 `addCurves` 添加新曲线
- **THEN** 曲线的 `color` 字段为 `'#000000'`

### Requirement: uiStore showAxes 默认值变更

uiStore 的 `showAxes` 字段初始值 SHALL 从 `true` 改为 `false`。坐标轴默认不渲染。

#### Scenario: 初始状态

- **WHEN** 应用首次加载
- **THEN** `showAxes` 为 false，坐标轴不渲染

#### Scenario: 用户手动开启

- **WHEN** 用户点击工具栏 "坐标轴" 按钮
- **THEN** `showAxes` 切换为 true，坐标轴渲染