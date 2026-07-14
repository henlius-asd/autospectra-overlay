## 1. Spec 文档对齐(无代码改动,仅本 change 内 delta spec 已完成)

- [x] 1.1 撰写 18 个 delta spec 文件(baseline-indicator、arw-v2-parsing、arw-metadata-parsing、file-parser、robust-data-detection、point-label-tool、brace-tool、manual-curve-move、curve-visibility-control、curve-deletion、state-management、project-scaffold、three-column-layout、scale-slider、chart-image-export、alignment-behavior、alignment-roi-offset-compensation、auto-layering)
- [x] 1.2 确认 `curve-composite-scale` 无 delta(主 spec 已与运行时一致),仅作为死代码任务处理
- [x] 1.3 `openspec validate spec-sync` 通过

## 2. ARW V2 非两列数据行警告(实现修复)

- [x] 2.1 在 `src/parser/parseFile.ts` 的 `transformEmpowerV2ToV1` 中,将 `tokens.length !== 2` 的静默 `continue` 分支改为:记录 `{ line, content }` 到累积数组 `warnings`
- [x] 2.2 解析结束后,将 `warnings` 挂到返回结果的 `__v2ParseWarnings` 字段,并对每条 `console.warn` 输出(含行号与原始内容)
- [x] 2.3 更新 `src/parser/__tests__/parseFile.test.ts`:新增用例断言含异常行的 V2 文件解析后 `__v2ParseWarnings` 非空且包含正确行号;原断言 `metadata.SamplingInterval` 为 undefined 的用例保留(标签确实不存在)
- [x] 2.4 `npx vitest run src/parser` 通过

## 3. PPTX 可编辑多图层矢量导出(实现修复,**BREAKING**)

- [x] 3.1 评估 pptxgenjs 的 `freeform`/`addShape` 能力,做单曲线折线 PoC 导出;若 freeform 不可行则采用密集短线段折线方案,记录决策于本 change
- [x] 3.2 重写 `src/components/chart/exportPptx.ts` 的曲线导出路径:每条可见曲线降采样后渲染为独立折线 shape(按 layerYOffset 叠加),替换原 `slide.addImage()` 栅格路径
- [x] 3.3 点标签:导出为 `addText` 文本框 + 竖线 `addShape('line')` + 圆点 `addShape('ellipse')` 一组 shape
- [x] 3.4 区间标签(大括号):导出为弧形/自选图形 shape(`addShape`) + 文本框,必要时以多段直线近似弧形
- [x] 3.5 刻度与轴名:遍历 axis tick 逐个 `addText` 独立文本框,保留轴名文本框
- [x] 3.6 更新/新增 `src/components/chart/exportPptx.ts` 相关测试:断言导出 .pptx 中每条曲线为独立可编辑 shape(非 image);点标签/大括号含多 shape 组合
- [x] 3.7 手动验证:导出后在 PowerPoint 中点选单条曲线可独立移动/编辑;`npx tsc --noEmit` 通过

## 4. 死代码清理

- [x] 4.1 全仓 grep 确认 `CurveScaleOverlay` 无任何导入引用后,删除 `src/components/chart/CurveScaleOverlay.tsx`
- [x] 4.2 全仓 grep 确认 `CURVE_COLORS` 无任何导入引用后,从 `src/lib/colors.ts` 删除该导出
- [x] 4.3 更新 `src/parser/detectFormat.ts:27` 过时注释("读前 5 行" → "全文件扫描")
- [x] 4.4 `npx tsc --noEmit` 与 `npx vitest run` 全绿,确认无残留引用

## 5. 验证与归档

- [x] 5.1 运行 `npx tsc --noEmit` + `npx vitest run` 全绿
- [x] 5.2 运行 `openspec validate spec-sync --strict` 通过
- [x] 5.3 验证: tsc + vitest + openspec validate 全部通过, delta spec 与实现一致
- [x] 5.4 更新 `CHANGELOG.md` 标注 PPTX 导出 BREAKING 变更
- [ ] 5.5 归档 change 并同步 delta spec 至主 spec
