## ADDED Requirements

### Requirement: 内联取色器提交时机

工具箱面板中的内联 `<input type="color">` 取色器 SHALL 在原生 `change` 事件（取色器关闭 / 指针释放）时提交所选颜色到 store，SHALL NOT 在拖拽期间（原生 `input` 事件持续触发）写 store。提交 SHALL 通过 `useColorCommit` hook 实现：在 input ref 上挂载 `addEventListener('change', handler)`，handler 读 `input.value` 调 `onCommit` 回调。`onCommit` SHALL 通过 `commitRef` 保持最新引用，避免闭包过期和重挂颠簸。input SHALL 保持 `value` 受控 + `onChange={() => {}}` 以维持显示同步（如点击 colorHistory 色块）并吞掉连续 `input` 事件。

#### Scenario: 拖拽取色器不更新图表

- **WHEN** 用户在取色器弹窗中拖拽选色
- **THEN** 取色器色块（input 自身）实时显示拖拽色，但 store 颜色不变、图表 / 图例 / 曲线不刷新

#### Scenario: 取色器关闭时提交一次

- **WHEN** 用户在取色器弹窗中拖拽到某个颜色后抬起鼠标 / 关闭取色器
- **THEN** store 颜色更新为最终所选颜色，图表 / 图例 / 曲线刷新一次

#### Scenario: 颜色历史仅写入一次

- **WHEN** 用户拖拽取色器后关闭（`change` 事件触发）
- **THEN** `addColorToHistory` 被调用一次，最终所选颜色出现在历史队首，历史不被中间色污染

#### Scenario: 点击历史色块仍生效

- **WHEN** 用户点击 colorHistory 区域中的色块
- **THEN** store 颜色更新为所选颜色，input 色块同步刷新（受控 `value` 保证）

#### Scenario: 条件渲染的取色器正确挂载

- **WHEN** 取色器 input 在条件渲染块中（如 `CurveStylePanel` 单条覆盖颜色仅在选中曲线时渲染），且 `useColorCommit` 传入 `deps`（如 `[selectedCurveId]`）
- **THEN** 取色器首次渲染时 `change` 监听器挂载，选中曲线切换时监听器重挂到新 input 元素

### Requirement: 回归回路

系统 SHALL 通过 e2e 回路（`e2e/color-picker-commit.spec.ts`）验证取色器提交契约：合成 `input` 事件（5 个不同色值，无 `change`）SHALL NOT 改变 store 颜色；合成 `change` 事件（`#600000`）SHALL 使 store 颜色落到 `#600000`。回路 SHALL 通过 dev-only `window.__autospectra.getUiState()` 读取 store。

#### Scenario: 合成 input 事件不提交

- **WHEN** 回路向「文字颜色」input dispatch 5 个合成 `input` 事件（`#100000` 到 `#500000`），不 dispatch `change`
- **THEN** `useUiStore.getState().labelStyle.color` 保持初始值不变

#### Scenario: 合成 change 事件提交

- **WHEN** 回路向同一 input dispatch 合成 `change` 事件（值 `#600000`）
- **THEN** `useUiStore.getState().labelStyle.color` 更新为 `#600000`