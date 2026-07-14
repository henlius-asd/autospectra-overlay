## Phase 1 — 修复持久化缺口

- [x] 1.1 `persistence/index.ts`：`uiSnapshot` 新增 `xRange`、`yZoomRange`、`colorHistory`
- [x] 1.2 `restoreWorkspace`：恢复 `xRange`、`yZoomRange`、`colorHistory`（缺失回退默认值）
- [x] 1.3 `initPersistence`：订阅条件增加 `xRange`、`yZoomRange`、`colorHistory` 变更
- [x] 1.4 `handleExportJSON`（Toolbar.tsx）：JSON 导出追加 `showGrid`、`showXAxis`、`showYAxis`、`xRange`
- [x] 1.5 `handleImportJSON`（Toolbar.tsx）：JSON 导入恢复 `showGrid`、`showXAxis`、`showYAxis`、`xRange`

## Phase 2 — 新建工作区

- [x] 2.1 `curveStore.ts`：新增 `resetWorkspace()` action（全默认状态一次性 set）
- [x] 2.2 `uiStore.ts`：新增 `resetUiForNewWorkspace()` action（复位渲染字段，保留偏好）
- [x] 2.3 `Toolbar.tsx`：新增"新建工作区"按钮 + `confirm` 弹窗 + 调用序列
- [x] 2.4 序列中调用 `temporal.clear()` 清空 zundo 历史
- [x] 2.5 序列中调用 `clearWorkspace()` 删除 IndexedDB `current_workspace` key

## 验证

- [x] 3.1 `npx tsc --noEmit` 干净
- [x] 3.2 `npx vitest run` 全绿
- [x] 3.3 `npm run build` 成功
- [ ] 3.4 人工回归：刷新后 X/Y 缩放位置保留；JSON 导出/导入显示开关保留；新建工作区清空数据但保留偏好；新建后刷新不复现旧数据