## 1. `useColorCommit` hook

- [x] 1.1 新建 `src/components/ui/useColorCommit.ts`：返回 `ref`，`useEffect` 挂 `addEventListener('change', handler)`，`commitRef` 存储最新 `onCommit` 回调，`deps` 参数控制重挂时机
- [x] 1.2 handler 读 `input.value` 调 `commitRef.current(input.value)`；cleanup 时 `removeEventListener`

## 2. `LabelStyleControls` 接线

- [x] 2.1 文字颜色 `input`：`ref={textColorRef}`，`value={toHexColor(labelStyle.color)}`，`onChange={() => {}}`；`textColorRef = useColorCommit(c => { addColorToHistory(c); setLabelStyle({color: c}); })`
- [x] 2.2 背景颜色 `input`：`ref={bgColorRef}`，`value={toHexColor(labelStyle.backgroundColor)}`，`onChange={() => {}}`；`bgColorRef = useColorCommit(c => { addColorToHistory(c); setLabelStyle({backgroundColor: c}); })`

## 3. `CurveStylePanel` 接线

- [x] 3.1 全局默认颜色 `input`：`ref={globalColorRef}`，`value={toHexColor(lineStyle.color)}`，`onChange={() => {}}`；`globalColorRef = useColorCommit(c => { addColorToHistory(c); setLineStyle({color: c}); })`
- [x] 3.2 单条覆盖颜色 `input`：`ref={overrideColorRef}`，`value={toHexColor(override?.color ?? lineStyle.color)}`，`onChange={() => {}}`，`disabled={!isOverridden('color')}`；`overrideColorRef = useColorCommit(c => { if (!selectedCurveId) return; addColorToHistory(c); setCurveLineStyle(selectedCurveId, {color: c}); }, [selectedCurveId])`（`[selectedCurveId]` dep 因 input 条件渲染需重挂）

## 4. 回归回路

- [x] 4.1 新建 `e2e/color-picker-commit.spec.ts`：定位「文字颜色」`input`，dispatch 合成 `input` 事件（5 个不同色值，无 `change`）→ 断言 store 不变；dispatch 合成 `change` 事件（`#600000`）→ 断言 store 落到 `#600000`
- [x] 4.2 修复前 RED（合成 `change` 不提交，store 停在 `#333333`）；修复后 GREEN（原生 `change` 监听器触发，store 落到 `#600000`）

## 5. 验证

- [x] 5.1 `npx tsc --noEmit` 通过
- [x] 5.2 `npx vitest run` 120/120 通过
- [x] 5.3 `npx playwright test` 全量 e2e 9/9 通过（含新增回归回路）