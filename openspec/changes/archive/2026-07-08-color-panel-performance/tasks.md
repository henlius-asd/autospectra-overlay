## 1. 状态层

- [x] 1.1 `uiStore.ts` 新增 `colorHistory: string[]` 状态（初始 `[]`）和 `addColorToHistory(color: string)` action（去重、最多 8 个、头部插入）
- [x] 1.2 `Toolbar.tsx` 导出 JSON 包含 `colorHistory`，导入时恢复 `colorHistory: data.colorHistory ?? []`

## 2. 颜色面板组件

- [x] 2.1 新建 `src/components/data/ColorPanel.tsx`：接收 `color`（当前颜色）、`colorHistory`、`onSelect(color)`、`onClose()` props
- [x] 2.2 渲染预设颜色行（11 个固定色块，包括 `#000000`）
- [x] 2.3 渲染历史颜色行（`colorHistory` 非空时显示，最多 8 个色块）
- [x] 2.4 渲染"自定义..."按钮，通过 `useRef` + `useEffect` 绑定原生 `<input type="color">` 的 `change` 事件（关闭时触发），拖拽过程不触发 `onSelect`
- [x] 2.5 面板使用 `fixed` 定位，基于触发色块 `getBoundingClientRect()` 计算位置，下方显示（空间不足时上方）
- [x] 2.6 面板外部点击关闭：`useEffect` 中 document `mousedown` 监听，点击面板外调用 `onClose`
- [x] 2.7 Esc 键关闭面板
- [x] 2.8 单击预设/历史色块：调用 `onSelect(color)` 关闭面板

## 3. 曲线列表集成

- [x] 3.1 `CurveList.tsx`：移除内嵌 `<input type="color">` 元素，色块点击改为打开 ColorPanel
- [x] 3.2 新增 `panelCurveId` 状态（`string | null`），控制面板显示在哪条曲线
- [x] 3.3 色块 `onSelect` 回调中调用 `setCurveColor` + `addColorToHistory` + 关闭面板
- [x] 3.4 移除未使用的 `CURVE_COLORS` 导入（如已移除则跳过）

## 4. 验证

- [x] 4.1 `npx tsc --noEmit --pretty` 无错误
- [x] 4.2 `npx vitest run` 全部通过
- [x] 4.3 手动验证：点击色块 → 面板弹出 → 单击预设色块 → 颜色立即应用无卡顿
- [x] 4.4 手动验证：点击自定义 → 拖拽不触发渲染 → 关闭时应用颜色
