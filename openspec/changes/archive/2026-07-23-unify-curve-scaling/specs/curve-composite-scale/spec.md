# curve-composite-scale Specification

## RENAMED Requirements

- FROM: `### Requirement: 三层复合缩放模型`
- TO: `### Requirement: 两层复合缩放模型`

## MODIFIED Requirements

### Requirement: 两层复合缩放模型

系统 SHALL 为每条曲线维护两个缩放倍率层：全局层（`globalScale`，所有曲线共享）、单曲线层（`curveScales`，每曲线）。两条倍率相乘 SHALL 作为最终曲线缩放倍率。系统 SHALL NOT 维护独立的归一化层；归一化结果 SHALL 直接写入 `curveScales`。

最终渲染公式 SHALL 为 `rendered_y = y * (global × curveScale) + scaleOffset + layerYOffset + offset.yOffset`，其中 scaleOffset 为手动层偏移（`curveScaleOffsets`）。

#### Scenario: 缺省值

- **WHEN** 某层未设置（globalScale 为 null、curveScales 缺 key）
- **THEN** 该层视为倍率 1，不影响复合结果

#### Scenario: 两层相乘

- **WHEN** 曲线 A 的 curveScales=2.0、globalScale=1.5
- **THEN** 最终倍率 = 1.5 × 2.0 = 3.0

### Requirement: 归一化

系统 SHALL 提供归一化动作，一次性将各可见曲线峰值对齐到基准线（`deriveBaseline` = 最底可见曲线）峰值。归一化因子 SHALL 按当前可见 X 范围计算，从原始曲线数据（不含 scale/offset）取峰值。归一化因子 SHALL 直接写入 `curveScales[id]`（覆盖已有手动缩放值），SHALL NOT 写入独立字段。归一化 SHALL 为单次 undo 条目。归一化前 SHALL 弹出确认提示，用户确认后方可执行。

#### Scenario: 峰值对齐到基准线

- **WHEN** 用户确认归一化，基准线峰值 = 100，曲线 A 峰值 = 50，曲线 B 峰值 = 200
- **THEN** 曲线 A 的 curveScales = 2.0，曲线 B 的 curveScales = 0.5，归一后两者峰值均为 100

#### Scenario: 无可见曲线

- **WHEN** 用户触发归一化但无可见曲线
- **THEN** 无操作，所有 curveScales 不变

#### Scenario: 曲线峰值为零或负

- **WHEN** 某条可见曲线在 X 范围内峰值 ≤ 0
- **THEN** 该曲线的 curveScales 设为 1（跳过）

#### Scenario: 归一化覆盖手动缩放

- **WHEN** 曲线 A 已有手动 curveScales=1.8，用户确认归一化，计算得归一化因子=0.5
- **THEN** 曲线 A 的 curveScales 被覆盖为 0.5（不保留 1.8）

#### Scenario: 归一化前确认提示

- **WHEN** 用户点击归一化按钮
- **THEN** 弹出按钮旁 popover 确认提示，含警告文案"归一化将覆盖所有单曲线缩放调整"和确认/取消按钮，用户取消则不执行

### Requirement: Y 轴范围自适应缩放

生成 Y 轴范围时，系统 SHALL 基于原始未缩放数据（仅 `yVal + offset.yOffset`）计算 `rawDataMin` 和 `rawDataMax`，且 SHALL 遍历每条可见曲线的**全部**数据点（SHALL NOT 按当前 `xRange` 窗口过滤）。`dataSpan`、`yRangeForLayer`、`yAxisMin`、`yAxisMax` SHALL 全部由全量数据派生，从而在用户平移/缩放 X 轴时保持稳定。缩放后的曲线 SHALL 通过 `clip: false` 溢出轴范围。`computeYAxisRange` SHALL NOT 接受 `globalScale`、`curveScales`、`curveScaleOffsets`、`xRange` 参数。

#### Scenario: 全局放大后曲线可见变大

- **WHEN** 用户将 `globalScale` 调至 2.0
- **THEN** 所有曲线在固定 Y 轴范围内显示为 2 倍高度，可能溢出轴范围

#### Scenario: 单曲线缩放后曲线可见变小

- **WHEN** 用户将某条曲线的 `curveScales` 调至 0.1
- **THEN** 该曲线在固定 Y 轴范围内显示为 0.1 倍高度，视觉上可见缩小

#### Scenario: 轴范围不随缩放变化

- **WHEN** 用户缩放曲线后
- **THEN** Y 轴范围保持不变（基于原始数据），只有曲线数据改变

#### Scenario: X 平移/缩放不改变 Y 轴范围与层间距

- **WHEN** 用户已加载曲线并通过 dataZoom 平移或缩放 X 轴到不同可视窗口（窗口内极值与全量极值不同）
- **THEN** `yAxisMin`、`yAxisMax`、`dataSpan`、`yRangeForLayer` 保持不变，曲线不自动重缩放、曲线层（`layerYOffset`）不发生垂直错位

## ADDED Requirements

### Requirement: 重置缩放

系统 SHALL 提供重置动作，一次性清空所有曲线的 `curveScales` 和 `curveScaleOffsets`，使所有曲线回到 ×1 无偏移状态。重置 SHALL 为单次 undo 条目。

#### Scenario: 重置清空所有曲线缩放

- **WHEN** 曲线 A curveScales=2.0、曲线 B curveScales=0.5，用户点击重置
- **THEN** 所有 curveScales 清空为 {}，curveScaleOffsets 清空为 {}，所有曲线回到 ×1

#### Scenario: 重置不影响全局缩放

- **WHEN** globalScale=1.5，用户点击重置
- **THEN** curveScales 清空，但 globalScale 保持 1.5 不变

## REMOVED Requirements

### Requirement: 持久化缩放状态

**Reason**: `normalizeFactors` 字段已被移除，归一化值直接写入 `curveScales`。持久化逻辑由 `workspace-persistence` spec 的迁移 requirement 覆盖。
**Migration**: 旧快照含 `normalizeFactors` 字段时，按 version 迁移将值乘入 `curveScales`，详见 `workspace-persistence` spec。