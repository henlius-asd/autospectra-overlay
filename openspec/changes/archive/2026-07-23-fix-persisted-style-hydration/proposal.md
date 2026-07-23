## Why

刷新/导入工作区时，若 IndexedDB 中的 `uiSnapshot.lineStyle`（或 `labelStyle`）是旧 schema 拼留的部分对象（如仅含 `color`、缺 `width`/`type`），`restoreWorkspace` 用 `??` 整体回退——该算子仅在 `null`/`undefined` 时触发，对 truthy 的部分对象原样采用，再经 `as unknown as LineStyle` 抹掉类型检查，使 `lineStyle.width` 等字段为 `undefined` 渗入 `CurveStylePanel` 的受控 `<input type="range" value={undefined}>`，触发 React「controlled→uncontrolled」警告；用户拖动滑块后切回复受控亦反复报警。

## What Changes

- 在 `src/persistence/index.ts` 新增纯函数 `hydrateLineStyle(partial): LineStyle` 与 `hydrateLabelStyle(partial): LabelStyle`：先以 `DEFAULT_*` 为底，再用持久化对象覆盖；对每个字段做类型校验——`width`/`fontSize` 必须 `number && isFinite`、`type`/`fontWeight` 必须为合法枚举、`color`/`fontFamily`/`backgroundColor` 必须 `string`，不满足即回退默认。
- `restoreWorkspace` 中 `lineStyle`/`labelStyle` 的恢复路径改用上述 helper，移除 `(uiSnapshot.lineStyle ?? DEFAULT) as unknown as LineStyle` 与 `uiSnapshot.labelStyle as unknown as LabelStyle` 两处不诚实断言。
- 新增回归测试 `src/persistence/__tests__/restoreUiLineStyle.test.ts`（mock localforage 驱动真实 `restoreWorkspace`）：覆盖「字段缺失补默认」「labelStyle 缺失补默认」「字段为 null/错误类型回退默认」三类场景。

## Capabilities

### New Capabilities

（无——此为 bug 修复）

### Modified Capabilities

- `workspace-persistence`: 将 `lineStyle`/`labelStyle` 恢复语义从「`??` 整体回退」精确化为「合并默认值 + 类型校验」：缺失字段补默认、错误类型/null 值回退默认，杜绝 undefined/非数值渗入受控控件；并将 `labelStyle` 显式纳入 `uiSnapshot` 持久化字段集（原需求仅列 `lineStyle`）。

## Impact

- 影响文件：`src/persistence/index.ts`（新增 2 个 helper + 2 处调用点改写 + 1 处 import）、`src/persistence/__tests__/restoreUiLineStyle.test.ts`（新增）。
- 无 API 变更，无 breaking changes：合法的完整持久化对象行为不变（合并后等价）；仅对旧/损坏/手编 JSON 的恢复路径增强鲁棒性。
- 与已归档变更 `fix-null-style-color-crash`（per-curve `resolveLineStyle` 过滤 null）互补：本变更为全局 `lineStyle`/`labelStyle` 水合路径的对应加固。
