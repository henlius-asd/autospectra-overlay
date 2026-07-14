## Why

系统审计发现撤销/重做历史被高频滑块操作"冲刷"而失效、IndexedDB 自动保存与 JSON 导入/导出均存在字段丢失（静默数据丢失）、全局键盘快捷键劫持文本输入框且缺少 Ctrl+Shift+Z 重做、对齐 Worker 缺少错误处理会永久卡死、ARW V2 BOM 剥离为空操作、解析错误不可清除、撤销按钮不反映可用状态、对齐作用于不可见曲线。这些问题破坏了数据完整性保障与核心交互可靠性，需在引入更多功能前修复。

## What Changes

- **撤销历史防冲刷**：为 zundo `temporal` 中间件配置 `handleSet`（节流 cool-off）与 `partialize`/`equality`，使滑块拖拽等高频 `set()` 不再每次都产生独立快照，保留早期离散操作可撤销性。
- **持久化完整性**：IndexedDB 自动保存快照 SHALL 包含 `curveScales` 与 `curveScaleOffsets`；JSON 导出 SHALL 包含 `globalScale` 与 `normalizeFactors`，导入 SHALL 恢复全部缺失字段，确保工作区往返与刷新无字段丢失。
- **键盘快捷键健壮性**：支持 Ctrl+Shift+Z 重做；当焦点位于 `<input>`/`<textarea>`/`contenteditable` 时 SHALL NOT 触发全局撤销/重做，保留文本原生撤销。
- **对齐 Worker 错误处理**：对齐 Worker SHALL 挂载 `onerror`，异常时拒绝 Promise、终止 Worker、终止进度并恢复按钮可用，避免永久"对齐中..."卡死。
- **对齐目标范围**：一键对齐 SHALL 仅作用于叠图区可见曲线（排除未叠图/不可见曲线），按钮禁用条件基于可见曲线数。
- **ARW V2 BOM 剥离**：`transformEmpowerV2ToV1` SHALL 在归一化前剥离 UTF-8 BOM，与 `parseFileContent` 入口行为一致。
- **解析错误生命周期**：左栏解析错误 SHALL 可被用户手动清除，且成功上传新文件时 SHALL 清空旧错误列表，避免错误长期累积。
- **撤销/重做按钮状态**：Toolbar 撤销/重做按钮 SHALL 根据是否存在可撤销/可重做历史反映禁用态。

## Capabilities

### New Capabilities
- `workspace-persistence`: 工作区状态持久化与导入/导出往返完整性规范，覆盖 IndexedDB 自动保存字段集合、JSON 导出/导入字段集合、刷新与往返后状态无损恢复。

### Modified Capabilities
- `state-management`: zundo `temporal` 配置变更——新增 `handleSet` 节流与（可选）`partialize`/`equality`，使高频状态变更合并为单条历史。
- `toolbar-undo-redo`: 撤销/重做按钮禁用态需求变更；新增键盘快捷键需求（Ctrl+Z 撤销、Ctrl+Y 与 Ctrl+Shift+Z 重做、文本输入焦点豁免）。
- `arw-v2-parsing`: V2 转换函数 SHALL 剥离 BOM 的需求变更。
- `alignment-behavior`: 一键对齐目标范围限定为可见曲线；Worker 异常处理需求变更。
- `file-parser`: 解析错误展示新增可清除与成功上传时清空的需求。

## Impact

- 受影响代码：`src/store/curveStore.ts`（zundo 选项）、`src/persistence/index.ts`（快照字段）、`src/components/toolbar/Toolbar.tsx`（按钮状态、JSON 字段）、`src/App.tsx`（键盘快捷键）、`src/components/toolbox/AlignmentControls.tsx`（Worker 错误处理、目标范围）、`src/parser/parseFile.ts`（V2 BOM）、`src/components/layout/LeftPanel.tsx`（错误生命周期）。
- 依赖：zundo（已安装）、zustand（已安装），无新增第三方依赖。
- 测试：新增针对 zundo 节流、持久化字段完整性、JSON 往返、Worker 错误路径、BOM 剥离、快捷键焦点豁免的单元/集成测试；现有 78 项测试须继续通过。
- 风险：zundo `handleSet` 节流参数需平衡响应性与历史粒度；持久化快照新增字段需向后兼容旧版本快照（缺失字段回退默认值，已有逻辑覆盖）。
