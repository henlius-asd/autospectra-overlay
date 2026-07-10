# curve-composite-scale Specification

## Purpose
三层复合缩放模型：归一化层、全局层、手动层相乘得到最终曲线倍率。支持全局缩放（所有曲线一起）、归一化（一键对齐到基准线峰值）、单曲线手动缩放，仅作用于 Y 值。

## ADDED Requirements

### Requirement: 三层复合缩放模型

系统 SHALL 为每条曲线维护三个独立的缩放倍率层：归一化层（`normalizeFactors`，每曲线）、全局层（`globalScale`，所有曲线共享）、手动层（`curveScales`，每曲线）。三条倍率相乘 SHALL 作为最终曲线缩放倍率。

最终渲染公式 SHALL 为 `rendered_y = y * (normalize × global × manual) + scaleOffset + layerYOffset + offset.yOffset`，其中 scaleOffset 为手动层偏移（`curveScaleOffsets`）。

#### Scenario: 缺省值

- **WHEN** 某层未设置（normalizeFactors 缺 key、globalScale 为 null、curveScales 缺 key）
- **THEN** 该层视为倍率 1，不影响复合结果

#### Scenario: 三层相乘

- **WHEN** 曲线 A 的 normalizeFactors=2、globalScale=1.5、curveScales=0.8
- **THEN** 最终倍率 = 2 × 1.5 × 0.8 = 2.4

### Requirement: 全局缩放

系统 SHALL 提供全局缩放模式（`globalScaleMode` 独立布尔开关），用户在该模式下滚轮调节所有曲线共享的 `globalScale`。`globalScale` SHALL 钳制在 [0.1, 10.0] 范围。双击 SHALL 复位 `globalScale` 为 1。滚轮 SHALL 通过原生 `addEventListener('wheel', handler, { passive: false })` 监听，SHALL 调用 `preventDefault` 阻止 ECharts dataZoom。

#### Scenario: 滚轮放大全局倍率

- **WHEN** 用户在全局缩放模式下向上滚轮
- **THEN** 所有曲线按相同比例放大，`globalScale` 增大

#### Scenario: 滚轮缩小全局倍率

- **WHEN** 用户在全局缩放模式下向下滚轮
- **THEN** 所有曲线按相同比例缩小，`globalScale` 减小

#### Scenario: 全局倍率范围限制

- **WHEN** 滚轮调节使 `globalScale` 超出 [0.1, 10.0]
- **THEN** 倍率被钳制在边界值

#### Scenario: 双击复位全局倍率

- **WHEN** 用户在全局缩放模式下双击
- **THEN** `globalScale` 复位为 1，所有曲线恢复原始缩放

### Requirement: 归一化

系统 SHALL 提供归一化动作，一次性将各可见曲线峰值对齐到基准线（`deriveBaseline` = 最底可见曲线）峰值。归一化因子 SHALL 按当前可见 X 范围计算，从原始曲线数据（不含 scale/offset）取峰值。归一化因子 SHALL 不钳制。归一化 SHALL 为单次 undo 条目。

#### Scenario: 峰值对齐到基准线

- **WHEN** 用户触发归一化，基准线峰值 = 100，曲线 A 峰值 = 50，曲线 B 峰值 = 200
- **THEN** 曲线 A 的 normalizeFactor = 2.0，曲线 B 的 normalizeFactor = 0.5，归一后两者峰值均为 100

#### Scenario: 无可见曲线

- **WHEN** 用户触发归一化但无可见曲线
- **THEN** 无操作，所有 normalizeFactors 不变

#### Scenario: 曲线峰值为零或负

- **WHEN** 某条可见曲线在 X 范围内峰值 ≤ 0
- **THEN** 该曲线的 normalizeFactor 设为 1（跳过）

#### Scenario: 清除归一化

- **WHEN** 用户触发清除归一化
- **THEN** 所有 normalizeFactors 重置为 1，曲线恢复原始高度

#### Scenario: 归一化后仍可手动调节

- **WHEN** 归一化完成后用户在 split 模式下滚轮缩放某条曲线
- **THEN** 该曲线的 `curveScales`（手动层）改变，与归一化因子相乘生效

### Requirement: Y 轴范围自适应缩放

生成 Y 轴范围时，系统 SHALL 基于原始未缩放数据（仅 `yVal + offset.yOffset`）计算 `rawDataMin` 和 `rawDataMax`。缩放后的曲线 SHALL 通过 `clip: false` 溢出轴范围。`computeYAxisRange` SHALL NOT 接受 `normalizeFactors`、`globalScale`、`curveScales`、`curveScaleOffsets` 参数。

#### Scenario: 全局放大后曲线可见变大

- **WHEN** 用户将 `globalScale` 调至 2.0
- **THEN** 所有曲线在固定 Y 轴范围内显示为 2 倍高度，可能溢出轴范围

#### Scenario: 手动缩小后曲线可见变小

- **WHEN** 用户将某条曲线的 `curveScales` 调至 0.1
- **THEN** 该曲线在固定 Y 轴范围内显示为 0.1 倍高度，视觉上可见缩小

#### Scenario: 轴范围不随缩放变化

- **WHEN** 用户缩放曲线后
- **THEN** Y 轴范围保持不变（基于原始数据），只有曲线数据改变

### Requirement: 两个独立缩放工具

系统 SHALL 提供两个独立的缩放工具开关：`globalScaleMode`（全局缩放）和 `perCurveScaleMode`（单曲线缩放），各自独立 on/off，不互斥。当两者同时激活时，滚轮 SHALL 优先作用于选中曲线（如有），否则作用于全局。

#### Scenario: 两者独立开关

- **WHEN** 用户激活全局缩放，再激活单曲线缩放
- **THEN** 两者都为 on，互不影响

#### Scenario: 两者同时激活优先单曲线

- **WHEN** 全局缩放和单曲线缩放都激活，曲线 A 被选中，滚轮
- **THEN** 曲线 A 的 `curveScales` 改变（而非 globalScale）

#### Scenario: 单曲线模式无选中曲线回退全局

- **WHEN** 单曲线缩放激活但无选中曲线，全局缩放也激活，滚轮
- **THEN** `globalScale` 改变（回退到全局缩放）

### Requirement: 持久化缩放状态

系统 SHALL 将 `globalScale` 和 `normalizeFactors` 持久化到 workspace JSON（IndexedDB），在页面刷新后恢复。缺省回退值 SHALL 为 1。

#### Scenario: 刷新后恢复

- **WHEN** 用户设置 `globalScale=2.0` 并归一化两条曲线后刷新页面
- **THEN** `globalScale` 恢复为 2.0，`normalizeFactors` 恢复为之前的值，曲线显示与刷新前一致