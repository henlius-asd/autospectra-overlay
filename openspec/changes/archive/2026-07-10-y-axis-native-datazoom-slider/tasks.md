## 1. 纯函数与状态基础

- [x] 1.1 新建 `src/components/chart/yZoomRange.ts`，实现 `normalizeYZoomRange(lo, hi, bounds: {rawDataMin, rawDataMax, dataSpan}): [number, number]`（min/max 顺序、clamp 到 `[rawDataMin, rawDataMax]`、最小段 5% dataSpan），迁移自 `resolveYAxis` 的 clamp 逻辑
- [x] 1.2 新建 `src/components/chart/__tests__/yZoomRange.test.ts`，覆盖：null 不处理（在调用方）、正常段、超界 clamp、反向规整、退化 dataSpan、最小段强制
- [x] 1.3 确认 `uiStore.yZoomRange`/`setYZoomRange`/`resetYZoomRange` 语义不变（写入方将改为 datazoom 事件，本任务只确认接口）

## 2. WaterfallChart 接线

- [x] 2.1 恢复 `getYAxisExtent()`（读 `chartInstance.getModel().getComponent('yAxis',0).axis.scale.getExtent()`），供 `convertYToPixel` 使用
- [x] 2.2 `yAxis.min/max` 改回 `rangeResult.yAxisMin/yAxisMax`（全量范围），移除 `resolvedFrame` 作为 yAxis 边界的用法
- [x] 2.3 `convertYToPixel` 改读 `getYAxisExtent()` + grid 常量经 `yToPixel` 换算；移除对 `resolvedFrame` 的依赖
- [x] 2.4 `dataZoom` 配置增 Y 项：`{ id: 'yZoom', type: 'inside', yAxisIndex: 0, filterMode: 'none', minValueSpan: <0.05*dataSpan> }` + `{ id: 'yZoomSlider', type: 'slider', yAxisIndex: 0, orient: 'vertical', left: <gridLeft-margin>, width: 14, filterMode: 'none', minValueSpan: <0.05*dataSpan> }`；当 `yZoomRange` 非空时设 `startValue/endValue`（经 `normalizeYZoomRange` clamp）
- [x] 2.5 `onDataZoom` 增 Y 分支：从事件 `batch` 按 `dataZoomId`（`yZoom`/`yZoomSlider`）取 `startValue/endValue`，经 `normalizeYZoomRange` 规整后 `setYZoomRange`；X 分支不变
- [x] 2.6 data 变化 clamp：option useMemo 内，若 `yZoomRange` 越出新 `rawDataMin/Max`，clamp 后再传 dataZoom `startValue/endValue`
- [x] 2.7 移除 `YRangeSlider` 的 import、挂载与相关 props；删除 `resolvedFrame` useMemo（若不再被其他处使用）

## 3. 删除旧组件与冗余

- [x] 3.1 `git rm src/components/chart/YRangeSlider.tsx`
- [x] 3.2 删除 `src/components/chart/resolveYAxis.ts` 及 `__tests__/resolveYAxis.test.ts`（clamp 逻辑已迁移到 `yZoomRange.ts`）；移除 WaterfallChart/exportImage 中对 `resolveYAxis`/`ResolvedYAxis`/`YAxisFullRange` 的引用
- [x] 3.3 grep 确认 `YRangeSlider`/`resolveYAxis`/`resolvedFrame` 在 `src` 无残留引用

## 4. 每曲线缩放 overlay 适配

- [x] 4.1 `CurveScaleOverlay` 可见 Y frame 改为来自 `convertYToPixel` 的 model extent（或由 WaterfallChart 传入基于 `getYAxisExtent` 的 frame），移除 `resolvedFrame`/`fullRange` props 中不再需要者
- [x] 4.2 确认 `curveScaleMath` 的 `offsetByDrag`/`scaleByDrag` 语义不变（delta-based，frame 来源改变不影响 delta）
- [x] 4.3 更新 `__tests__/curveScaleMath.test.ts` 若 frame 类型签名变化

## 5. PNG 导出适配

- [x] 5.1 `exportImage.ts`：导出临时 option 的 inside dataZoom 增 `{ id: 'yZoomInside', type: 'inside', yAxisIndex: 0, filterMode: 'none' }`，保留当前 Y dataZoom 的 `startValue/endValue`
- [x] 5.2 `exportImage.ts` Y 像素换算（`yToPixelExport`）改读导出后 model 的 yAxis extent（dataZoom 调整后的可见范围）
- [x] 5.3 还原逻辑确认 X/Y dataZoom slider 及缩放位置均还原

## 6. 验证与回归

- [x] 6.1 `npx vitest run` 全绿（含新 `yZoomRange` 测试，移除的 `resolveYAxis` 测试已删）
- [x] 6.2 `npx tsc --noEmit` 干净（无 unused 残留）
- [x] 6.3 `npm run build` 成功
- [x] 6.4 人工回归：Y slider 拖手柄/中间平移/滚轮/双击复位且手柄随边界移动；标签与 brace 跟随 Y 框选；带 Y 框选导出 PNG 与屏幕一致；每曲线缩放仍贴曲线；旧工作区导入 `yZoomRange=null` 不报错；竖向 slider 不压 Y 轴刻度