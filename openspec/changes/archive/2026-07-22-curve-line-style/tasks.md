## 1. 类型与数据模型

- [x] 1.1 `src/types/curve.ts`：新增 `LineType = 'solid'|'dashed'|'dotted'`、`LineStyle = { width: number; type: LineType; color: string }`、`DEFAULT_LINE_STYLE: LineStyle = { width: 1.5, type: 'solid', color: '#000000' }`
- [x] 1.2 `src/types/curve.ts`：`CurveData` 删除 `color?: string`，新增 `lineStyle?: Partial<LineStyle>`
- [x] 1.3 `src/types/index.ts`：re-export `LineStyle`、`DEFAULT_LINE_STYLE`、`LineType`

## 2. 级联解析 helper

- [x] 2.1 新建 `src/components/chart/resolveLineStyle.ts`：`resolveLineStyle(override, defaultStyle): LineStyle`（`return { ...defaultStyle, ...(override ?? {}) }`）
- [x] 2.2 同文件导出 `mapLineTypeToPptxDash(type: LineType): 'solid'|'dash'|'dot'|undefined`（solid→undefined）

## 3. uiStore 全局默认

- [x] 3.1 `src/store/uiStore.ts`：新增 `lineStyle: LineStyle`（初值 `{...DEFAULT_LINE_STYLE}`）、`setLineStyle: (patch: Partial<LineStyle>) => void`（镜像 `setLabelStyle`）
- [x] 3.2 `resetUiForNewWorkspace` 不重置 `lineStyle`（与 `labelStyle` 一致）

## 4. curveStore 每条覆盖

- [x] 4.1 `src/store/curveStore.ts`：新增 `setCurveLineStyle(id, patch: Partial<LineStyle>)`（合并写入 `curves[id].lineStyle`）、`clearCurveLineStyle(id)`（删除 `curves[id].lineStyle`）
- [x] 4.2 `addCurves`：移除 `color: '#000000'`，新曲线不带 `lineStyle`
- [x] 4.3 移除废弃的 `setCurveColor` action 及接口声明

## 5. 渲染器接线

- [x] 5.1 `src/components/chart/WaterfallChart.tsx`：订阅 `const lineStyle = useUiStore((s) => s.lineStyle)`
- [x] 5.2 series.map 内 `const { width, type, color } = resolveLineStyle(curve.lineStyle, lineStyle)`，写入 `lineStyle: { color, width, type }` 与 `itemStyle: { color }`（替换写死的 `width: 1.5` 与 `curve.color || '#000000'`）
- [x] 5.3 option useMemo deps 末尾增加 `lineStyle`

## 6. 工具箱面板

- [x] 6.1 新建 `src/components/toolbox/CurveStylePanel.tsx`：顶部「全局默认」区——粗细 slider(0.5–6 step 0.5)、线型 3 按钮(实/虚/点)、颜色(内联 `<input type=color>` + colorHistory swatches，写 `setLineStyle` + `addColorToHistory`)
- [x] 6.2 「当前选中曲线」子区——读 `selectedCurveId` + `curves`；无选中显示「点击曲线以编辑单条覆盖」
- [x] 6.3 每字段一行「使用全局默认」复选框：勾选=删除该字段覆盖；取消勾选=以当前全局值为初值写入覆盖；控件随复选框启用/禁用
- [x] 6.4 底部「重置为全局」按钮 → `clearCurveLineStyle(id)`

## 7. RightPanel 接线

- [x] 7.1 `src/components/layout/RightPanel.tsx`：Accordion 在 `labelStyle` 后插入 `{ id:'curveStyle', title:'曲线样式', content:<CurveStylePanel/>, defaultExpanded:true }`
- [x] 7.2 折叠态加 `CurveStyleIcon` 快捷按钮（Tooltip「曲线样式」→ `expandAndScrollTo('曲线样式')`），位于「标签样式」图标下方
- [x] 7.3 `src/components/ui/icons.tsx`：新增 `CurveStyleIcon`

## 8. CurveList 色点重指向

- [x] 8.1 `src/components/data/CurveList.tsx`：`setCurveColor` → `setCurveLineStyle`；色点 `backgroundColor` 读 `curve.lineStyle?.color ?? lineStyle.color`（订阅 uiStore.lineStyle）
- [x] 8.2 ColorPanel `onChange`/`onConfirm` 改写 `setCurveLineStyle(panelCurveId, { color: c })`；色点 title 改「点击修改颜色（覆盖全局）」

## 9. PPTX 导出

- [x] 9.1 `src/components/chart/exportPptx.ts`：`addCustGeom` 签名加 `dashType?: string`，内部 `line: { color, width, ...(dashType ? {dashType} : {}) }`
- [x] 9.2 循环内 `const globalLineStyle = useUiStore.getState().lineStyle`；`const { width, type, color } = resolveLineStyle(curve.lineStyle, globalLineStyle)` 替换 `const color = curve.color || '#000000'`
- [x] 9.3 `addCustGeom` 调用传 `mapLineTypeToPptxDash(type)`
- [x] 9.4 legend `addLine`（约 line 284）width 用解析后 `width`，dashType 同样映射；`visibleCurveColors` 改存解析后 color

## 10. 持久化迁移

- [x] 10.1 `src/persistence/index.ts`：`buildWorkspaceSnapshot` `version: 3`，`curves` 直接序列化
- [x] 10.2 `applyWorkspaceSnapshot`：遍历 curves，`version < 3` 且曲线有顶层 `color` 无 `lineStyle.color` 时搬入 `lineStyle.color` 并删顶层 `color`；`version` 默认 `?? 2`
- [x] 10.3 UI 快照：`saveWorkspace` 写 `lineStyle: uiState.lineStyle`；`restoreWorkspace` `useUiStore.setState({..., lineStyle: uiSnapshot.lineStyle ?? DEFAULT_LINE_STYLE})`
- [x] 10.4 `initPersistence` uiStore subscribe diff 增 `state.lineStyle !== prev.lineStyle`

## 11. 测试

- [x] 11.1 新建 `src/components/chart/__tests__/resolveLineStyle.test.ts`：空覆盖、部分覆盖、全覆盖、`mapLineTypeToPptxDash` 三映射
- [x] 11.2 `src/store/__tests__/curveStore.test.ts`：`setCurveLineStyle` 合并、`clearCurveLineStyle` 删除、`addCurves` 不带 lineStyle/color
- [x] 11.3 `src/persistence/__tests__/index.test.ts`：v2 快照(含顶层 color)迁移到 v3 lineStyle.color；v3 快照往返；UI 快照含 lineStyle 往返
- [x] 11.4 修旧 `color` 引用：`src/components/chart/__tests__/curveScaleMath.test.ts` 等改 `lineStyle:{color:'#000'}`

## 12. 验证

- [x] 12.1 `npx tsc --noEmit` 通过
- [x] 12.2 `npx vitest run` 通过
- [x] 12.3 手动：全局改粗细/线型/颜色→所有曲线同步；选中曲线取消某字段「使用全局」→仅该曲线该字段变；重置为全局恢复；左侧色点改色→该曲线颜色覆盖不影响全局；PNG 与 PPTX 颜色/粗细/线型一致；旧 v2 工作区刷新后曲线颜色不丢失
