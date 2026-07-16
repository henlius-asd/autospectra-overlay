## MODIFIED Requirements

### Requirement: 撤销/重做按钮可用

系统 SHALL 在工具栏中提供图标化的撤销和重做按钮。按钮 SHALL 使用内联 SVG 图标（undo/redo），配合 tooltip 文字描述功能。点击撤销按钮 SHALL 调用 zundo temporal 中间件的 `undo()` 方法恢复上一个状态快照，点击重做按钮 SHALL 调用 `redo()` 方法恢复下一个状态快照。撤销按钮 SHALL 在 `pastStates` 为空时进入禁用态（不可点击、视觉灰显、opacity + cursor-not-allowed），重做按钮 SHALL 在 `futureStates` 为空时进入禁用态。按钮禁用态 SHALL 响应式跟随历史栈变化（通过订阅 `temporal` store 的 `pastStates.length` / `futureStates.length`）。

#### Scenario: 撤销删除操作

- **WHEN** 用户删除一条曲线后点击撤销图标按钮
- **THEN** 被删除的曲线恢复显示在曲线列表中，恢复其原有的可见性状态

#### Scenario: 重做删除操作

- **WHEN** 用户撤销删除后点击重做图标按钮
- **THEN** 曲线再次被删除

#### Scenario: 无历史时按钮禁用

- **WHEN** 用户在没有任何可撤销历史时查看撤销按钮
- **THEN** 撤销按钮处于禁用态（灰显、不可点击），不会触发报错

#### Scenario: 撤销后重做按钮可用

- **WHEN** 用户执行撤销使 `futureStates` 非空
- **THEN** 重做按钮从禁用态切换为可用态

#### Scenario: 图标按钮 tooltip 显示

- **WHEN** 用户将鼠标悬停在撤销或重做图标按钮上
- **THEN** tooltip 显示功能描述和快捷键（撤销: "撤销 (Ctrl+Z)"，重做: "重做 (Ctrl+Y / Ctrl+Shift+Z)"）