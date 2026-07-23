## 1. `useColorCommit` hook

- [x] 1.1 新增可选第三参数 `syncValue?: string`
- [x] 1.2 新增 `useEffect([syncValue])` 同步 effect：`if (!el || syncValue == null) return;` 守卫 + `el.value.toLowerCase() !== syncValue.toLowerCase()` 时 `el.value = syncValue`
- [x] 1.3 重写 JSDoc：要求 input 必须非受控 `defaultValue`，解释受控 `value` + `onChange={()=>{}}` 为何在 `input` 事件时还原 `el.value`、使 `change` 监听器读到旧值

## 2. `LabelStyleControls`

- [x] 2.1 文字颜色 input：`value`+`onChange={()=>{}}` → `defaultValue`；`useColorCommit` 传 `toHexColor(labelStyle.color)` 作 `syncValue`
- [x] 2.2 背景颜色 input：同上，传 `toHexColor(labelStyle.backgroundColor)`

## 3. `CurveStylePanel`

- [x] 3.1 全局颜色 input：`value`+`onChange={()=>{}}` → `defaultValue`；`useColorCommit` 传 `toHexColor(lineStyle.color)` 作 `syncValue`
- [x] 3.2 单条覆盖颜色 input：同上，传 `toHexColor(override?.color ?? lineStyle.color)`，保留 `[selectedCurveId]` dep

## 4. 规约与验证

- [x] 4.1 修正主规约 `openspec/specs/color-picker-commit/spec.md`：需求由"受控 `value` + `onChange={()=>{}}`"改为"非受控 `defaultValue` + `syncValue` 同步"；"点击历史色块仍生效"场景措辞改由 `syncValue` effect 保证
- [x] 4.2 `npx tsc --noEmit` 通过（clean）
- [x] 4.3 `npx vitest run` 通过（16 文件 / 130 测试）
- [x] 4.4 `e2e/color-picker-commit.spec.ts` 契约不变（合成 `change` 仍经原生监听器提交）；真实"无法确认选择"症状需真人复现（Playwright 驱动不了原生取色器弹窗 + 合成事件不触发 React 值追踪）
