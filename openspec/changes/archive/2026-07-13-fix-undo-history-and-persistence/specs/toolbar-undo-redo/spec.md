# toolbar-undo-redo Delta

## MODIFIED Requirements

### Requirement: 撤销/重做按钮可用

系统 SHALL 在 Toolbar 中提供可工作的撤销和重做按钮。点击撤销按钮 SHALL 调用 zundo temporal 中间件的 `undo()` 方法恢复上一个状态快照，点击重做按钮 SHALL 调用 `redo()` 方法恢复下一个状态快照。撤销按钮 SHALL 在 `pastStates` 为空时进入禁用态（不可点击、视觉灰显），重做按钮 SHALL 在 `futureStates` 为空时进入禁用态。按钮禁用态 SHALL 响应式跟随历史栈变化（通过订阅 `temporal` store 的 `pastStates.length` / `futureStates.length`）。

#### Scenario: 撤销删除操作

- **WHEN** 用户删除一条曲线后点击"撤销"按钮
- **THEN** 被删除的曲线恢复显示在曲线列表中，恢复其原有的可见性状态

#### Scenario: 重做删除操作

- **WHEN** 用户撤销删除后点击"重做"按钮
- **THEN** 曲线再次被删除

#### Scenario: 无历史时按钮禁用

- **WHEN** 用户在没有任何可撤销历史时查看"撤销"按钮
- **THEN** 撤销按钮处于禁用态（灰显、不可点击），不会触发报错

#### Scenario: 撤销后重做按钮可用

- **WHEN** 用户执行撤销使 `futureStates` 非空
- **THEN** 重做按钮从禁用态切换为可用态

## ADDED Requirements

### Requirement: 撤销重做键盘快捷键

系统 SHALL 提供全局键盘快捷键：Ctrl+Z（macOS 为 Cmd+Z）触发撤销，Ctrl+Y 或 Ctrl+Shift+Z 触发重做。当事件目标为可编辑文本元素（`<input>`、`<textarea>` 或 `contenteditable`）时，系统 SHALL NOT 拦截该按键事件、SHALL NOT 调用 `preventDefault()`，以保留浏览器原生文本撤销/重做。撤销快捷键 SHALL 仅在未按 Shift 时触发撤销，以避免与 Ctrl+Shift+Z 重做冲突。

#### Scenario: Ctrl+Z 撤销

- **WHEN** 焦点不在可编辑文本元素，用户按下 Ctrl+Z（无 Shift）
- **THEN** 系统执行 `undo()`，不触发浏览器原生行为

#### Scenario: Ctrl+Shift+Z 重做

- **WHEN** 焦点不在可编辑文本元素，用户按下 Ctrl+Shift+Z
- **THEN** 系统执行 `redo()`，不执行撤销

#### Scenario: Ctrl+Y 重做

- **WHEN** 焦点不在可编辑文本元素，用户按下 Ctrl+Y
- **THEN** 系统执行 `redo()`

#### Scenario: 文本输入框原生撤销不被劫持

- **WHEN** 焦点位于曲线别名编辑输入框，用户按下 Ctrl+Z
- **THEN** 系统不调用 `undo()`、不 `preventDefault()`，浏览器对该输入框执行原生文本撤销

#### Scenario: 无历史时快捷键不报错

- **WHEN** 焦点不在可编辑文本元素且无可撤销历史，用户按下 Ctrl+Z
- **THEN** 系统不抛出错误，无异常提示
