## Why

取消勾选曲线或删除曲线后，ECharts 图表中曲线仍残留显示，不会从中间工作区移除。根本原因是 `echarts-for-react` 默认 `notMerge={false}`，ECharts 将新 option 与旧 option 合并时，旧 series 数组中的多余项不会被清除。直接使用 `notMerge={true}` 会破坏 dataZoom 缩放状态，进而影响对齐算法的 ROI 同步，导致对齐偏置异常。

## What Changes

- 将 `WaterfallChart.tsx` 中 `ReactECharts` 的渲染策略从默认 `notMerge={false}` 改为 `replaceMerge={['series']}`，仅替换 series 数组而保持其他组件（dataZoom、xAxis、yAxis 等）的 merge 行为
- 回退之前对 `addCurves` 中 `visibleCurves` 初始化逻辑的修改，保持与现有 spec 一致（上传曲线默认不渲染）

## Capabilities

### New Capabilities

- `echarts-series-replace-merge`: 确保 ECharts 图表在曲线可见性变更或删除时正确更新 series 数组，同时保留 dataZoom 等交互状态

### Modified Capabilities

<!-- 此项为纯实现修复，不涉及 spec 级别需求变更。curve-visibility-control 和 curve-deletion 的 spec 已正确定义行为，本次仅修复实现使其符合现有 spec。 -->

## Impact

- 受影响文件: `src/components/chart/WaterfallChart.tsx`、`src/store/curveStore.ts`
- 不影响对齐算法 `src/engine/alignment.ts` 和 `AlignmentControls` 组件
- 不影响 dataZoom 缩放行为和 BraceOverlay 坐标转换
- 不影响 `zundo` 撤销/重做功能