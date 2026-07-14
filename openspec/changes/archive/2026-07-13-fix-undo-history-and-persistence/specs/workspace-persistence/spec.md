# workspace-persistence Specification

## ADDED Requirements

### Requirement: IndexedDB 自动保存字段完整性

系统 SHALL 在 curveStore 状态变化时（防抖 500ms）将工作区快照写入 IndexedDB。快照 SHALL 包含以下全部字段：`curves`、`offsets`、`baselineId`、`braces`、`stagingOrder`、`visibleCurves`、`layerSpacing`、`pointLabels`、`curveScales`、`curveScaleOffsets`、`globalScale`、`normalizeFactors`。任何字段缺失 SHALL 视为持久化缺陷。

#### Scenario: 单曲线缩放设置在刷新后保留

- **WHEN** 用户在单曲线缩放模式下将某曲线 `curveScales[id]` 设为 2.0、`curveScaleOffsets[id]` 设为 30，随后刷新页面
- **THEN** 恢复后 `curveStore.getState().curveScales[id]` 为 2.0，`curveScaleOffsets[id]` 为 30

#### Scenario: 全局缩放与归一化在刷新后保留

- **WHEN** 用户将 `globalScale` 设为 1.5 并执行峰值归一化（`normalizeFactors` 非空），随后刷新页面
- **THEN** 恢复后 `globalScale` 为 1.5，`normalizeFactors` 与刷新前一致

### Requirement: 恢复时缺失字段回退默认值

系统 SHALL 在从 IndexedDB/JSON 恢复工作区时，对任何缺失字段回退到默认值：`curveScales`/`curveScaleOffsets`/`normalizeFactors` 回退 `{}`，`globalScale` 回退 `1`，`layerSpacing` 回退 `0`，`pointLabels`/`braces` 回退 `[]`，`stagingOrder` 回退 `[]`，`visibleCurves` 回退 `{}`。该回退 SHALL 保证不含新字段的旧版本快照可无错恢复。

#### Scenario: 旧版本 IndexedDB 快照恢复

- **WHEN** IndexedDB 中存在不含 `curveScales`/`curveScaleOffsets`/`globalScale`/`normalizeFactors` 字段的旧快照，系统执行恢复
- **THEN** 恢复无运行时错误，`curveScales` 为 `{}`，`curveScaleOffsets` 为 `{}`，`globalScale` 为 `1`，`normalizeFactors` 为 `{}`

### Requirement: JSON 导出包含全部可调字段

系统 SHALL 在导出工作区 JSON 时包含以下全部字段：`curves`、`offsets`、`baselineId`、`braces`、`stagingOrder`、`visibleCurves`、`layerSpacing`、`pointLabels`、`curveScales`、`curveScaleOffsets`、`globalScale`、`normalizeFactors`、`yZoomRange`、`colorHistory`。

#### Scenario: 导出 JSON 含 globalScale 与 normalizeFactors

- **WHEN** 用户设置 `globalScale=2.0` 并执行峰值归一化后导出工作区 JSON
- **THEN** 导出的 JSON 文本中 `globalScale` 字段为 2.0，`normalizeFactors` 字段为非空对象

### Requirement: JSON 导入恢复全部字段

系统 SHALL 在导入工作区 JSON 时恢复全部上述字段；导入路径缺失字段 SHALL 按默认值回退。导入后图表渲染 SHALL 与导出时一致（含缩放、归一化、单曲线缩放、Y 缩放范围）。

#### Scenario: 导入导出往返无损

- **WHEN** 用户配置 `globalScale=1.5`、`normalizeFactors` 非空、某曲线 `curveScales=2.0`，导出 JSON 后再导入同一 JSON
- **THEN** 导入后 `globalScale` 为 1.5，`normalizeFactors` 与导出时一致，`curveScales` 为 2.0

#### Scenario: 导入缺失字段回退

- **WHEN** 导入的 JSON 不含 `globalScale` 字段
- **THEN** 导入后 `globalScale` 为默认值 `1`，无运行时错误

### Requirement: 持久化与导入导出共用字段集

系统 SHALL 通过共享纯函数（如 `buildWorkspaceSnapshot(state)` 与 `applyWorkspaceSnapshot(state, data)`）生成 IndexedDB 快照与 JSON 导出对象，并在恢复/导入路径复用同一字段集，避免两套字段列表漂移。

#### Scenario: 新增可调字段后两路径同步

- **WHEN** 未来向 curveStore 新增一个持久化字段并加入共享纯函数
- **THEN** IndexedDB 自动保存与 JSON 导出/导入同时覆盖该字段，无需分别修改
