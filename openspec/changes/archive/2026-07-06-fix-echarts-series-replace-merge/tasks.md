## 1. 回退 curveStore 修改

- [x] 1.1 从 `addCurves` 中移除 `visibleCurves` 的初始化逻辑（`visibleCurves[id] = true`），恢复 spec 定义的"上传曲线默认不渲染"行为
- [x] 1.2 从 `addCurves` 的返回值中移除 `visibleCurves` 字段

## 2. 修复 WaterfallChart 渲染策略

- [x] 2.1 将 `ReactECharts` 的 `notMerge={true}` 改为 `replaceMerge={['series']}`
- [x] 2.2 确认 `replaceMerge` 类型在 `echarts-for-react` v3 中受支持

## 3. 验证

- [x] 3.1 运行 `npx tsc --noEmit` 确认 TypeScript 编译通过
- [x] 3.2 手动验证：取消勾选曲线后，对应 series 从图表中移除
- [x] 3.3 手动验证：删除曲线后，对应 series 从图表中移除
- [x] 3.4 手动验证：dataZoom 缩放状态在曲线变更后保持
- [x] 3.5 手动验证：对齐算法执行后 dataZoom 状态不变，偏置不累积