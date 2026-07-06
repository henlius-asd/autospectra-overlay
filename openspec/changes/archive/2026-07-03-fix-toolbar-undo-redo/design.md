## Context

Toolbar 组件通过类型断言访问 zundo 的 `temporal` API，但调用方式与 zundo v2.3.0 的实际 API 不匹配：

- **当前代码**: `store.temporal?.undo()` / `store.temporal?.redo()`
- **zundo v2 API**: `temporal` 是 Zustand store，`undo()`/`redo()` 在 `temporal.getState()` 上

调用失败被 try/catch 静默吞掉，撤销/重做按钮点击无任何效果。

## Goals / Non-Goals

**Goals:**
- 修复 Toolbar 撤销/重做按钮使其正常工作
- 修正类型断言以匹配 zundo v2 实际 API

**Non-Goals:**
- 不添加键盘快捷键（Ctrl+Z）支持
- 不改变 zundo 中间件配置
- 不改变撤销/重做的行为语义

## Decisions

### Decision: 使用 `temporal.getState().undo()` 而非直接 `temporal.undo()`

zundo v2 中 `temporal` 返回的是一个 Zustand `UseBoundStore<TemporalState>`，其上的方法是 `getState()`、`setState()`、`subscribe()` 等标准 Zustand store API。`undo()` 和 `redo()` 是 `TemporalState` 上的方法，需要通过 `getState()` 获取。

```typescript
// 修复前
store.temporal?.undo();

// 修复后
(store.temporal?.getState() as { undo: () => void; redo: () => void })?.undo();
```

更简洁的方式是直接使用 `useCurveStore` 而非 cast：

```typescript
const handleUndo = () => {
  useCurveStore.temporal.getState().undo();
};
```

## Risks / Trade-offs

- **[风险] zundo 版本升级可能再次改变 API** → **缓解**: 该修复是 zundo v2 的标准 API 用法，v2 大版本内 API 稳定。若将来升级到 v3，需重新适配。