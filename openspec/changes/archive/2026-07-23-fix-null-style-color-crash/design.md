## Context

`b9931ea`（曲线线条样式级联系统）将 PPTX 导出从 `const color = curve.color || '#000000'` 切换为 `resolveLineStyle(curve.lineStyle, globalLineStyle) → resolved.color.replace('#','')`。`resolveLineStyle` 使用 `{ ...defaultStyle, ...override }` 展开合并——若 override 中某字段为显式 `null`（可经未经净化的 JSON 工作区导入或 v2→v3 迁移进入 store），`null` 会覆盖默认值，导致 `resolved.color === null` → `.replace` 抛出 `TypeError`。该异常在 `pptx.write` 的 try 之前抛出，仅命中 Toolbar 的 `catch {}`（无 err 变量），表现为静默 toast「导出 PPTX 失败」。`resolveLabelStyle` 存在同类隐患，影响 brace/点标签的 PPTX/PNG 导出及屏幕 overlay。

## Goals / Non-Goals

**Goals:**
- 修复 `resolveLineStyle` 和 `resolveLabelStyle`，使 override 中的显式 `null` 回退到默认值（恢复回归前的 `|| '#000000'` 兜底语义）
- 保留假值但已定义的字段（`width: 0`、`fontSize: 0`、`color: ''`）
- 在 resolver 层修复（共享层），使图表渲染、PPTX 导出、PNG 导出、屏幕 overlay 同步受益
- 改善 Toolbar 的错误处理，使导出失败时 console 输出原始错误（而非静默吞掉）
- 添加回归测试（unit + e2e）

**Non-Goals:**
- 不在 import 边界（`Toolbar.handleImportJSON`、`persistence.applyWorkspaceSnapshot`）添加默认值合并——import 时直接设置 `lineStyle`/`labelStyle` 而不合并默认值，可能导致 partial 全局默认值（如 `{ width: 2 }` 缺少 color）。该问题与本次修复正交，属于 import 边界的安全加固，不在本次范围。
- 不修改 `CurveStylePanel` 或 `LabelStyleControls` 的 UI 逻辑
- 不处理非字符串 color 值（`color: false`、`color: 123`）——与旧代码行为一致，此类异常值在旧代码中同样会 crash

## Decisions

**Decision 1: 在 resolver 层过滤，而非在调用方 guard。**

- **选择**: 在 `resolveLineStyle` / `resolveLabelStyle` 内部过滤 null/undefined
- **备选**: 在各调用方（`exportPptx.ts`、`exportImage.ts`、`WaterfallChart.tsx`、`BraceOverlay.tsx`、`PointLabelOverlay.tsx`）添加 `|| DEFAULT` guard
- **理由**: resolver 是共享层，修改一处覆盖所有调用方；调用方 guard 分散且易遗漏。resolver 层的语义是「给定 default + override → 产生有效 merged style」，null 过滤属于该职责范围。

**Decision 2: 使用 `!= null`（宽松相等），而非 `!== undefined` 或 truthiness 检查。**

- **选择**: `if (override.width != null) picked.width = override.width`
- **备选 A**: `if (override.width !== undefined)` — 不滤除 null，需额外 null 检查
- **备选 B**: `if (override.width)` — 会滤除假值 `0`（width 0 是合法值）、`''`（空字符串颜色，pptxgenjs 可接受）
- **理由**: `!= null` 同时滤除 null 和 undefined，保留 `0`、`''`、`false` 等假值。pptxgenjs 对 `0` 宽度和 `''` 颜色的行为已验证（e2e 变体测试通过）。

**Decision 3: 参数类型改为 `NullablePartial<T>`，而非在测试中 cast。**

- **选择**: 定义 `type NullablePartial<T> = { [K in keyof T]?: T[K] | null }`，将 override 参数类型从 `Partial<LineStyle>` 改为 `NullablePartial<LineStyle>`
- **备选**: 保持 `Partial<LineStyle>`，测试中用 `as unknown as Partial<LineStyle>` 传入 null
- **理由**: `NullablePartial` 如实声明了运行时契约（override 可来自不可信 JSON，字段可能为 null）。`Partial<LineStyle>`（字段 `T | undefined`）可赋值给 `NullablePartial<LineStyle>`（字段 `T | null | undefined`），对现有调用方无破坏。测试可直接传入 null 无需 cast。

**Decision 4: 分别在两个 resolver 文件中定义 `NullablePartial`，而非抽取共享类型。**

- **理由**: 两个 resolver 是独立模块，各自定义 1 行 mapped type 的维护成本低于引入共享依赖。类型定义相同且稳定，drift 风险极低。

## Risks / Trade-offs

- [Risk] 两个 resolver 文件的 `NullablePartial` 定义重复 → **Mitigation**: 稳定的一行 mapped type，drift 风险极低；若未来需要扩展可抽取到 `@/types`
- [Risk] 调用方传入非 null、非 undefined 但类型错误的字段（如 `color: 123`）→ **Mitigation**: 与旧代码行为一致（旧代码中 `123.replace('#','')` 同样 crash），不属于本次修复范围。TypeScript 类型系统在编译时阻止此类错误，仅 JSON import 等无类型边界可能引入
- [Risk] `console.error` 在 Toolbar catch 中可能记录敏感信息 → **Mitigation**: 仅记录 `err` 对象（导出逻辑错误），不含用户数据或凭据