## Context

当前系统在用户上传数据后，所有曲线自动添加到 `curves` Record 并立即渲染到 ECharts 图表中。曲线列表中仅展示曲线名称和数据点数，无交互控件。右栏工具箱包含 `AlignmentControls`（自动对齐）和 `OffsetControls`（每条曲线独立的 X/Y 偏移输入框）。

用户的核心痛点：
1. 无法选择哪些曲线需要渲染 — 上传即全部渲染
2. 无法删除不需要的曲线数据
3. 手动为每条曲线输入 Y 偏移值操作繁琐，实际需求是"让曲线分层，便于观察"

## Goals / Non-Goals

**Goals:**
- 实现曲线可见性控制：上传后默认不可见，通过复选框勾选渲染
- 实现曲线删除：单条删除 + 批量删除选中曲线
- 实现 Y 轴可视化分层：一个滑块控制层间距，自动对可见曲线按顺序叠加 Y 偏移
- 移除手动偏置控件（OffsetControls 组件）

**Non-Goals:**
- 不改变 X 轴自动对齐的工作方式（AlignmentControls 保持不变）
- 不改变文件解析逻辑
- 不改变图表渲染引擎（仍使用 ECharts）
- 不引入曲线 z-order 排序功能

## Decisions

### Decision 1: 使用 `Set<string>` 追踪可见曲线

**选择**: 在 curveStore 中新增 `visibleCurves: Set<string>` 字段，存储当前可见曲线的 ID 集合。

**替代方案**:
- 在 `CurveData` 接口上加 `visible: boolean` 字段 → 拒绝：visibility 是 UI 状态，不应污染数据模型
- 使用数组 `visibleCurveIds: string[]` → 拒绝：Set 的 O(1) has/add/delete 操作更高效

**理由**: zustand 配合 immer 可正确处理 Set 的不可变更新；Set 语义精确匹配"集合"的使用场景。

### Decision 2: 分层偏移计算放在渲染层而非 Store

**选择**: 在 `WaterfallChart` 组件的 `useMemo` 中计算分层 Y 偏移，不在 Store 中持久化。Store 仅存储 `layerSpacing` 值。

**替代方案**:
- 在 Store 中为每条曲线存储预计算的 `layerYOffset` → 拒绝：每当 `visibleCurves` 变化时需重新计算所有偏移，增加状态同步复杂度

**理由**: 分层偏移是纯派生数据（由 `layerSpacing` × 可见曲线索引顺序决定），在渲染时实时计算即可，避免状态冗余和不一致风险。

### Decision 3: 分层偏移计算公式

**选择**: 第 i 条可见曲线（i 从 0 开始）的 Y 偏移 = `offsets[id].yOffset + layerSpacing * i`。

即：分层偏移叠加在已有的手动 Y 偏移之上（`offsets[id].yOffset` 保留兼容性，但 UI 不再提供手动输入）。第一条可见曲线不受分层影响（`i=0`），后续曲线按 `layerSpacing` 线性递增。

**理由**: 保持 `offsets` 中的 `yOffset` 字段不变（向后兼容），分层偏移仅作为渲染时的叠加量。

### Decision 4: 删除 OffsetControls，保留 AlignmentControls

**选择**: 删除 `src/components/toolbox/OffsetControls.tsx`，保留 `AlignmentControls.tsx` 不变。新增 `AutoLayerControl.tsx` 作为独立组件。

**理由**: 自动对齐功能（ROI 峰值对齐、互相关对齐）是核心功能，保持不变。手动偏置输入被分层滑块替代，OffsetControls 完全移除。

### Decision 5: CurveList 重建为交互式列表

**选择**: 重写 `CurveList` 组件，每条曲线行包含：
- 颜色指示圆点
- 复选框（控制可见性）
- 曲线名称
- 数据点数
- 删除按钮（×）

列表顶部添加"全选/取消全选"按钮和"删除选中"按钮。

**理由**: 原 CurveList 是纯展示组件，需要大幅改造以支持交互。与其在旧组件上打补丁，不如以新需求重写，保持代码清晰。

## Risks / Trade-offs

- **[风险] 可见曲线频繁变化时 ECharts 动画开销**: 用户快速勾选/取消勾选多条曲线时，`option` 对象频繁重建 → **缓解**: 已设置 `animation: false`，ECharts 不会播放过渡动画；`useMemo` 确保仅在依赖变化时重算
- **[风险] 分层偏移与手动 yOffset 叠加可能产生意外结果**: 如果用户曾通过 undo 恢复旧状态中的手动 yOffset → **缓解**: 移除手动偏置 UI 后，`yOffset` 字段保持为 0。分层偏移的区间范围建议设为 0-2（最小值到最大值），默认 0，步长 0.1，控制在合理范围内
- **[权衡] 删除 OffsetControls 可能影响高级用户**: 习惯手动输入精确偏移值的用户需要适应新方式 → **缓解**: 分层滑块提供数值显示，且支持撤销，可精确定位

## Open Questions

- 层间距滑块的数值范围：建议 0~2，步长 0.1，是否合适？（待确认）
- 是否需要支持负层间距（曲线向下层叠）？（建议支持，滑块范围 -2~2）