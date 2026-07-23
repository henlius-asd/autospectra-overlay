## Context

当前曲线 Y 轴缩放采用三层独立乘数模型，定义在 `curve-composite-scale` spec 中：

```
rendered_y = y * (normalize × global × manual) + scaleOffset + layerYOffset + offset.yOffset
```

其中 `normalize = normalizeFactors[id]`（归一化按钮设置）、`global = globalScale`（全局缩放模式）、`manual = curveScales[id]`（单曲线缩放模式）三者独立维护。用户在工具箱中看到的是"数据处理"面板（归一化/重置按钮）和工具栏上的全局缩放/单曲线缩放按钮，三者分别影响不同层，语义割裂。

工具箱（右栏）当前 7 个 Accordion 面板中 3 个默认展开（自动对齐、标签样式、曲线样式），导致面板标题被遮挡。"数据处理"面板仅含 2 个按钮，与"自动对齐"同属叠图前置步骤却被拆分。

## Goals / Non-Goals

**Goals:**

- 将缩放模型从三层简化为两层（`global × curveScale`），归一化直接写入 `curveScales`
- 合并"数据处理"面板到"自动对齐"面板（改名为"自动叠图"）
- 工具箱面板重排为符合工作流的顺序，初始仅展开 2 栏
- 旧工作区快照无损迁移

**Non-Goals:**

- 不改变 `globalScale` 的行为（滚轮缩放、双击复位、钳制范围 [0.1, 10.0] 不变）
- 不改变 `curveScaleOffsets`（手动平移偏移）的行为
- 不改变单曲线缩放模式的交互方式（滚轮、Shift+拖拽、双击复位）
- 不引入"归一化前手动值"的影子状态保存
- 不改变归一化的峰高比算法本身（仍按 X 范围取峰值、基准线为最底可见曲线）

## Decisions

### 决策 1：归一化写入 `curveScales`，而非 `globalScale`

**选择：** 归一化结果 `baselinePeak / peak` 直接写入 `curveScales[id]`。

**理由：** `globalScale` 是所有曲线共享的单一标量，归一化是每曲线独立的值，写入 `globalScale` 语义不通。`curveScales` 本就是每曲线独立缩放字段，归一化写入它后，用户心智模型中只有"全局缩放 × 这条曲线的缩放"两个概念。

**替代方案：** 保留 `normalizeFactors` 但在 UI 上隐藏——被否决，因为底层复杂度不变、只是把问题藏起来。

### 决策 2：归一化直接覆盖手动缩放，不保留影子状态

**选择：** 归一化时 `curveScales[id] = baselinePeak / peak`，直接覆盖已有手动值。不额外存储"归一化前的手动值"。

**理由：** 确认提示已警告用户覆盖后果；合理工作流是"对齐 → 归一化 → 手动微调"，归一化在手动微调之前。影子状态增加持久化/撤销的维护成本，收益不抵成本。

**替代方案：** 额外存 `baseManualScales` 数组，重置时恢复——被否决。

### 决策 3：归一化前确认提示用 popover

**选择：** 点击"归一化"按钮时弹出按钮旁的 popover（非全屏 modal），含确认/取消按钮和警告文案"归一化将覆盖所有单曲线缩放调整"。

**理由：** 归一化是不可逆操作（覆盖手动值），需要强阻断防止误操作；但 popover 比 modal dialog 轻，不打断整个页面焦点。

### 决策 4：重置 = 清空所有 `curveScales`

**选择：** "重置"按钮调用清空所有 `curveScales` 的 action（回到 ×1），同时清空 `curveScaleOffsets`。

**理由：** "重置"在叠图语境下意味着"所有曲线缩放回到初始"，语义清晰。原 `clearNormalizeFactors` 只清归一化层、保留手动层的行为在两层模型下不存在了。

### 决策 5：快照迁移 v3 → v4

**选择：** 快照 version 从 3 升至 4。恢复时若 `version < 4` 且快照含 `normalizeFactors`，对每条曲线执行 `curveScales[id] = (curveScales[id] ?? 1) * (normalizeFactors[id] ?? 1)`，然后删除 `normalizeFactors`。

**理由：** 旧的 `normalize × curveScale` 复合值必须完整迁移到 `curveScales`，否则归一化效果丢失。迁移后 `curveScales` 包含了原归一化因子的乘积，渲染结果不变。

### 决策 6：面板顺序按工作流排列

**选择：** 元数据 → 自动叠图 → 层间距 → 标签样式 → 曲线样式 → 显示设置。初始仅展开"元数据"+"自动叠图"。

**理由：** 工作流为"理解数据 → 对齐+归一化 → 调整层间距 → 美化样式 → 显示控制"。元数据和自动叠图是首屏必看项，其余折叠减少视觉噪音。

## Risks / Trade-offs

- **[风险] 归一化覆盖手动缩放导致用户丢失调整** → 确认 popover 提供强阻断，用户必须主动确认；归一化后可手动重新调整
- **[风险] 旧快照迁移时 `curveScales` 已有手动值，乘以 `normalizeFactors` 后复合值不精确** → 迁移逻辑保证 `normalize × manual` 的数学等价性，渲染结果不变
- **[权衡] 重置同时清空归一化和手动值** → 用户可能期望只撤销归一化；但两层模型下无法区分两者来源，清空是最简正确语义
- **[风险] `exportPptx.ts` 中引用了 `normalizeFactors`** → 迁移时同步更新导出逻辑，移除 normalize 引用，composite 公式简化
