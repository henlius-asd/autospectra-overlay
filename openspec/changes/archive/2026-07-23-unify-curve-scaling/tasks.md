## 1. Store 层：移除 normalizeFactors，重构缩放 actions

- [x] 1.1 从 `CurveState` 接口移除 `normalizeFactors` 字段、`setNormalizeFactor` action、`clearNormalizeFactors` action
- [x] 1.2 修改 `normalizeAllPeak` action：将计算结果写入 `curveScales[id]`（覆盖已有值）而非 `normalizeFactors[id]`
- [x] 1.3 新增 `resetCurveScales` action：清空所有 `curveScales` 和 `curveScaleOffsets`
- [x] 1.4 更新 `removeCurve`/`removeSelectedCurves`：移除对 `normalizeFactors` 的清理逻辑
- [x] 1.5 更新 `resetWorkspace`：移除 `normalizeFactors: {}` 初始化
- [x] 1.6 从初始状态移除 `normalizeFactors: {}`

## 2. 图表渲染层：简化 composite 公式

- [x] 2.1 在 `WaterfallChart.tsx` 渲染逻辑中移除 `normalize` 变量，composite 公式改为 `globalScale * manual`
- [x] 2.2 更新 `scaleBadge` 计算：单曲线模式显示 `×(globalScale * curveScales[id])`，移除 normalizeFactors 引用
- [x] 2.3 更新 hit-test 逻辑（`handleChartClick`）：移除 `normalize` 变量，composite 公式同步简化
- [x] 2.4 更新 useMemo 依赖数组：移除 `normalizeFactors` 依赖

## 3. 导出层：移除 normalizeFactors 引用

- [x] 3.1 在 `exportPptx.ts` 中移除 `normalizeFactors` 解构和 `normalize` 变量，composite 公式改为 `globalScale * manual`

## 4. 持久化层：移除字段 + v4 迁移

- [x] 4.1 在 `persistence/index.ts` 的 snapshot 构建函数中移除 `normalizeFactors` 字段
- [x] 4.2 在恢复函数中移除 `normalizeFactors` 字段的回退逻辑
- [x] 4.3 将快照 version 从 3 升至 4
- [x] 4.4 新增 v3→v4 迁移逻辑：`version < 4` 且含 `normalizeFactors` 时，对每条曲线执行 `curveScales[id] = (curveScales[id] ?? 1) * (normalizeFactors[id] ?? 1)`，然后删除 `normalizeFactors`
- [x] 4.5 确保 v2 快照先执行颜色迁移（v2→v3）再执行缩放迁移（v3→v4）

## 5. 工具箱 UI：面板重排、改名、合并

- [x] 5.1 在 `RightPanel.tsx` 中重排 sections 顺序为：元数据 → 自动叠图 → 层间距 → 标签样式 → 曲线样式 → 显示设置
- [x] 5.2 设置默认展开项：仅 `metadata` 和 `alignment` 的 `defaultExpanded: true`，移除 `labelStyle` 和 `curveStyle` 的 `defaultExpanded`
- [x] 5.3 移除 `dataProcessing` section（含 DataProcessingPanel 引入）
- [x] 5.4 将 `alignment` section 标题从「自动对齐」改为「自动叠图」
- [x] 5.5 删除 `DataProcessingPanel.tsx` 文件
- [x] 5.6 在 `AlignmentControls.tsx` 中新增「归一化」按钮，调用 `normalizeAllPeak(xRange)`，按钮旁显示确认 popover（含警告文案"归一化将覆盖所有单曲线缩放调整"和确认/取消按钮）
- [x] 5.7 在 `AlignmentControls.tsx` 中新增「重置缩放」按钮，调用 `resetCurveScales`，按钮旁显示确认 popover（含警告文案"将清空所有单曲线缩放和偏移"和确认/取消按钮）
- [x] 5.8 将 `AlignmentControls.tsx` 内部标题从「自动对齐」改为「自动叠图」

## 6. 测试更新

- [x] 6.1 更新 `curveStore.test.ts`：移除 `normalizeFactors` 相关测试，新增 `normalizeAllPeak` 写入 `curveScales` 的测试、`resetCurveScales` 清空测试
- [x] 6.2 更新 `persistence/index.test.ts`：移除 `normalizeFactors` 快照字段测试，新增 v3→v4 迁移测试（含 normalizeFactors 乘入 curveScales 验证）
- [x] 6.3 更新 `e2e/export-pptx.spec.ts`：移除 `normalizeFactors: {}` fixture 字段

## 7. 验证

- [x] 7.1 运行 `npx tsc --noEmit` 确认无类型错误
- [x] 7.2 运行 `npx vitest run` 确认所有测试通过
- [x] 7.3 手动验证：旧快照（含 normalizeFactors）刷新后曲线缩放不变
- [x] 7.4 手动验证：归一化按钮弹出确认 popover，确认后覆盖 curveScales
- [x] 7.5 手动验证：重置按钮清空所有 curveScales，曲线回到 ×1
- [x] 7.6 手动验证：工具箱初始仅展开元数据+自动叠图两栏
