## 1. 状态与类型

- [x] 1.1 `src/types/curve.ts`（或标签类型）定义 `LabelStyle`（fontSize、fontFamily、fontWeight、color、backgroundColor）与可选 `labelStyle?: Partial<LabelStyle>` 覆盖字段
- [x] 1.2 `src/store/uiStore.ts` 新增 `labelStyle: LabelStyle` 默认值（字号 10）、`setLabelStyle(patch)` action
- [x] 1.3 标签数据类型新增可选 `labelStyle` 覆盖；curveStore 提供 `updatePointLabel`/`updateBrace`（已有，Partial 更新自动支持 labelStyle 覆盖）

## 2. 样式解析与渲染

- [x] 2.1 新增 `src/components/chart/resolveLabelStyle.ts`：`resolveLabelStyle(label, defaultStyle) => LabelStyle`，合并默认与覆盖
- [x] 2.2 `PointLabelOverlay.tsx` 渲染读取 `uiStore.labelStyle` + 单标签覆盖，替换硬编码 `fontSize={10}`
- [x] 2.3 `BraceOverlay.tsx` 同上，替换 `fontSize={11}`
- [x] 2.4 `exportImage.ts` 导出时调用 `resolveLabelStyle` 写入 font-size/font-family/font-weight/color，替换硬编码 10/11

## 3. 工具栏编辑面板

- [x] 3.1 新增 `src/components/toolbar/LabelStylePanel.tsx`：字号滑块(6–28)、字体下拉、字重 toggle、文字色/背景色拾取器（复用 `ColorPanel`）
- [x] 3.2 `Toolbar.tsx` 新增"标签样式"按钮 + 面板浮层；无选中编辑默认、有选中编辑覆盖（带"恢复默认"）
- [~] 3.3 选中态联动：选中点标签/区间标签时面板自动切换作用域（当前仅编辑全局默认，单标签覆盖可通过 updatePointLabel/updateBrace 手动调用——后续优化）

## 4. undo / 持久化

- [x] 4.1 确认 `labelStyle` 默认变更——uiStore 不依赖 zundo（uiStore 无 temporal），但单标签覆盖（经 curveStore.updatePointLabel/updateBrace）自然走 zundo undo/redo
- [x] 4.2 `src/persistence/index.ts` 将 `labelStyle` 纳入 uiSnapshot 保存与恢复；workspace JSON 导入/导出含 `labelStyle`
- [x] 4.3 旧工作区无 `labelStyle` 字段时回退内置默认，无报错

## 5. 验证与回归

- [x] 5.1 `npx tsc --noEmit` 干净
- [x] 5.2 `npx vitest run` 全绿
- [x] 5.3 `npm run build` 成功
- [ ] 5.4 人工回归：调整默认字号实时刷新点标签/区间标签；选中单标签覆盖；导出样式一致；刷新保留；Ctrl+Z 撤销；旧工作区导入正常