## 1. 状态层

- [x] 1.1 移除 `uiStore.ts` 中 `activeScaledCurveId` 的 `setActiveScaledCurveId` 调用路径检查（保留状态，仅在使用处调整）

## 2. 新建 ScaleSlider 组件

- [x] 2.1 新建 `src/components/chart/ScaleSlider.tsx`：接收 `curveId`、`curves`、`offsets`、`curveScales`、`xRange`、`chartWidth/Height`、`gridLeft/Right/Top/Bottom`、`layerYOffset`、`convertYToPixel`、`setCurveScale`、`onDeselect` props
- [x] 2.2 渲染垂直滑条轨道（细长 div，`absolute` 定位），定位在 `gridLeft - 24` 处
- [x] 2.3 渲染圆形滑块（`cursor: ns-resize`），滑块位置由当前倍率映射到轨道 Y 坐标
- [x] 2.4 滑条旁渲染倍率数值标签（`×1.0`）
- [x] 2.5 实现拖拽逻辑：`mousedown` → `mousemove` 更新 `displayScale`（预览）→ `mouseup` 提交 `setCurveScale`（`pendingScaleRef` 避免闭包）
- [x] 2.6 倍率映射：滑块 Y 位置 → 对数映射 `10 ^ (progress * 2 - 1)`，钳制 [0.1, 10.0]
- [x] 2.7 Esc 键取消选中

## 3. 移除 ScaleHandle + 集成 ScaleSlider

- [x] 3.1 删除 `src/components/chart/ScaleHandle.tsx`
- [x] 3.2 `WaterfallChart.tsx`：移除 `onChartClick`、`onEvents` 中的 `click` 事件、`ScaleHandle` 导入和渲染
- [x] 3.3 `WaterfallChart.tsx`：导入 `ScaleSlider`，在 `yScaleToolMode && activeScaledCurveId` 时渲染
- [x] 3.4 `WaterfallChart.tsx`：传递 `selectedLayerYOffset` 到 `ScaleSlider`

## 4. 曲线列表选中

- [x] 4.1 `CurveList.tsx`：在 `handleCurveClick` 中，当 `yScaleToolMode` 为 true 时设置 `activeScaledCurveId` 而非 `selectedCurveId`
- [x] 4.2 添加 `yScaleToolMode` 和 `setActiveScaledCurveId` 的 store 绑定

## 5. 验证

- [x] 5.1 `npx tsc --noEmit --pretty` 无错误
- [x] 5.2 `npx vitest run` 全部通过
- [x] 5.3 手动验证：Y 缩放模式 → 点击曲线列表行 → 左侧滑条出现 → 拖拽滑块 → 曲线实时缩放 → mouseup 提交
