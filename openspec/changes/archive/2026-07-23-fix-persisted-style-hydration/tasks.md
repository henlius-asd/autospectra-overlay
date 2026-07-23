## 1. 水合辅助函数

- [x] 1.1 在 `src/persistence/index.ts` 新增 `hydrateLineStyle(partial: unknown): LineStyle`（spread 默认 + 逐字段类型校验：`width` number&&isFinite、`type` 枚举、`color` string）
- [x] 1.2 新增 `hydrateLabelStyle(partial: unknown): LabelStyle`（覆盖 `fontSize`/`fontFamily`/`fontWeight`/`color`/`backgroundColor`）
- [x] 1.3 import `DEFAULT_LABEL_STYLE`

## 2. 调用点改写

- [x] 2.1 `restoreWorkspace` 中 `lineStyle` 改用 `hydrateLineStyle(uiSnapshot.lineStyle)`，移除 `(uiSnapshot.lineStyle ?? DEFAULT_LINE_STYLE) as unknown as LineStyle`
- [x] 2.2 `labelStyle` 改用 `hydrateLabelStyle(uiSnapshot.labelStyle)`（保留 `if (uiSnapshot.labelStyle)` 守卫），移除 `as unknown as LabelStyle`

## 3. 回归测试

- [x] 3.1 创建 `src/persistence/__tests__/restoreUiLineStyle.test.ts`，以 `vi.hoisted` + `vi.mock('localforage')` 驱动真实 `restoreWorkspace`
- [x] 3.2 用例：部分 `lineStyle`（缺 `width`/`type`）→ 补默认
- [x] 3.3 用例：部分 `labelStyle`（缺 `fontSize` 等）→ 补默认
- [x] 3.4 用例：`{ width: null, type: 'bogus', color: 123 }` → 回退默认

## 4. 验证

- [x] 4.1 `npx tsc --noEmit` 通过
- [x] 4.2 `npx vitest run` 全量通过（修复前红、修复后绿）
- [x] 4.3 确认无 `[DEBUG-...]` 仪表残留

## 5. OpenSpec 文档对齐

- [x] 5.1 创建 `proposal.md`
- [x] 5.2 创建 `design.md`
- [x] 5.3 创建 `specs/workspace-persistence/spec.md` delta（MODIFIED: 「IndexedDB 自动保存字段完整性」补 `labelStyle`；ADDED: 「持久化样式字段类型校验与默认值合并」）
- [x] 5.4 创建 `tasks.md`（本文档）
