## MODIFIED Requirements

### Requirement: 对齐操作不累积偏移量

对已对齐的曲线再次执行对齐操作时，系统 SHALL NOT 产生额外的偏移累积。对齐算法 SHALL 基于当前已偏移的数据（含手动移动写入的 `xOffset`/`yOffset`）计算增量调整量，确保多次对齐结果一致（幂等性）。执行对齐时 SHALL 尊重 `locked` 曲线——`locked` 为 true 的曲线 SHALL NOT 被修改其 `xOffset`（其 `yOffset` 的锁定语义同横向，按需）。

#### Scenario: 多次对齐结果一致

- **WHEN** 用户对同一组曲线连续点击"一键对齐"按钮多次
- **THEN** 每次对齐后各非锁定曲线的 xOffset 值保持不变（不递增/递减）

#### Scenario: 对齐跳过锁定曲线

- **WHEN** 用户对含锁定曲线的曲线组点击"一键对齐"
- **THEN** 锁定曲线 xOffset 不变，其余曲线正常对齐
