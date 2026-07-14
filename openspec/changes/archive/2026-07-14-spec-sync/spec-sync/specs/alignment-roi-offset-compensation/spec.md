# alignment-roi-offset-compensation: Delta Spec (sync to implementation)

## MODIFIED Requirements

### Requirement: 对齐算法补偿 ROI 偏置 (small-range semantics)

系统 SHALL 在对齐算法执行前，将目标曲线数据偏置到基准线坐标系，确保两组数据处于同一坐标系，使 ROI 提取对两组数据都能正确工作。The target data SHALL be offset by `baselineOffset.xOffset` (and the target's existing `yOffset`) to bring it into the baseline coordinate frame. Because alignment adjustments are SMALL-RANGE, the target's existing xOffset is NOT subtracted — the formula uses `result.xOffset + baselineOffset.xOffset` only. The alignment result is a small delta. Idempotency: repeating alignment on an already-aligned curve yields the same result; however, a curve's pre-existing MANUAL xOffset WILL be overwritten by the alignment result (small-range deltas are additive onto the baseline frame).

#### Scenario: 目标曲线有较大偏置时对齐仍能收敛

- **WHEN** 目标曲线已有较大的 xOffset（如 500），基准线 xOffset 为 0，且 ROI 范围为 [100, 200]
- **THEN** 目标数据被偏置到基准线坐标系（仅应用 `baselineOffset.xOffset` 和 target 的 `yOffset`，不减去 target 的 `xOffset`），对齐算法在相同的 ROI 范围内正确提取两组数据的对应区域，对齐结果正确收敛

#### Scenario: 基准线有偏置时目标数据正确偏置

- **WHEN** 基准线有非零 xOffset（如 100），目标曲线 xOffset 为 0，且 ROI 范围为 [200, 300]
- **THEN** 目标数据被偏置到基准线坐标系（应用 `baselineOffset.xOffset`），对齐算法在 [200, 300] 范围内正确提取两组数据

#### Scenario: 多次对齐不累积偏置 (idempotent, overwrites manual offset)

- **WHEN** 用户对同一组曲线连续点击"一键对齐"多次
- **THEN** 每次对齐后各曲线的 xOffset 值保持不变（幂等性）；但曲线原有的手动 xOffset SHALL 被对齐结果覆盖，对齐结果替代原有值

#### Scenario: ROI 峰值对齐和互相关对齐行为一致

- **WHEN** 用户分别使用 ROI 最大峰对齐和互相关波形对齐
- **THEN** 两种方法都使用相同的坐标系统一逻辑，不会因偏置大小而产生行为差异