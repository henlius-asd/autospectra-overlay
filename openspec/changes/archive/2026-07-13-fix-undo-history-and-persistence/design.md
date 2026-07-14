## Context

AutoSpectraOverlay 当前是一个纯前端离线色谱可视化工作台。审计发现撤销/重做、持久化、快捷键、对齐 Worker 等核心交互存在可靠性缺陷：

- `curveStore` 使用 zundo `temporal` 中间件仅配置 `{ limit: 50 }`，无 `handleSet`/`partialize`/`equality`。zundo 默认在每次 `set()` 记录完整快照，而 `layerSpacing`、`offsets`、`curveScales`、`globalScale`、`normalizeFactors` 均由滑块 `onChange` 高频驱动，50 槽历史在单次滑块拖拽内即被占满，挤出所有早期离散操作。
- `persistence/index.ts` 的 IndexedDB 快照遗漏 `curveScales`/`curveScaleOffsets`；`Toolbar` 的 JSON 导出遗漏 `globalScale`/`normalizeFactors`。刷新与往返均静默丢字段。
- `App.tsx` 全局 `keydown` 未过滤焦点目标，劫持文本输入框原生撤销；且未支持 Ctrl+Shift+Z 重做。
- `AlignmentControls` 创建的 Worker 仅挂载 `onmessage`，异常时 Promise 永不 resolve，按钮卡死。
- `transformEmpowerV2ToV1` 中 BOM 剥离正则 `/^/` 为空操作。
- 解析错误只追加不清除；撤销/重做按钮无禁用态。

约束：纯前端、零服务器、TS 严格模式、78 项现有测试须继续通过。

## Goals / Non-Goals

**Goals:**
- 撤销/重做历史在滑块交互后仍可回溯早期离散操作。
- 刷新页面与 JSON 导入/导出往返后，工作区所有用户可调字段完整保留。
- 键盘快捷键不干扰文本输入，并支持主流重做键序。
- 对齐 Worker 异常不导致 UI 永久卡死。
- 对齐仅作用于可见叠图曲线。
- ARW V2 文件含 BOM 时解析正确。
- 解析错误可被用户清除。
- 撤销/重做按钮反映可用状态。

**Non-Goals:**
- 不重构状态管理架构（仍用 Zustand + zundo）。
- 不引入新第三方依赖（节流用现有 `setTimeout` 自实现或 `throttle-debounce` 已存在则用之；优先无依赖实现）。
- 不修改轻量问题项（死代码 `CURVE_COLORS`、`option` memo、别名双重提交、折叠动画不一致等留待后续）。
- 不改变 zundo `limit` 数值或历史容量上限。
- 不持久化 zundo 历史栈本身（仅持久化当前状态快照）。

## Decisions

### 决策 1：zundo 历史防冲刷采用 `handleSet` 节流（cool-off）

**选择**：为 `temporal` 增加 `handleSet`，用 `setTimeout`/`clearTimeout` 实现约 400ms cool-off：在节流窗口内连续 `set()` 仅记录起始与末次状态，窗口结束后落定一次快照。

**理由**：zundo 官方文档明确推荐 `handleSet` + throttle/debounce 处理"短时间内多次状态变更只记一条历史"的场景，与本项目的滑块拖拽完全吻合。cool-off 后用户拖滑块只产生一条可撤销记录，早期离散操作得以保留。

**备选**：
- `partialize` 排除高频字段（offsets/scales/spacing）——但用户期望撤销滑块结果本身，排除后这些操作完全不可撤销，违背预期。不予采用。
- `equality` 浅比较——滑块每次值都不同，无法合并连续中间态，仍会产生大量快照。不予采用。
- 仅调大 `limit`——治标不治本，仍浪费内存且无法根治。不予采用。

**参数**：cool-off 400ms（与持久化 500ms 防抖接近但更短，保证交互响应）。该常量集中定义便于调参。

### 决策 2：持久化快照与 JSON 字段对齐到完整字段集

**选择**：将 IndexedDB 快照与 JSON 导出/导入统一到同一字段集：`curves, offsets, baselineId, braces, stagingOrder, visibleCurves, layerSpacing, pointLabels, curveScales, curveScaleOffsets, globalScale, normalizeFactors`。提取共享 `buildWorkspaceSnapshot(state)` 与 `applyWorkspaceSnapshot(state, data)` 纯函数，供持久化与 JSON 复用。

**理由**：消除两套字段列表漂移的根因；导入路径缺失字段回退默认值，向后兼容旧快照（旧 IndexedDB 数据无 `curveScales` 字段时回退 `{}`，无 `globalScale` 时回退 `1`，已有逻辑覆盖）。

**备选**：分别补字段——重复且易再次漂移。不予采用。

### 决策 3：键盘快捷键焦点豁免 + Ctrl+Shift+Z

**选择**：`App.tsx` 全局 `keydown` 处理器在调用 `undo()/redo()` 前判断 `e.target` 是否为 `HTMLInputElement`/`HTMLTextAreaElement` 或 `isContentEditable`，是则放行原生行为。重做分支改为：`e.key === 'y'`（无 Shift）或 `e.key === 'Z' && e.shiftKey`（Ctrl+Shift+Z）；撤销分支增加 `!e.shiftKey` 守卫避免与重做冲突。监听依赖改为 `[]`（处理器直接读 `useCurveStore.temporal`，无需闭包变量）。

**理由**：保留文本框原生撤销语义；覆盖 Windows/Linux 主流重做键序；`[]` 依赖消除每次 `curves` 变更重绑监听。

### 决策 4：对齐 Worker 错误处理

**选择**：`AlignmentControls` 中 Worker 同时挂载 `onerror` 与 `onmessageerror`，reject Promise、`worker.terminate()`、`setProgress(null)`、`alert` 提示错误。封装为 `alignWithWorker(...)` 返回 Promise，统一 try/finally 清理。

**理由**：杜绝 Promise 悬挂导致按钮永久禁用。

### 决策 5：对齐目标范围限定可见曲线

**选择**：`handleAlign` 中 `targetIds` 改为 `stagingOrder.filter(id => visibleCurves[id] && id !== baselineId)`；按钮 `disabled` 条件改为 `visibleIds.length < 2 || !baselineCurve`。

**理由**：对齐是叠图区操作语义，作用于不可见曲线无意义。

### 决策 6：ARW V2 BOM 剥离

**选择**：`transformEmpowerV2ToV1` 首行改为 `content.replace(/^\uFEFF/, '')`（显式 Unicode 转义，避免字面 BOM 在编辑/传输中丢失）。

**理由**：与 `parseFileContent` 入口一致；显式转义避免再次出现字面字符丢失。

### 决策 7：解析错误生命周期

**选择**：`LeftPanel` 错误列表新增"清除"按钮；`handleFilesParsed` 在收到成功解析结果时 `setErrors([])` 清空旧错误。

### 决策 8：撤销/重做按钮禁用态

**选择**：通过 `useTemporalStore`（基于 `useStoreWithEqualityFn`）订阅 `pastStates.length`/`futureStates.length`，按钮在无历史时 `disabled`。

**理由**：zundo README 明确 `temporal` 属性非响应式，需转 React store hook 才能在按钮上反映。避免每次 `curves` 变更全量重渲染（仅按 `canUndo`/`canRedo` 布尔订阅）。

## Risks / Trade-offs

- **[cool-off 400ms 可能让快速连续的离散操作合并]** → 滑块拖拽属于连续操作，合并符合预期；对于"快速点击两次不同按钮"的场景，400ms 内两次 `set` 会被合并为一条历史，丢失中间态。可接受（撤销回到合并前），并保留调参空间。
- **[zundo 节流后历史粒度变粗]** → 用户撤销滑块操作时一次回退整段拖拽，符合直觉（一次拖拽=一次操作）。
- **[持久化新增字段后旧 IndexedDB 快照兼容]** → 已有 `?? {}` / `?? 1` 回退逻辑；测试覆盖"无新字段的旧快照"用例。
- **[Worker onerror 无法区分用户可读错误]** → 统一提示"对齐失败"，控制台打印原始错误；不阻塞重试。
- **[Ctrl+Shift+Z 与浏览器/输入法冲突]** → 仅在非文本输入焦点时拦截；输入框内放行原生行为。
- **[按钮禁用态订阅 temporal 增加 React 渲染]** → 用 `useStoreWithEqualityFn` + 布尔选择器，仅 `canUndo`/`canRedo` 变化时重渲染，开销极小。
