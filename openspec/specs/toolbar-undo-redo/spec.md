# toolbar-undo-redo Specification

## Purpose
Toolbar 撤销/重做按钮功能规范，确保用户可以通过 UI 按钮撤销和重做曲线操作。

## Requirements
### Requirement: 撤销/重做按钮可用

系统 SHALL 在 Toolbar 中提供可工作的撤销和重做按钮。点击撤销按钮 SHALL 调用 zundo temporal 中间件的 `undo()` 方法恢复上一个状态快照，点击重做按钮 SHALL 调用 `redo()` 方法恢复下一个状态快照。

#### Scenario: 撤销删除操作

- **WHEN** 用户删除一条曲线后点击"撤销"按钮
- **THEN** 被删除的曲线恢复显示在曲线列表中，恢复其原有的可见性状态

#### Scenario: 重做删除操作

- **WHEN** 用户撤销删除后点击"重做"按钮
- **THEN** 曲线再次被删除

#### Scenario: 无历史时按钮不报错

- **WHEN** 用户在没有任何可撤销历史时点击"撤销"按钮
- **THEN** 系统不抛出错误，不显示异常提示