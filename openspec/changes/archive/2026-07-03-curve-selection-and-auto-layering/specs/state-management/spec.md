## MODIFIED Requirements

### Requirement: curveStore 初始状态

curveStore 初始状态 SHALL 包含以下字段：

- `curves: Record<string, CurveData>` — 空对象
- `offsets: Record<string, { xOffset: number; yOffset: number }>` — 空对象
- `visibleCurves: Set<string>` — 空集合，追踪当前可见的曲线 ID
- `layerSpacing: number` — 0，Y 轴层间距，默认不产生分层
- `baselineId: string | null` — null
- `braces: BraceAnnotation[]` — 空数组

#### Scenario: 初始状态验证

- **WHEN** 应用首次加载，未进行任何操作
- **THEN** `curveStore.getState()` 返回的 `curves` 为空对象，`visibleCurves` 为空 Set，`layerSpacing` 为 0，`baselineId` 为 null，`braces` 为空数组

### Requirement: addCurves 行为变更

`addCurves` action SHALL 将新曲线数据存入 `curves` 并初始化 `offsets`，但 SHALL NOT 自动将新曲线 ID 添加到 `visibleCurves` 集合中。新曲线上传后默认不可见。

#### Scenario: 上传曲线后不可见

- **WHEN** 调用 `addCurves` 添加新曲线
- **THEN** 曲线被存入 `curves`，但其 ID 不在 `visibleCurves` 集合中，图表不渲染该曲线

#### Scenario: 自动设置基线

- **WHEN** 调用 `addCurves` 且当前 `baselineId` 为 null
- **THEN** `baselineId` 自动设置为第一条新曲线的 ID（保持现有行为）

### Requirement: 新增 toggleCurveVisibility action

curveStore SHALL 提供 `toggleCurveVisibility(id: string)` action，用于切换指定曲线的可见性状态。如果曲线 ID 在 `visibleCurves` 中，则移除；否则添加。

#### Scenario: 切换为可见

- **WHEN** 调用 `toggleCurveVisibility('curve_1')` 且该曲线之前不可见
- **THEN** `visibleCurves` 包含 'curve_1'，图表渲染该曲线

#### Scenario: 切换为不可见

- **WHEN** 调用 `toggleCurveVisibility('curve_1')` 且该曲线之前可见
- **THEN** `visibleCurves` 不再包含 'curve_1'，图表移除该曲线

### Requirement: 新增 setAllCurvesVisibility action

curveStore SHALL 提供 `setAllCurvesVisibility(visible: boolean)` action，用于一次性设置所有曲线的可见性。

#### Scenario: 全选

- **WHEN** 调用 `setAllCurvesVisibility(true)`
- **THEN** `visibleCurves` 包含所有曲线 ID

#### Scenario: 取消全选

- **WHEN** 调用 `setAllCurvesVisibility(false)`
- **THEN** `visibleCurves` 变为空集合

### Requirement: 新增 setLayerSpacing action

curveStore SHALL 提供 `setLayerSpacing(spacing: number)` action，用于设置 Y 轴层间距值。

#### Scenario: 设置层间距

- **WHEN** 调用 `setLayerSpacing(0.5)`
- **THEN** `layerSpacing` 变为 0.5，可见曲线的 Y 偏移按新间距重新计算

### Requirement: removeCurve 行为增强

`removeCurve` action SHALL 在删除曲线时同时从 `visibleCurves` 集合中移除该曲线 ID。

#### Scenario: 删除可见曲线

- **WHEN** 调用 `removeCurve('curve_1')` 且 'curve_1' 在 `visibleCurves` 中
- **THEN** 曲线从 `curves` 和 `visibleCurves` 中同时移除