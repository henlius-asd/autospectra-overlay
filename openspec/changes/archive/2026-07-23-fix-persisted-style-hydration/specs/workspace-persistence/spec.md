## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: 持久化样式字段类型校验与默认值合并

`restoreWorkspace` 恢复 `lineStyle`/`labelStyle` 时 SHALL 经纯函数 `hydrateLineStyle`/`hydrateLabelStyle` 处理：以 `DEFAULT_LINE_STYLE`/`DEFAULT_LABEL_STYLE` 为底，用持久化对象覆盖；对每个字段做运行时类型校验——`width`/`fontSize` SHALL 为 `number` 且有限（`Number.isFinite`），`type` SHALL 属于 `solid`/`dashed`/`dotted`，`fontWeight` SHALL 属于 `normal`/`bold`，`color`/`fontFamily`/`backgroundColor` SHALL 为 `string`；不满足或为 `null`/`undefined` 的字段 SHALL 回退对应默认值。该契约 SHALL 保证任何缺失字段、`null` 值或错误类型持久化值不得以 `undefined`/`null`/非数值形态渗入受控 React 输入控件（如 `<input type="range" value={lineStyle.width}>`），从而杜绝 React controlled/uncontrolled 警告及 `toHexColor` 对非字符串抛 `TypeError`。

#### Scenario: 部分持久化对象补默认字段

- **WHEN** 恢复 `uiSnapshot.lineStyle = { color: '#ff0000' }`（缺 `width`/`type`）
- **THEN** 恢复后 `lineStyle.width` 为 `DEFAULT_LINE_STYLE.width`（数值）、`type` 为 `solid`、`color` 为 `'#ff0000'`

#### Scenario: null 字段回退默认

- **WHEN** 恢复 `uiSnapshot.lineStyle = { width: null, color: '#000' }`（`width` 显式为 `null`）
- **THEN** 恢复后 `lineStyle.width` 为 `DEFAULT_LINE_STYLE.width`（数值），不触发 React controlled/uncontrolled 警告

#### Scenario: 错误类型字段回退默认

- **WHEN** 恢复 `uiSnapshot.lineStyle = { width: 'abc', type: 'bogus', color: 123 }`
- **THEN** 恢复后 `width` 为 `DEFAULT_LINE_STYLE.width`、`type` 为 `solid`、`color` 为 `DEFAULT_LINE_STYLE.color`（字符串），`color` 不会以非字符串渗入 `toHexColor` 而抛错

#### Scenario: labelStyle 同等校验

- **WHEN** 恢复 `uiSnapshot.labelStyle = { color: '#9a9a9a' }`（缺 `fontSize`/`fontFamily`/`fontWeight`/`backgroundColor`）
- **THEN** 恢复后 `fontSize` 为 `DEFAULT_LABEL_STYLE.fontSize`（数值）、`fontFamily` 为 `'sans-serif'`、`fontWeight` 为 `'normal'`、`backgroundColor` 为 `'#ffffff'`、`color` 为 `'#9a9a9a'`
