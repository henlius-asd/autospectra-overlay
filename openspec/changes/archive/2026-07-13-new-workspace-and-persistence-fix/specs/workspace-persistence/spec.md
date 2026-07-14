## MODIFIED Requirements

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