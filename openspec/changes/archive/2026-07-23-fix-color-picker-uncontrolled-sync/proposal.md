## Why

`2026-07-22-color-picker-commit` 把工具箱内联取色器从 React `onChange`（连续）切到原生 `change`（提交）以修复"拖拽连续选色"，但为此选了**受控 `value` + `onChange={() => {}}`** 接线。该决策引入回归：React 18 会在原生 `input` 事件时同步把 `el.value` 还原为受控值，而 `input` 先于 `change` 触发，使 `useColorCommit` 的 `addEventListener('change')` 读到旧值、所选颜色无法提交——用户表现为"调色板能打开但无法确认选择"。原变更 `design.md` 曾考虑 `defaultValue` 非受控方案，但以"点击 colorHistory 色块后 input 色块不更新"为由否决；本变更通过新增 `syncValue` 同步 effect 解决该顾虑，从而安全地切到非受控。

## What Changes

- **`useColorCommit`**：新增可选第三参数 `syncValue?: string`；新增 `useEffect` 在 `syncValue` 变化时把 `el.value` 直接写入 DOM（程序化设 `.value` 不触发 `input`/`change`，无误提交）。JSDoc 明确要求 input 必须非受控（`defaultValue`），并解释受控 `value` 为何会回退所选色。
- **`LabelStyleControls`**：文字颜色 / 背景颜色两个 `<input type="color">` 从受控 `value` + `onChange={() => {}}` 改为非受控 `defaultValue`；两个 hook 调用分别传 `toHexColor(labelStyle.color)` / `toHexColor(labelStyle.backgroundColor)` 作为 `syncValue`。
- **`CurveStylePanel`**：全局颜色 / 单条覆盖颜色两个取色器同样改为非受控 `defaultValue`；分别传 `toHexColor(lineStyle.color)` / `toHexColor(override?.color ?? lineStyle.color)` 作为 `syncValue`（覆盖色 hook 仍用 `[selectedCurveId]` dep）。
- **`color-picker-commit` 规约**：修正需求——SHALL 非受控 `defaultValue`，SHALL NOT 受控 `value` + `onChange={() => {}}`；SHALL 通过 `syncValue` 在外部 store 变化时同步 DOM。

## Capabilities

### New Capabilities

_无新增能力。_

### Modified Capabilities

- `color-picker-commit`: 取色器 input 的受控性需求变更——从"受控 `value` + `onChange={() => {}}`"改为"非受控 `defaultValue` + `useColorCommit` 的 `syncValue` DOM 同步"，并禁止受控接线（受控会导致 `change` 监听器读到被 React 还原的旧值、所选色无法提交）。

## Impact

- `src/components/ui/useColorCommit.ts` — 新增 `syncValue` 参数 + 同步 effect，重写 JSDoc
- `src/components/toolbox/LabelStyleControls.tsx` — 2 处取色器改为非受控
- `src/components/toolbox/CurveStylePanel.tsx` — 2 处取色器改为非受控
- `openspec/specs/color-picker-commit/spec.md` — 需求修正（受控 → 非受控 + `syncValue`）
- 无新增依赖；不影响 `ColorPanel.tsx`（已是非受控 `defaultValue`，行为正确，天然对照组）
- 回归回路 `e2e/color-picker-commit.spec.ts` 契约不变（合成 `change` 仍经原生监听器提交）；真实症状仍需真人复现
