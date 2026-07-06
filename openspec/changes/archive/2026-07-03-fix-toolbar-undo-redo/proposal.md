## Why

Toolbar 中的撤销/重做按钮无法工作。根因是 zundo v2.3.0 的 API 调用方式错误：`temporal.undo()` 应为 `temporal.getState().undo()`。zundo v2 中 `temporal` 是一个 Zustand store 对象，`undo`/`redo` 方法在其 `.getState()` 返回的状态上，而非直接在 `temporal` 上。调用错误被 try/catch 静默吞掉，导致按钮点击无任何效果。此问题阻塞了 `fix-chart-empty-title-persistence` 变更的验证任务。

## What Changes

- 修复 `Toolbar.tsx` 中 zundo temporal API 的调用方式：`temporal.undo()` → `temporal.getState().undo()`，`temporal.redo()` → `temporal.getState().redo()`
- 修正类型断言以匹配 zundo v2 的实际 API 类型

## Capabilities

### New Capabilities
<!-- 纯 bug fix，无新能力引入 -->

### Modified Capabilities
<!-- 不改变 spec 级别的行为，仅修复实现以匹配现有 state-management spec -->

## Impact

- `src/components/toolbar/Toolbar.tsx`: 修复 2 行 API 调用 + 1 行类型断言