## 1. uiStore
- [x] 1.1 新增 `showLegend: boolean`（默认 `true`）
- [x] 1.2 新增 `toggleShowLegend: () => void` action

## 2. WaterfallChart
- [x] 2.1 订阅 `showLegend` 状态
- [x] 2.2 `legend.show` 改为 `showLegend && visibleIds.length > 1`
- [x] 2.3 依赖数组加入 `showLegend`

## 3. DisplaySettingsPanel
- [x] 3.1 新增"显示图例" checkbox（位于分隔线下方）
- [x] 3.2 绑定 `showLegend` / `toggleShowLegend`

## 4. 持久化
- [x] 4.1 `saveWorkspace` 的 `uiSnapshot` 包含 `showLegend`
- [x] 4.2 `restoreWorkspace` 恢复 `showLegend`（默认 `true`）
- [x] 4.3 `initPersistence` 的变更检测包含 `showLegend`
- [x] 4.4 workspace JSON 导出/导入包含 `showLegend`

## 5. 验证
- [x] 5.1 "显示图例" checkbox 关闭时图例不显示
- [x] 5.2 "显示图例" checkbox 开启且有多条曲线时图例显示
- [x] 5.3 切换后刷新页面状态保持
- [x] 5.4 `npm run build` 通过