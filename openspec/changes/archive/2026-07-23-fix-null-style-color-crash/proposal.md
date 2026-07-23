## Why

当曲线或标注的 `lineStyle.color` / `labelStyle.color` 为显式 `null` 时（可通过未经净化的 JSON 工作区导入或 v2→v3 迁移进入 store），`resolveLineStyle` / `resolveLabelStyle` 的 `{ ...defaultStyle, ...override }` 展开会让 `null` 覆盖默认值，导致 `exportPptx.ts` 中 `resolved.color.replace('#','')` 抛出 `TypeError: Cannot read properties of null (reading 'replace')`。该异常在 `pptx.write` 的 try 之前抛出，仅命中 Toolbar 的外层 `catch {}`（无 err 变量），表现为静默的「导出 PPTX 失败」toast，无 alert、无下载、F12 也看不到错误。`exportImage.ts` 以及屏幕 overlay 渲染（BraceOverlay、PointLabelOverlay）存在同类隐患。此问题由 `b9931ea`（曲线线条样式级联系统）引入——旧代码 `const color = curve.color || '#000000'` 有 null 兜底，切换为 `resolveLineStyle` 时丢失了该保护。

## What Changes

- `resolveLineStyle` 和 `resolveLabelStyle` 在合并前过滤 override 中的 `null` / `undefined` 字段（使用 `!= null`，保留 `0` / `''` 等假值），显式 null 回退到默认值，恢复回归前的 `|| '#000000'` 语义
- 参数类型从 `Partial<LineStyle>` 改为 `NullablePartial<LineStyle>`（`{ [K in keyof T]?: T[K] | null }`），如实声明可接收来自不可信 JSON 的 null
- `Toolbar.handleExportPptx` 的 `catch {}` 改为 `catch (err) { console.error(...) }`，使后续导出失败可诊断
- 新增 `resolveLineStyle.test.ts` 的 null 回归用例 + `resolveLabelStyle.test.ts`（含 null 回归用例）+ `e2e/export-pptx.spec.ts`（5 项 PPTX 导出回归测试，含 JSON 导入 null 颜色复现用例）

## Capabilities

### New Capabilities

无（纯 bug fix，不引入新功能）。

### Modified Capabilities

- `curve-line-style`: `resolveLineStyle` 的语义变更——override 中的显式 `null` 不再覆盖默认值，改为回退到默认值。这修复了 `{ ...defaultStyle, color: null }` 导致 `resolved.color === null` 的 crash。
- `export-pptx`: 导出现在对 null 样式颜色具有鲁棒性——当 resolveLineStyle/resolveLabelStyle 返回的 `resolved.color` 为 null 时不再崩溃。Toolbar 的错误处理同时改善：导出失败时 console 会输出原始错误（之前被静默吞掉）。
- `chart-image-export`: 同 `export-pptx`，labels 的 `resolveLabelStyle` 返回 null 颜色时不再崩溃（共用同一 resolver）。

## Impact

- **变更文件**: `src/components/chart/resolveLineStyle.ts`, `src/components/chart/resolveLabelStyle.ts`, `src/components/toolbar/Toolbar.tsx`
- **新增测试**: `src/components/chart/__tests__/resolveLabelStyle.test.ts`（新建）, `src/components/chart/__tests__/resolveLineStyle.test.ts`（修改）, `e2e/export-pptx.spec.ts`（新建）, `e2e/fixtures/sample-multi.csv`（新建）
- **受影响的调用方**: `WaterfallChart.tsx`（图表渲染）, `exportPptx.ts`（PPTX 导出）, `exportImage.ts`（PNG 导出）, `BraceOverlay.tsx` / `PointLabelOverlay.tsx`（屏幕 overlay）——均通过 resolver 间接受影响，行为变更仅限 null override 回退到默认值
- **无破坏性变更**: 现有工作区的 `lineStyle` / `labelStyle` 字段均为 `T | undefined`（非 null），行为不变；仅 JSON 导入或旧版本迁移中可能存在的 null 字段受影响（从 crash 变为正常导出）