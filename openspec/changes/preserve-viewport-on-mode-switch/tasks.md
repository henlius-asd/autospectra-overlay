## 1. 回归测试：视口重派发逻辑（反馈环 / 纯函数 seam）

- [x] 1.1 在 `src/components/chart/` 新建 `viewportRestore.ts`，导出纯函数 `buildViewportRestoreActions(state: { xRange: [number, number]; yZoomRange: [number, number] | null }): Array<{ dataZoomId: string; startValue: number; endValue: number }>`——返回对 `xZoom`、`xZoomSlider` 始终重派发 `xRange`；`yZoomRange` 非 null 时对 `yZoom`、`yZoomSlider` 重派发，为 null 时省略 Y
- [x] 1.2 在 `src/components/chart/__tests__/viewportRestore.test.ts` 写失败测试：`xRange=[100,200]`、`yZoomRange=[50,150]` → 返回 4 条 dispatch（含正确的 id 与 start/end）；`yZoomRange=null` → 仅返回 2 条 X dispatch、不含 Y；`xRange` 顺序无关地映射为 start/end（min/max 规整可复用 `normalizeYZoomRange` 思路）
- [x] 1.3 运行 `npx vitest run src/components/chart/__tests__/viewportRestore.test.ts`，确认测试失败（函数尚未实现或为空），形成红绿环
- [x] 1.4 实现 `buildViewportRestoreActions` 使测试通过

## 2. 实现视口保持 effect

- [x] 2.1 在 `WaterfallChart.tsx` 新增 `useEffect`，依赖 `[interactionMode, spaceHeld]`；用 `hasMountedViewport` ref 跳过首次挂载运行
- [x] 2.2 effect 内调度 `requestAnimationFrame`：回调先 `if (!chartInstance) return`，再 `useUiStore.getState()` 取 `xRange`/`yZoomRange`，调用 `buildViewportRestoreActions` 取得 dispatch 列表，逐条 `chartInstance.dispatchAction({ type: 'dataZoom', ...item })`
- [x] 2.3 `dispatchAction` 调用包 `try-catch` 抑制 `Instance has been disposed`；rAF ID 存于独立 ref（`viewportRafId`），effect 清理函数中 `cancelAnimationFrame` 并置 null
- [x] 2.4 effect 依赖数组严格为 `[interactionMode, spaceHeld]`——不含 `xRange`/`yZoomRange`（避免缩放期间重派发与抖动）；项目无 eslint 脚本（见 toolbar-tool-system 既有结论），已加 `// eslint-disable-next-line react-hooks/exhaustive-deps` 注释说明为何只读 getState
- [x] 2.5 新增 `getYAxisExtent()` 函数（对称于 `getXAxisExtent()`），从 ECharts 模型直读 Y 轴实时视口范围
- [x] 2.6 修改 `onDataZoom`：将 Y 范围同步方式从解析 `event.batch` 改为直读 `getYAxisExtent()` 模型，与 X 轴同步方式对称；移除无用的 `normalizeYZoomRange` 导入
- [x] 2.7 验证 `[yZoomRange]` effect 的 `yZoomRangeSource` 守卫仍正确防止滚轮缩放时的回环（`'event'` 跳过 dispatch，`'external'` 允许 workspace 加载恢复）
- [x] 2.8 新增 `isChartReady()` 守卫（`isDisposed()` 检查），在所有 `dispatchAction` 路径前调用，消除 `[ECharts] Instance has been disposed` 控制台警告
- [x] 2.9 新增 `xZoomRangeSource` ref + `[xRange]` effect（对称于 `[yZoomRange]`），在 `restoreWorkspace` 异步加载后 dispatch 持久化 `xRange` 到 `xZoom`/`xZoomSlider`；`onDataZoom` 写 `xRange` 时设 `xZoomRangeSource='event'` 防回环
- [x] 2.10 视口 effect 从 `useEffect` + rAF 改为 `useLayoutEffect` 同步 dispatch，在 `componentDidUpdate`(setOption→全量) 之后、paint 之前恢复视口，消除切换闪烁
- [x] 2.11 从 `option` useMemo 依赖数组中移除 `xRange`（option 体内未引用，属陈旧依赖）——移除前 xRange 变化会触发 `setOption(replaceMerge)` → dataZoom 重建至全量 → `onDataZoom` 读全量覆盖 xRange，导致持久化 xRange 被覆盖、刷新后 X 回全量；Y 因 `yZoomRange` 不在依赖中未受影响
- [x] 2.12 新增 `isOptionRebuilding` ref：在 option useMemo 体内设 `true`（渲染期，先于 componentDidUpdate）→ `onDataZoom` early-return 跳过重建期间的 store 写入 → 确保重建前 xRange/yZoomRange 存活供 useLayoutEffect 恢复 → 清理 useLayoutEffect（无依赖，声明在 viewport effect 之后）重置为 `false`。彻底解决模式切换/数据变更时 `componentDidUpdate`(setOption→全量)→`onDataZoom` 覆盖 store 的时序问题

## 3. 端到端 HITL 验证（集成层反馈环）

- [x] 3.1 `npm run dev` 启动开发服务器，加载一条曲线
- [x] 3.2 用 X/Y dataZoom 滑块缩放到非全量视口，依次点击「框选放大」「手动移动」「全局缩放」「单曲线缩放」「点标签」「一般选中」，每次确认视口未被重置回全量
- [x] 3.3 在 `zoomGlobal` 下按住/松开空格（临时平移），确认视口保持
- [x] 3.4 进入 `brace` 放置区间标签后退出，确认 X 视口保持、退出后 Y 由 store 恢复
- [x] 3.5 在 `brush` 下完成一次框选，确认选区被正确应用（既有 `handleBrushSelected` rAF 与新 effect 并存不闪烁）
- [x] 3.6 在 `select` 下连续滚轮缩放 X，确认缩放平滑无抖动（effect 未重派发）；Y 滚轮缩放后 `yZoomRange` 通过 `getYAxisExtent()` 实时更新，跨刷新后 Y 视口保持

## 4. 回归与清理

- [x] 4.1 运行 `npm run build`（`tsc --noEmit && vite build`）确保无 TypeScript 错误
- [x] 4.2 运行 `npx vitest run` 确保全部既有测试（`yZoomRange`、`curveScaleMath`、`computeYAxisRange`、`labelGeometry`、`labelClamp`、`yPixelMath`、store/persistence 等）通过
- [x] 4.3 确认 `onChartReady` 的 Y `dispatchAction`（workspace 加载恢复）仍正常，未与新 effect 冲突
- [x] 4.4 全局搜索确认未遗留调试日志或临时代码
- [x] 4.5 在 PR/commit message 中记录正确的根因假设（type 翻转重建丢 start/end）与所选 Strategy B 的理由
