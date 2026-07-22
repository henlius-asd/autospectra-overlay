## Context

React 18 把 `<input type="color">` 的 `onChange` 绑到原生 `input` 事件（拖拽取色器时连续触发），而 `LabelStyleControls` 和 `CurveStylePanel`（`2026-07-22-curve-line-style` 引入）在 `onChange` 中直接写 store。本变更新增 `useColorCommit` hook，把取色器接线从 React `onChange`（连续）切到原生 `change`（提交），并建立回归回路。

## Goals / Non-Goals

**Goals:**
- 取色器拖拽期间不写 store / 图表（只反映在 input 自身色块，因 input.value 跟随拖拽）
- 取色器关闭（`change` 事件）时提交一次：写 store + `addColorToHistory`
- 回归回路钉住"`change` 提交"契约，修复前 RED、修复后 GREEN
- 不破坏受控 input 的显示同步（点击 colorHistory 色块后 input 色块仍跟随）

**Non-Goals:**
- 不改变 `ColorPanel`（取色器弹出面板）——它已用原生 `change`，行为正确
- 不改变取色器之外的颜色修改路径（colorHistory 色块、slider 等）
- 不引入拖拽期间的本地预览状态（input 自身色块已提供实时预览）

## Decisions

### 1. 原生 `change` 监听 + 受控 `value` + noop `onChange`

**选型**：`useColorCommit` hook 在 ref 上挂 `addEventListener('change', handler)`，handler 读 `input.value` 调 `onCommit`；input 保持 `value={toHexColor(...)}` 受控 + `onChange={() => {}}` noop。

- 受控 `value` 保证点击 colorHistory 色块后 input 色块同步刷新。
- noop `onChange` 吞掉原生 `input` 事件（拖拽期间连续触发，不写 store），同时消除 React"受控 input 无 onChange"告警。
- 原生 `change` 监听（合成事件可触发）用于提交，是回归回路可自动化验证的锚点。

**替代方案**：去掉 `onChange`、不加 noop → React 告警且可能使 input 只读；用 `defaultValue` 非受控 → 点击 colorHistory 色块后 input 色块不更新。

### 2. `commitRef` 避免闭包过期

**选型**：hook 内用 `const commitRef = useRef(onCommit); commitRef.current = onCommit;`，监听器闭包捕获 `commitRef`，每次都读 `commitRef.current(input.value)`。`deps` 参数控制监听器何时重挂（`[]` 始终挂载，`[selectedCurveId]` 条件渲染时重挂），不依赖 `onCommit` 引用变化。

**替代方案**：`useEffect` 依赖 `[onCommit]` → 每次 `onCommit` 变化都重挂监听器，拖拽期间 `onCommit` 引用更新会导致监听器被清除-重挂，`change` 事件可能丢失。

### 3. 回归回路：合成事件自动化

**选型**：`e2e/color-picker-commit.spec.ts` 用 `page.evaluate` 在 `input` 上设 `.value` 并 dispatch 合成 `input` / `change` 事件，通过 `window.__autospectra.getUiState()` 读 store。断言 `input` 事件不提交（store 不变）、`change` 事件提交（store 落到终值）。修复前合成 `change` 不提交（无原生 `change` 监听器，React onChange 不理合成 `change`）→ RED；修复后原生 `change` 监听器对合成事件触发 → GREEN。

- 合成 `input` 事件在 Chromium 下不触发 React `onChange`（探针已证），故不构成"拖拽期间连续刷新"的复现，但 `change` 提交断言是干净的红/绿锚点。
- 拖拽连续症状本身需真人拖拽（Playwright 驱动不了原生取色器弹窗），不在自动回路范围内。

## Risks / Trade-offs

- **[Risk] noop `onChange` 在拖拽期间有无关 re-render 时可能重置 input value** → 拖拽期间无其他写 store 的操作（noop 不写），故不做 re-render；仅极边缘情况（如定时器触发无关状态变更）可能 reset，影响可忽略。
- **[Risk] 取色器关闭行为在不同浏览器不同** → Chrome 取色器关闭时触发 `change`；Firefox/Safari 行为一致。`useColorCommit` 遵循标准 DOM 事件，跨浏览器兼容。
- **[Trade-off] 拖拽期间取色器色块实时显示拖拽色，但图表不更新** → 符合用户要求的"抬起鼠标才选色"；色块实时预览是 input 自身的原生行为，无需额外实现。