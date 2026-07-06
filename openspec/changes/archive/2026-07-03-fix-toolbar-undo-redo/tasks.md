## 1. 修复实现

- [x] 1.1 修复 `Toolbar.tsx` 类型断言：`{ temporal: { undo: () => void; redo: () => void } }` → `{ temporal: { getState: () => { undo: () => void; redo: () => void } } }`
- [x] 1.2 修复 `handleUndo`：`store.temporal?.undo()` → `store.temporal?.getState().undo()`
- [x] 1.3 修复 `handleRedo`：`store.temporal?.redo()` → `store.temporal?.getState().redo()`

## 2. 验证

- [x] 2.1 运行 `rtk tsc` 确保无 TypeScript 编译错误
- [x] 2.2 验证点击"撤销"按钮可恢复已删除的曲线
- [x] 2.3 验证点击"重做"按钮可重新应用已撤销的操作