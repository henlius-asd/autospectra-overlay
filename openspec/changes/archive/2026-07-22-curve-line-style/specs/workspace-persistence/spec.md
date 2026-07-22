## MODIFIED Requirements

### Requirement: IndexedDB 自动保存字段完整性

`uiSnapshot` SHALL 包含 `xRange`、`yZoomRange`、`colorHistory`、`lineStyle`（分别对应 X 轴缩放位置、Y 轴框选范围、颜色历史、全局曲线线条样式），在 `saveWorkspace` 时写入 IndexedDB，在 `restoreWorkspace` 时恢复。SHALL 向后兼容旧 `uiSnapshot`（缺失字段回退到默认值，`lineStyle` 回退到 `DEFAULT_LINE_STYLE`）。

#### Scenario: 刷新后恢复缩放位置

- **WHEN** 用户缩放/平移 X 轴后刷新页面
- **THEN** X 轴缩放位置恢复为刷新前

#### Scenario: 刷新后恢复全局曲线样式

- **WHEN** 用户将全局曲线粗细设为 2.5、线型虚线后刷新页面
- **THEN** 刷新后全局曲线粗细为 2.5、线型为虚线

#### Scenario: 旧 uiSnapshot 兼容

- **WHEN** 恢复旧版 `uiSnapshot`（无 `xRange`/`yZoomRange`/`colorHistory`/`lineStyle` 字段）
- **THEN** 缺失字段使用默认值，`lineStyle` 为 `DEFAULT_LINE_STYLE`，无报错

### Requirement: 恢复时缺失字段回退默认值

系统 SHALL 在从 IndexedDB/JSON 恢复工作区时，对任何缺失字段回退到默认值：`curveScales`/`curveScaleOffsets`/`normalizeFactors` 回退 `{}`，`globalScale` 回退 `1`，`layerSpacing` 回退 `0`，`pointLabels`/`braces` 回退 `[]`，`stagingOrder` 回退 `[]`，`visibleCurves` 回退 `{}`。该回退 SHALL 保证不含新字段的旧版本快照可无错恢复。

#### Scenario: 旧版本 IndexedDB 快照恢复

- **WHEN** IndexedDB 中存在不含 `curveScales`/`curveScaleOffsets`/`globalScale`/`normalizeFactors` 字段的旧快照，系统执行恢复
- **THEN** 恢复无运行时错误，`curveScales` 为 `{}`，`curveScaleOffsets` 为 `{}`，`globalScale` 为 `1`，`normalizeFactors` 为 `{}`

## ADDED Requirements

### Requirement: 工作区快照版本与曲线颜色迁移

工作区快照 SHALL 携带 `version` 字段，当前版本为 `3`。恢复时 SHALL 根据 `version` 执行迁移：当 `version < 3` 时，对每条曲线若存在顶层 `color` 字段但 `lineStyle.color` 缺失，SHALL 将 `color` 搬入 `lineStyle.color` 并删除顶层 `color`。迁移 SHALL 保证 v2 快照（含顶层 `color`）恢复后曲线颜色不丢失。

#### Scenario: v2 快照迁移到 v3

- **WHEN** 恢复 `version: 2` 且曲线含顶层 `color: '#1f77b4'` 但无 `lineStyle` 的旧快照
- **THEN** 迁移后该曲线 `lineStyle.color` 为 `'#1f77b4'`，顶层 `color` 不存在，渲染颜色为 `#1f77b4`

#### Scenario: v3 快照原样恢复

- **WHEN** 恢复 `version: 3` 且曲线含 `lineStyle: { color: '#ff0000' }` 的快照
- **THEN** 该曲线 `lineStyle.color` 为 `'#ff0000'`，无迁移副作用

#### Scenario: 缺失 version 视为 v2

- **WHEN** 恢复不含 `version` 字段的旧快照
- **THEN** 视为 `version: 2` 执行颜色迁移
