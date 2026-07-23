## MODIFIED Requirements

### Requirement: `restoreWorkspace` 恢复 `lineStyle`/`labelStyle` 时 SHALL 经纯函数 `hydrateLineStyle`/`hydrateLabelStyle` 处理：以 `DEFAULT_LINE_STYLE`/`DEFAULT_LABEL_STYLE` 为底，用持久化对象覆盖；对每个字段做运行时类型校验——`width`/`fontSize` SHALL 为 `number` 且有限（`Number.isFinite`），`type` SHALL 属于 `solid`/`dashed`/`dotted`，`fontWeight` SHALL 属于 `normal`/`bold`，`color`/`fontFamily` SHALL 为 `string`；不满足或为 `null`/`undefined` 的字段 SHALL 回退对应默认值。该契约 SHALL 保证任何缺失字段、`null` 值或错误类型持久化值不得以 `undefined`/`null`/非数值形态渗入受控 React 输入控件（如 `<input type="range" value={lineStyle.width}>`），从而杜绝 React controlled/uncontrolled 警告及 `toHexColor` 对非字符串抛 `TypeError`。

#### Scenario: 恢复部分 labelStyle 字段时回退默认值

- **WHEN** 恢复 `uiSnapshot.labelStyle = { color: '#9a9a9a' }`（缺 `fontSize`/`fontFamily`/`fontWeight`）
- **THEN** 恢复后 `fontSize` 为 `DEFAULT_LABEL_STYLE.fontSize`（数值）、`fontFamily` 为 `'sans-serif'`、`fontWeight` 为 `'normal'`、`color` 为 `'#9a9a9a'`

#### Scenario: 旧数据含 `backgroundColor` 字段静默忽略

- **WHEN** 恢复 `uiSnapshot.labelStyle = { color: '#333', fontSize: 12, fontFamily: 'Arial', fontWeight: 'bold', backgroundColor: '#ffffff' }`
- **THEN** 恢复后 `color` 为 `'#333'`、`fontSize` 为 `12`、`fontFamily` 为 `'Arial'`、`fontWeight` 为 `'bold'`，不包含 `backgroundColor` 字段，无报错