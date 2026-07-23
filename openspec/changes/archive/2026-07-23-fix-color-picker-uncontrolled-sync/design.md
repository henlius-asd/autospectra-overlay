## Context

`2026-07-22-color-picker-commit` 引入 `useColorCommit` hook，把工具箱内联取色器（`LabelStyleControls` 的文字/背景颜色、`CurveStylePanel` 的全局/单条覆盖颜色，共 4 处）从 React `onChange`（连续）切到原生 `change`（提交）。其 `design.md` 选了**受控 `value` + `onChange={() => {}}`**，并以"点击 colorHistory 色块后 input 色块不更新"为由否决了 `defaultValue` 非受控方案。该接线引入回归：React 18 在原生 `input` 事件时同步把 `el.value` 还原为受控值，而 `input` 先于 `change` 触发，导致 `change` 监听器读到旧值、所选色无法提交。`ColorPanel.tsx`（已是非受控 `defaultValue`）不受影响，是天然对照组。本变更切到非受控并补齐显示同步。

## Goals / Non-Goals

**Goals:**
- 修复"调色板能打开但无法确认选择"——所选色能在 `change` 时正确提交到 store
- 保留原变更的"拖拽期间不写 store、关闭时提交一次"行为（不回退到连续选色）
- 保留点击 colorHistory 色块 / 撤销重做后 input 色块跟随刷新
- 不改变 `ColorPanel.tsx`（已正确）

**Non-Goals:**
- 不改取色器之外的颜色修改路径（slider、colorHistory 色块 `onClick` 仍直接写 store）
- 不引入拖拽期间的本地预览状态（input 自身色块已提供实时预览）
- 不改 `commitRef` / `deps` 机制（沿用原变更）

## Decisions

### 1. 非受控 `defaultValue` + `syncValue` DOM 同步 effect（核心）

**选型**：input 渲染为 `<input type="color" ref={ref} defaultValue={toHexColor(storeColor)} />`（非受控，去掉 `value` 与 `onChange`）；`useColorCommit` 新增第三参数 `syncValue`，在独立 `useEffect([syncValue])` 中 `el.value = syncValue`（仅当 `el.value.toLowerCase() !== syncValue.toLowerCase()` 时写入）。

- 非受控 → React 不再在 `input` 事件时还原 `el.value` → `change` 监听器读到用户所选色 ✓
- `syncValue` effect 解决原变更否决非受控的理由（外部 store 变化时同步 input 色块）✓
- 程序化设 `.value` 不触发 `input`/`change` → 不会误触发 `onCommit`，无重复提交 / 无重复入历史 ✓
- 用户选色流程：`change` → handler 读 `el.value`（所选）→ `onCommit` → store 更新 → 重渲染 → `syncValue`=所选 → effect 见 `el.value`==`syncValue` → 空操作，不与用户选色打架 ✓

**替代方案**：
- 受控 `value` + `onChange={() => {}}`（原变更）→ React 还原所选色，`change` 读旧值，缺陷（被本变更修复）。
- 受控 `value` + `onChange` 内 setState → 重新引入连续选色（拖拽期间每个 `input` 事件都写 store / 历史），违背原变更目标。
- 非受控 `defaultValue` 无同步 effect → 点击 colorHistory 色块后 input 色块不刷新（原变更否决理由，确实存在）。

### 2. `syncValue` 用 `el.value` 直接写，用 `useEffect` 而非 `useLayoutEffect`

**选型**：普通 `useEffect([syncValue])`，`if (el.value.toLowerCase() !== syncValue.toLowerCase()) el.value = syncValue`。

- 大小写不敏感比较，兼容浏览器对 `#rrggbb` 的大小写归一化差异。
- 用 `useEffect` 而非 `useLayoutEffect`：6×6 色块在切换选中曲线时的 1 帧闪烁可忽略；保持与 hook 其余部分一致、避免过度设计。

**替代方案**：`useLayoutEffect` 可在绘制前同步、消除切换曲线时的 1 帧闪烁——仅在用户观察到闪烁时再切换。

### 3. 条件渲染 input 的 ref 与 deps

**选型**：沿用原变更——`change` 监听器 effect 用 `deps`（`[]` 始终挂载 / `[selectedCurveId]` 条件渲染重挂），`syncValue` effect 用 `[syncValue]`。切换选中曲线 A→B 时 input 被 reconcile（非重挂），`defaultValue` 不再应用，`syncValue` 变化触发 effect 写入 B 的颜色补齐；A→null 卸载时 `ref.current=null`，两 effect 均有 `if (!el) return` 守卫；null→A 挂载时 `defaultValue` 初始生效、`syncValue` effect 见相等即空操作。

## Risks / Trade-offs

- **[Risk] 切换选中曲线时 input 色块有 1 帧闪烁** → `useEffect` 在绘制后同步；6×6 色块可忽略，必要时改 `useLayoutEffect`。
- **[Risk] 主规约在修复时被直接改动（绕过变更流程）** → 本变更的 delta 为 `MODIFIED`（与当前主规约一致），同步 / 归档时幂等；本变更用于补齐文档。
- **[Trade-off] 真实症状无法自动化复现** → Playwright 驱动不了原生取色器弹窗，且合成事件不触发 React 值追踪；`e2e/color-picker-commit.spec.ts` 仅钉住"`change` 提交"契约（合成 `change` 仍经原生监听器触发并提交），真实"无法确认选择"症状需真人复现。

## Migration Plan

无部署 / 迁移（纯前端 React hook 调整）。实现已完成（`useColorCommit.ts`、`LabelStyleControls.tsx`、`CurveStylePanel.tsx`、主规约均已改）；本变更为补齐 OpenSpec 文档，`tasks.md` 项已落地。回滚策略即 `git revert` 对应提交。

## Open Questions

无（实现与规约已对齐）。
