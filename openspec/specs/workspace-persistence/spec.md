# workspace-persistence Specification

## Purpose
工作区状态持久化与导入/导出往返完整性规范，覆盖 IndexedDB 自动保存字段集合、JSON 导出/导入字段集合、刷新与往返后状态无损恢复。
## Requirements
### Requirement: IndexedDB 自动保存字段完整性

`uiSnapshot` SHALL 包含 `xRange`、`yZoomRange`、`colorHistory`（分别对应 X 轴缩放位置、Y 轴框选范围、颜色历史），在 `saveWorkspace` 时写入 IndexedDB，在 `restoreWorkspace` 时恢复。SHALL 向后兼容旧 `uiSnapshot`（缺失字段回退到默认值）。

#### Scenario: 刷新后恢复缩放位置

- **WHEN** 用户缩放/平移 X 轴后刷新页面
- **THEN** X 轴缩放位置恢复为刷新前

#### Scenario: 刷新后恢复 Y 框选范围

- **WHEN** 用户框选 Y 轴范围后刷新页面
- **THEN** Y 轴框选范围恢复为刷新前

#### Scenario: 旧 uiSnapshot 兼容

- **WHEN** 恢复旧版 `uiSnapshot`（无 `xRange`/`yZoomRange`/`colorHistory` 字段）
- **THEN** 缺失字段使用默认值，无报错

### Requirement: 恢复时缺失字段回退默认值

系统 SHALL 在从 IndexedDB/JSON 恢复工作区时，对任何缺失字段回退到默认值：`curveScales`/`curveScaleOffsets`/`normalizeFactors` 回退 `{}`，`globalScale` 回退 `1`，`layerSpacing` 回退 `0`，`pointLabels`/`braces` 回退 `[]`，`stagingOrder` 回退 `[]`，`visibleCurves` 回退 `{}`。该回退 SHALL 保证不含新字段的旧版本快照可无错恢复。

#### Scenario: 旧版本 IndexedDB 快照恢复

- **WHEN** IndexedDB 中存在不含 `curveScales`/`curveScaleOffsets`/`globalScale`/`normalizeFactors` 字段的旧快照，系统执行恢复
- **THEN** 恢复无运行时错误，`curveScales` 为 `{}`，`curveScaleOffsets` 为 `{}`，`globalScale` 为 `1`，`normalizeFactors` 为 `{}`

### Requirement: JSON 导出包含全部可调字段

JSON 导出 SHALL 包含 `showGrid`、`showXAxis`、`showYAxis`；JSON 导入 SHALL 恢复这些字段。SHALL 向后兼容旧 JSON（缺失字段使用默认值）。

#### Scenario: JSON 导出含显示开关

- **WHEN** 用户导出工作区 JSON
- **THEN** JSON 含 `showGrid`、`showXAxis`、`showYAxis` 当前值

#### Scenario: JSON 导入恢复显示开关

- **WHEN** 用户导入含 `showXAxis: false`、`showYAxis: true` 的 JSON
- **THEN** X 轴隐藏、Y 轴显示

#### Scenario: 旧 JSON 兼容

- **WHEN** 导入不含 `showGrid`/`showXAxis`/`showYAxis` 的旧 JSON
- **THEN** 使用当前默认值（`showGrid: true`、`showXAxis: true`、`showYAxis: false`），无报错

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

