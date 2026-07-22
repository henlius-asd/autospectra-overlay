## Why

`LabelStyleControls`（标签样式面板）和 `CurveStylePanel`（曲线样式面板，由 `2026-07-22-curve-line-style` 引入）中的内联 `<input type="color">` 取色器在拖拽选色时连续刷新 store / 图表，而非在抬起鼠标（取色器关闭）时提交一次。根因是 React 18 把 `<input type="color">` 的 `onChange` 绑到原生 `input` 事件（拖拽期间连续触发），而面板 handler 在 `onChange` 中直接写 store。同一 app 内的 `ColorPanel.tsx` 用原生 `change` 监听（提交时才触发），行为正确，形成天然对照组。

## What Changes

- **新增 `useColorCommit` hook**：返回 ref，挂载原生 `change` 事件监听器（取色器关闭时提交一次），通过 `commitRef` 避免闭包过期；`deps` 参数处理条件渲染的 input。
- **`LabelStyleControls`**：文字颜色 / 背景颜色两处取色器从 React `onChange`（连续）切到 `useColorCommit`（提交），保留受控 `value` + `onChange={() => {}}` 吞掉连续 `input` 事件、消除 React 受控告警。
- **`CurveStylePanel`**：全局颜色 / 单条覆盖颜色两处取色器同样切到 `useColorCommit`（单条用 `[selectedCurveId]` dep 因 input 条件渲染）。
- **新增回归回路** `e2e/color-picker-commit.spec.ts`：断言合成 `input` 事件不提交 store、合成 `change` 事件提交（修复前 RED，修复后 GREEN）。

## Capabilities

### New Capabilities
- `color-picker-commit`: 工具箱内联取色器 SHALL 在原生 `change` 事件（取色器关闭 / 抬起鼠标）时提交一次，SHALL NOT 在拖拽期间（`input` 事件）连续写 store

## Impact

- `src/components/ui/useColorCommit.ts`（新建）— 共享 hook
- `src/components/toolbox/LabelStyleControls.tsx` — 2 处取色器接线
- `src/components/toolbox/CurveStylePanel.tsx` — 2 处取色器接线
- `e2e/color-picker-commit.spec.ts`（新建）— 回归回路