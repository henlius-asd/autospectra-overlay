# state-management Specification (Delta)

## MODIFIED Requirements

### Requirement: addCurves 行为变更

`addCurves` action SHALL 将新曲线数据存入 `curves` 并初始化 `offsets`，但 SHALL NOT 自动将新曲线 ID 添加到 `visibleCurves` 集合或 `stagingOrder` 中。新曲线上传后默认不可见，位于未叠图区。`addCurves` SHALL NOT 显式设置 `baselineId`；`baselineId` 由后续的 `toggleCurveVisibility` action 通过 `deriveBaseline` 派生。导入曲线后若没有任何可见曲线，`baselineId` 保持为 null。

#### Scenario: 上传曲线后不可见

- **WHEN** 调用 `addCurves` 添加新曲线
- **THEN** 曲线被存入 `curves`，但其 ID 不在 `visibleCurves` 集合中，也不在 `stagingOrder` 中，图表不渲染该曲线

#### Scenario: 导入曲线后不自动设置基线

- **WHEN** 调用 `addCurves` 且当前 `baselineId` 为 null
- **THEN** `baselineId` 保持为 null，基线由下一次 `toggleCurveVisibility` 时派生