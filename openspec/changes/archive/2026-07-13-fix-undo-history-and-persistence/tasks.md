## 1. zundo 历史防冲刷（cool-off）

- [x] 1.1 在 `src/store/curveStore.ts` 顶部定义 cool-off 常量 `UNDO_COOL_OFF_MS = 400`
- [x] 1.2 为 `temporal` 选项增加 `handleSet`：用模块级 `let coolOffTimer` + `setTimeout/clearTimeout` 实现 cool-off，窗口内连续 `set` 仅在窗口结束后调用一次 `handleSet(state)`
- [x] 1.3 新增测试：模拟滑块高频 `setLayerSpacing` 调用超过 `limit` 次后，`pastStates` 仍保留早于拖拽前的离散操作历史（参考 `state-management` 的 `滑块拖拽不冲刷历史` 场景）
- [x] 1.4 新增测试：离散操作间隔 > cool-off 时各产生独立历史条目

## 2. 持久化字段完整性（共享字段集）

- [x] 2.1 在 `src/persistence/index.ts` 新增纯函数 `buildWorkspaceSnapshot(state)` 返回完整字段集（含 `curveScales`、`curveScaleOffsets`、`globalScale`、`normalizeFactors`）
- [x] 2.2 新增纯函数 `applyWorkspaceSnapshot(data)` 返回 curveStore 局部状态对象，对所有缺失字段回退默认值（`curveScales`→`{}`、`globalScale`→`1` 等）
- [x] 2.3 `saveWorkspace` 改用 `buildWorkspaceSnapshot`；`restoreWorkspace` 改用 `applyWorkspaceSnapshot`
- [x] 2.4 `src/components/toolbar/Toolbar.tsx` 的 `handleExportJSON` 与 `handleImportJSON` 复用 `buildWorkspaceSnapshot`/`applyWorkspaceSnapshot`，确保导出含 `globalScale`/`normalizeFactors`、导入恢复全部字段
- [x] 2.5 新增测试：`buildWorkspaceSnapshot` 包含全部 12 个字段；`applyWorkspaceSnapshot` 对缺失字段回退默认值；导入导出往返无损（参考 `workspace-persistence` 的 `导入导出往返无损`、`旧版本 IndexedDB 快照恢复` 场景）
- [x] 2.6 回归测试：现有 78 项测试继续通过；`npm run build`（tsc + vite build）通过

## 3. 键盘快捷键健壮性

- [x] 3.1 `src/App.tsx` 全局 `keydown` 处理器：在执行 undo/redo 前判断 `e.target` 是否为 `HTMLInputElement`/`HTMLTextAreaElement` 或 `isContentEditable`，是则 `return` 放行原生行为
- [x] 3.2 撤销分支增加 `!e.shiftKey` 守卫；重做分支支持 `e.key === 'y'` 或 `(e.ctrlKey||e.metaKey) && e.shiftKey && (e.key === 'Z' || e.key === 'z' && e.shiftKey)`
- [x] 3.3 将 `useEffect` 依赖数组改为 `[]`（处理器直接读 `useCurveStore.temporal`，无需闭包变量）
- [x] 3.4 新增测试：焦点在 `<input>` 时 Ctrl+Z 不触发 store undo（参考 `toolbar-undo-redo` 的 `文本输入框原生撤销不被劫持` 场景）；焦点非 input 时 Ctrl+Shift+Z 触发 redo
- [x] 4.4 新增测试：对齐仅修改可见曲线 offsets，不可见曲线 offsets 不变（参考 `alignment-behavior` 的 `不可见曲线偏移不被修改` 场景）
- [x] 4.5 新增测试：Worker onerror 后进度为 null、按钮可用（参考 `Worker 抛错后可重试` 场景）
- [x] 5.2 新增测试：V2 文件首含 UTF-8 BOM 时，`transformEmpowerV2ToV1` 产出的 V1 文本首行不以 BOM 开头，元数据与数据解析与无 BOM 一致（参考 `arw-v2-parsing` 的 `V2 文件含 UTF-8 BOM` 场景）
- [x] 5.3 新增测试：无 BOM 的 V2 文件行为不变
- [x] 6.3 新增测试：成功上传新文件后错误列表为空（参考 `file-parser` 的 `成功上传后清空旧错误` 场景）；点击"清除"后错误列表为空
- [x] 7.3 新增测试：无历史时撤销按钮禁用；撤销后重做按钮可用（参考 `toolbar-undo-redo` 的 `无历史时按钮禁用`、`撤销后重做按钮可用` 场景）

## 8. 验收与回归

- [x] 8.1 运行 `npx vitest run` 全部通过（含新增测试）
- [x] 8.2 运行 `npm run build`（tsc --noEmit + vite build）无错误
- [x] 8.3 手动验证：滑块拖拽后可 undo 回拖拽前；刷新后单曲线缩放/全局缩放/归一化保留；JSON 往返无损；Ctrl+Shift+Z 重做；输入框 Ctrl+Z 原生撤销；对齐按钮在可见曲线<2 时禁用
