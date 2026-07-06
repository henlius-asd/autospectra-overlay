## MODIFIED Requirements

### Requirement: curveStore 初始状态

curveStore 初始状态 SHALL 包含以下字段，均为空值：

- `curves: Record<string, CurveData>` — 空对象
- `offsets: Record<string, { xOffset: number; yOffset: number }>` — 空对象
- `visibleCurves: Record<string, boolean>` — 空对象，追踪当前可见的曲线 ID
- `stagingOrder: string[]` — 空数组，叠图区曲线 ID 的有序列表
- `layerSpacing: number` — 0，Y 轴层间距，默认不产生分层
- `baselineId: string | null` — null
- `braces: BraceAnnotation[]` — 空数组

#### Scenario: 初始状态验证

- **WHEN** 应用首次加载，未进行任何操作
- **THEN** `curveStore.getState()` 返回的 `curves` 为空对象，`visibleCurves` 为空对象，`stagingOrder` 为空数组，`layerSpacing` 为 0，`baselineId` 为 null，`braces` 为空数组

### Requirement: addCurves 行为变更

`addCurves` action SHALL 将新曲线数据存入 `curves` 并初始化 `offsets`，但 SHALL NOT 自动将新曲线 ID 添加到 `visibleCurves` 集合或 `stagingOrder` 中。新曲线上传后默认不可见，位于未叠图区。

#### Scenario: 上传曲线后不可见

- **WHEN** 调用 `addCurves` 添加新曲线
- **THEN** 曲线被存入 `curves`，但其 ID 不在 `visibleCurves` 集合中，也不在 `stagingOrder` 中，图表不渲染该曲线

#### Scenario: 自动设置基线

- **WHEN** 调用 `addCurves` 且当前 `baselineId` 为 null
- **THEN** `baselineId` 自动设置为第一条新曲线的 ID（保持现有行为）

### Requirement: toggleCurveVisibility 行为变更

`toggleCurveVisibility` action SHALL 在切换曲线可见性时同步更新 `stagingOrder`：
- 当曲线变为可见（加入 `visibleCurves`）时，SHALL 同时将其 ID 追加到 `stagingOrder` 末尾
- 当曲线变为不可见（从 `visibleCurves` 移除）时，SHALL 同时将其 ID 从 `stagingOrder` 中移除

#### Scenario: 勾选后进入叠图区

- **WHEN** 调用 `toggleCurveVisibility('curve_1')` 且该曲线之前不可见
- **THEN** `visibleCurves` 包含 'curve_1'，`stagingOrder` 末尾追加 'curve_1'，图表渲染该曲线

#### Scenario: 取消勾选后移出叠图区

- **WHEN** 调用 `toggleCurveVisibility('curve_1')` 且该曲线之前可见
- **THEN** `visibleCurves` 和 `stagingOrder` 均不再包含 'curve_1'，图表移除该曲线

### Requirement: removeCurve 行为增强

`removeCurve` action SHALL 在删除曲线时同时从 `visibleCurves` 集合和 `stagingOrder` 数组中移除该曲线 ID。

#### Scenario: 删除可见曲线

- **WHEN** 调用 `removeCurve('curve_1')` 且 'curve_1' 在 `visibleCurves` 和 `stagingOrder` 中
- **THEN** 曲线从 `curves`、`offsets`、`visibleCurves` 和 `stagingOrder` 中同时移除

## ADDED Requirements

### Requirement: 新增 stagingOrder 状态

curveStore SHALL 包含 `stagingOrder: string[]` 字段，存储叠图区曲线 ID 的有序列表。数组顺序决定图表中曲线的渲染层级顺序（index 0 = 图表最下侧）。

#### Scenario: 初始空数组

- **WHEN** 应用首次加载
- **THEN** `stagingOrder` 为空数组

### Requirement: 新增 setStagingOrder action

curveStore SHALL 提供 `setStagingOrder(order: string[])` action，用于更新叠图区曲线的排序。

#### Scenario: 拖拽更新排序

- **WHEN** 用户拖拽叠图区曲线改变顺序，调用 `setStagingOrder(['curve_2', 'curve_1', 'curve_3'])`
- **THEN** `stagingOrder` 更新为新的顺序，图表渲染顺序同步更新

### Requirement: 新增 selectedCurveId 状态

uiStore SHALL 包含 `selectedCurveId: string | null` 字段，表示当前选中的曲线 ID（用于元数据展示等用途）。默认值为 null。SHALL 提供 `setSelectedCurveId` action。

#### Scenario: 初始为 null

- **WHEN** 应用首次加载
- **THEN** `selectedCurveId` 为 null

#### Scenario: 点击曲线选中

- **WHEN** 调用 `setSelectedCurveId('curve_1')`
- **THEN** `selectedCurveId` 为 'curve_1'

### Requirement: 新增 CurveData.displayName 和 metadata 字段

`CurveData` 类型 SHALL 新增以下可选字段：
- `displayName?: string` — 显示名称，用于图表区分各曲线
- `metadata?: Record<string, string>` — 文件元数据键值对

#### Scenario: 类型包含新字段

- **WHEN** 开发者从 `@/types/curve` 导入 `CurveData`
- **THEN** `CurveData` 类型包含 `displayName` 和 `metadata` 可选字段，TypeScript 编译通过