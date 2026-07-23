## Why

当前曲线缩放采用三层独立乘数模型（归一化层 `normalizeFactors` × 全局层 `globalScale` × 手动层 `curveScales`），导致用户心智模型割裂：归一化和手动缩放在底层是两个不可见乘数，但用户只关心"这条曲线被放大了多少"。同时工具箱面板默认展开过多（3 栏），标签样式/曲线样式等面板标题被遮挡，语义不清晰；"数据处理"面板仅含归一化/重置两个按钮，与"自动对齐"同属叠图前置步骤却被拆分到独立面板。

## What Changes

- **BREAKING**: 移除 `normalizeFactors` 独立缩放层，归一化结果直接写入 `curveScales`，缩放公式从 `normalize × global × manual` 简化为 `global × curveScale`
- 归一化按钮从"数据处理"面板移入"自动对齐"面板，后者改名为"自动叠图"
- "数据处理"面板删除（内容已合并）
- 归一化前弹出确认提示（按钮旁 popover），警告将覆盖单曲线缩放调整
- "重置"按钮语义改为清空所有 `curveScales`（回到 ×1），不保留归一化前的手动值
- 工具箱面板重排：元数据 → 自动叠图 → 层间距 → 标签样式 → 曲线样式 → 显示设置
- 初始默认展开仅"元数据"和"自动叠图"两栏
- 旧工作区快照含 `normalizeFactors` 字段时迁移：将值乘入对应曲线的 `curveScales`，删除 `normalizeFactors`

## Capabilities

### New Capabilities

（无——全部为对现有 spec 的修改）

### Modified Capabilities

- `curve-composite-scale`: 三层缩放模型简化为两层；归一化写入 `curveScales` 而非独立 `normalizeFactors`；归一化前确认提示；重置清空所有 `curveScales`
- `scale-slider`: 缩放倍率 badge 公式从 `normalize × global × manual` 改为 `global × curveScale`
- `three-column-layout`: 工具箱面板重排、自动对齐改名自动叠图、删除数据处理面板、默认展开项调整为元数据+自动叠图
- `workspace-persistence`: 移除 `normalizeFactors` 持久化字段；旧快照迁移将 `normalizeFactors` 乘入 `curveScales`
- `state-management`: curveStore 移除 `normalizeFactors` 字段及相关 actions；新建工作区不再清空该字段

## Impact

- `src/store/curveStore.ts`: 移除 `normalizeFactors` 字段及 `setNormalizeFactor`/`clearNormalizeFactors` actions；`normalizeAllPeak` 改为写入 `curveScales`；新增清空所有 `curveScales` 的 action
- `src/components/chart/WaterfallChart.tsx`: `composite` 公式简化（移除 normalize 项）；`scaleBadge` 显示更新
- `src/components/layout/RightPanel.tsx`: 面板顺序、默认展开项、面板名称更新
- `src/components/toolbox/AlignmentControls.tsx`: 合并归一化/重置按钮，标题改名为自动叠图，归一化前确认 popover
- `src/components/toolbox/DataProcessingPanel.tsx`: 删除
- `src/persistence/index.ts`: 移除 `normalizeFactors` 持久化，添加 v4 迁移逻辑
- 相关测试更新（`curveStore.test.ts`、`persistence/index.test.ts`、`e2e/export-pptx.spec.ts`）
