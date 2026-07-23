# workspace-persistence Specification

## Purpose
工作区状态持久化与导入/导出往返完整性规范，覆盖 IndexedDB 自动保存字段集合、JSON 导出/导入字段集合、刷新与往返后状态无损恢复。
## Requirements
### Requirement: IndexedDB 自动保存字段完整性

`uiSnapshot` SHALL 包含 `xRange`、`yZoomRange`、`colorHistory`、`lineStyle`、`labelStyle`（分别对应 X 轴缩放位置、Y 轴框选范围、颜色历史、全局曲线线条样式、全局标签样式），在 `saveWorkspace` 时写入 IndexedDB，在 `restoreWorkspace` 时恢复。SHALL 向后兼容旧 `uiSnapshot`（缺失字段回退到默认值，`lineStyle`/`labelStyle` 经 `hydrateLineStyle`/`hydrateLabelStyle` 以 `DEFAULT_LINE_STYLE`/`DEFAULT_LABEL_STYLE` 为底合并，详见「持久化样式字段类型校验与默认值合并」）。

#### Scenario: 刷新后恢复缩放位置

- **WHEN** 用户缩放/平移 X 轴后刷新页面
- **THEN** X 轴缩放位置恢复为刷新前

#### Scenario: 刷新后恢复全局曲线样式

- **WHEN** 用户将全局曲线粗细设为 2.5、线型虚线后刷新页面
- **THEN** 刷新后全局曲线粗细为 2.5、线型为虚线

#### Scenario: 旧 uiSnapshot 兼容

- **WHEN** 恢复旧版 `uiSnapshot`（无 `xRange`/`yZoomRange`/`colorHistory`/`lineStyle`/`labelStyle` 字段）
- **THEN** 缺失字段使用默认值，`lineStyle` 为 `DEFAULT_LINE_STYLE`、`labelStyle` 为 `DEFAULT_LABEL_STYLE`，无报错

### Requirement: 持久化样式字段类型校验与默认值合并

`restoreWorkspace` 恢复 `lineStyle`/`labelStyle` 时 SHALL 经纯函数 `hydrateLineStyle`/`hydrateLabelStyle` 处理：以 `DEFAULT_LINE_STYLE`/`DEFAULT_LABEL_STYLE` 为底，用持久化对象覆盖；对每个字段做运行时类型校验——`width`/`fontSize` SHALL 为 `number` 且有限（`Number.isFinite`），`type` SHALL 属于 `solid`/`dashed`/`dotted`，`fontWeight` SHALL 属于 `normal`/`bold`，`color`/`fontFamily` SHALL 为 `string`；不满足或为 `null`/`undefined` 的字段 SHALL 回退对应默认值。该契约 SHALL 保证任何缺失字段、`null` 值或错误类型持久化值不得以 `undefined`/`null`/非数值形态渗入受控 React 输入控件（如 `<input type="range" value={lineStyle.width}>`），从而杜绝 React controlled/uncontrolled 警告及 `toHexColor` 对非字符串抛 `TypeError`。

#### Scenario: 部分持久化对象补默认字段

- **WHEN** 恢复 `uiSnapshot.lineStyle = { color: '#ff0000' }`（缺 `width`/`type`）
- **THEN** 恢复后 `lineStyle.width` 为 `DEFAULT_LINE_STYLE.width`（数值）、`type` 为 `solid`、`color` 为 `'#ff0000'`

#### Scenario: null 字段回退默认

- **WHEN** 恢复 `uiSnapshot.lineStyle = { width: null, color: '#000' }`（`width` 显式为 `null`）
- **THEN** 恢复后 `lineStyle.width` 为 `DEFAULT_LINE_STYLE.width`（数值），不触发 React controlled/uncontrolled 警告

#### Scenario: 错误类型字段回退默认

- **WHEN** 恢复 `uiSnapshot.lineStyle = { width: 'abc', type: 'bogus', color: 123 }`
- **THEN** 恢复后 `width` 为 `DEFAULT_LINE_STYLE.width`、`type` 为 `solid`、`color` 为 `DEFAULT_LINE_STYLE.color`（字符串），`color` 不会以非字符串渗入 `toHexColor` 而抛错

#### Scenario: 恢复部分 labelStyle 字段时回退默认值

- **WHEN** 恢复 `uiSnapshot.labelStyle = { color: '#9a9a9a' }`（缺 `fontSize`/`fontFamily`/`fontWeight`）
- **THEN** 恢复后 `fontSize` 为 `DEFAULT_LABEL_STYLE.fontSize`（数值）、`fontFamily` 为 `'sans-serif'`、`fontWeight` 为 `'normal'`、`color` 为 `'#9a9a9a'`

#### Scenario: 旧数据含 backgroundColor 字段静默忽略

- **WHEN** 恢复 `uiSnapshot.labelStyle = { color: '#333', fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold', backgroundColor: '#ffffff' }`
- **THEN** 恢复后 `color` 为 `'#333'`、`fontSize` 为 `12`、`fontFamily` 为 `'Arial'`、`fontWeight` 为 `'bold'`，不包含 `backgroundColor` 字段，无报错

### Requirement: 恢复时缺失字段回退默认值

系统 SHALL 在从 IndexedDB/JSON 恢复工作区时，对任何缺失字段回退到默认值：`curveScales`/`curveScaleOffsets` 回退 `{}`，`globalScale` 回退 `1`，`layerSpacing` 回退 `0`，`pointLabels`/`braces` 回退 `[]`，`stagingOrder` 回退 `[]`，`visibleCurves` 回退 `{}`。该回退 SHALL 保证不含新字段的旧版本快照可无错恢复。系统 SHALL NOT 持久化或恢复 `normalizeFactors` 字段。

#### Scenario: 旧版本 IndexedDB 快照恢复

- **WHEN** IndexedDB 中存在不含 `curveScales`/`curveScaleOffsets`/`globalScale` 字段的旧快照，系统执行恢复
- **THEN** 恢复无运行时错误，`curveScales` 为 `{}`，`curveScaleOffsets` 为 `{}`，`globalScale` 为 `1`

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

系统 SHALL 在导入工作区 JSON 时恢复全部上述字段；导入路径缺失字段 SHALL 按默认值回退。导入后图表渲染 SHALL 与导出时一致（含缩放、单曲线缩放、Y 缩放范围）。系统 SHALL NOT 导入或恢复 `normalizeFactors` 字段。

#### Scenario: 导入导出往返无损

- **WHEN** 用户配置 `globalScale=1.5`、某曲线 `curveScales=2.0`（含归一化结果），导出 JSON 后再导入同一 JSON
- **THEN** 导入后 `globalScale` 为 1.5，`curveScales` 与导出时一致

#### Scenario: 导入缺失字段回退

- **WHEN** 导入的 JSON 不含 `globalScale` 字段
- **THEN** 导入后 `globalScale` 为默认值 `1`，无运行时错误

### Requirement: 持久化与导入导出共用字段集

系统 SHALL 通过共享纯函数（如 `buildWorkspaceSnapshot(state)` 与 `applyWorkspaceSnapshot(state, data)`）生成 IndexedDB 快照与 JSON 导出对象，并在恢复/导入路径复用同一字段集，避免两套字段列表漂移。

#### Scenario: 新增可调字段后两路径同步

- **WHEN** 未来向 curveStore 新增一个持久化字段并加入共享纯函数
- **THEN** IndexedDB 自动保存与 JSON 导出/导入同时覆盖该字段，无需分别修改

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

### Requirement: 快照版本迁移至 v4

工作区快照 SHALL 携带 `version` 字段，当前版本为 `4`。恢复时 SHALL 根据 `version` 执行迁移：当 `version < 4` 且快照含 `normalizeFactors` 字段时，对每条曲线 SHALL 执行 `curveScales[id] = (curveScales[id] ?? 1) * (normalizeFactors[id] ?? 1)`，然后 SHALL 删除 `normalizeFactors` 字段。迁移 SHALL 保证 v3 快照（含独立归一化层）恢复后曲线缩放视觉效果不变。当 `version < 3` 时，SHALL 先执行 v2→v3 颜色迁移，再执行 v3→v4 缩放迁移。

#### Scenario: v3 快照迁移到 v4

- **WHEN** 恢复 `version: 3` 且含 `normalizeFactors: { c1: 2.0 }`、`curveScales: { c1: 0.8 }` 的旧快照
- **THEN** 迁移后 `curveScales.c1` = 1.6（= 0.8 × 2.0），`normalizeFactors` 字段不存在，渲染倍率不变

#### Scenario: v3 快照无 normalizeFactors

- **WHEN** 恢复 `version: 3` 且不含 `normalizeFactors` 字段的快照
- **THEN** `curveScales` 原样恢复，无迁移副作用

#### Scenario: v4 快照原样恢复

- **WHEN** 恢复 `version: 4` 的快照
- **THEN** 快照原样恢复，不执行缩放迁移

#### Scenario: 缺失 version 视为 v2

- **WHEN** 恢复不含 `version` 字段的旧快照
- **THEN** 视为 `version: 2` 先执行颜色迁移，再执行缩放迁移

