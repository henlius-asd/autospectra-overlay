## 1. Resolver 修复

- [x] 1.1 `resolveLineStyle.ts`：过滤 override 中的 null/undefined 字段，使用 `!= null` 保留假值（`width: 0`、`color: ''`），参数类型改为 `NullablePartial<LineStyle>`
- [x] 1.2 `resolveLabelStyle.ts`：同上模式，过滤所有 5 个字段（fontSize/fontFamily/fontWeight/color/backgroundColor），参数类型改为 `NullablePartial<LabelStyle>`

## 2. Toolbar 错误处理改善

- [x] 2.1 `Toolbar.tsx`：`handleExportPptx` 的 `catch {}` 改为 `catch (err) { console.error('PPTX 导出失败:', err); showToast(...) }`，使导出失败时 console 输出原始错误而非静默吞掉

## 3. 单元测试

- [x] 3.1 `resolveLineStyle.test.ts`：新增 null 回落回归用例（单字段 null + 全字段 null）+ `width: 0` 假值保留用例
- [x] 3.2 `resolveLabelStyle.test.ts`（新建）：基础合并用例 + null 回落回归用例 + `fontSize: 0` 假值保留用例

## 4. E2E 回归测试

- [x] 4.1 `e2e/export-pptx.spec.ts`（新建）：单曲线基线 + 多曲线+图例 + brace+点标注 + JSON 导入 null 颜色回归 + 对照用例
- [x] 4.2 `e2e/fixtures/sample-multi.csv`（新建）：3 列 CSV fixture 用于多曲线测试

## 5. 验证

- [x] 5.1 单测全量通过（127 passed）
- [x] 5.2 类型检查通过（`npx tsc --noEmit`）
- [x] 5.3 E2E 全量通过（5 passed，含 null 颜色回归用例从红变绿）