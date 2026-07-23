## Context

`restoreWorkspace` 从 IndexedDB（localforage）读取 `uiSnapshot` 并 `useUiStore.setState` 恢复 UI 偏好。`uiSnapshot` 来自不可信持久化层——可能是旧版本 schema、手编 JSON 导入或损坏存储，字段可能缺失、为 `null` 或类型错误。原代码对 `lineStyle` 用 `(uiSnapshot.lineStyle ?? DEFAULT_LINE_STYLE) as unknown as LineStyle`，对 `labelStyle` 用 `uiSnapshot.labelStyle as unknown as LabelStyle`：前者 `??` 仅在 `null`/`undefined` 回退，truthy 部分对象原样采用；两者均用 `as unknown as` 双重断言抹掉类型检查。后果：`lineStyle.width` 可能为 `undefined`/`null`/字符串，渗入 `CurveStylePanel` 受控 `<input type="range" value={...}>` 触发 React controlled/uncontrolled 警告，`color` 非字符串渗入 `toHexColor` 抛 `TypeError`。

## Goals / Non-Goals

**Goals:**
- 对全局 `lineStyle`/`labelStyle` 水合路径建立统一契约：缺失字段补默认、`null`/错误类型回退默认。
- 消除 `as unknown as` 不诚实断言，以运行时类型校验取而代之。
- 锁定回归（mock localforage 驱动真实 `restoreWorkspace`），覆盖缺失/null/错误类型三类。

**Non-Goals:**
- 不改 per-curve `resolveLineStyle`（已由已归档变更 `fix-null-style-color-crash` 覆盖 null 处理）。
- 不引入 Zod 等运行时 schema 库（字段集小、契约稳定，手写校验即可；见 Decisions）。
- 不在组件侧（`CurveStylePanel`）加 `value={x ?? default}` 兜底——那会掩盖未来水合缺陷，根因在水合层。
- 不扩展到 `uiSnapshot` 其余字段（`xRange`/`colorHistory` 等）的类型校验——本次仅修样式字段（受控控件 sink 所在）。

## Decisions

**D1：合并默认值（spread）而非 `??` 整体回退。**
- 选 spread `{ ...DEFAULT, ...partial }`：对每个字段「默认打底、持久化覆盖」，缺失字段补默认、已存字段保留。
- 否决 `??`：仅 `null`/`undefined` 触发回退，对 truthy 部分对象无效，正是本次 bug 根因。
- 否决「整体替换或整体默认」二元策略：会丢失用户已存的部分字段。

**D2：合并之上叠加逐字段运行时类型校验。**
- 仅 spread 仍不能堵 `null`/错误类型：`{ ...DEFAULT, ...{ width: null } }` → `width: null` 仍渗入受控件，复现同一警告类。
- 故对数值字段 `typeof === 'number' && Number.isFinite`、枚举字段显式 `===` 集合校验、字符串字段 `typeof === 'string'`，不满足回退默认。
- 抽取为纯函数 `hydrateLineStyle`/`hydrateLabelStyle`，集中契约、消除两处复制粘贴漂移（此前两处分别用 `??` 与裸 `as`，已发生不同 bug）。

**D3：手写校验而非 Zod。**
- 受影响字段共 8 个（lineStyle 3 + labelStyle 5），类型简单、稳定。引入 Zod 增依赖与运行时开销，收益不抵成本。
- 若未来 `uiSnapshot` 字段集扩张或需校验 `xRange`/`colorHistory` 等，可再评估统一 schema 校验。

**D4：helper 与调用点同模块（`src/persistence/index.ts`）。**
- 仅 `restoreWorkspace` 一处消费；不外抽到 `src/utils` 避免过早泛化。若 JSON 导入路径未来也需同等校验，再提升为共享工具。

## Risks / Trade-offs

- [风险] 手写校验可能遗漏某字段类型 → 缓解：回归测试覆盖三类场景；字段集小且稳定。
- [权衡] 默默回退默认值而非抛错 → 对离线工具用户友好（损坏快照仍可用），代价是损坏字段被静默纠正、无显式告警；可接受，因 save 路径只写合法值，损坏仅来自外部旧数据。
- [风险] `hydrateLabelStyle` 仅在 `if (uiSnapshot.labelStyle)` 守卫内调用，`labelStyle` 缺失时不重置（沿用 store 默认）→ 与 lineStyle（无守卫、缺失即重置为默认）行为略有差异，但两者效果等价（store 初值即 `DEFAULT_LABEL_STYLE`），无功能影响；保留守卫以最小化行为变更。
