# alignment-behavior Delta

## ADDED Requirements

### Requirement: 对齐目标范围限定为可见叠图曲线

一键对齐 SHALL 仅对当前叠图区可见曲线（即同时存在于 `stagingOrder` 与 `visibleCurves` 中的曲线）执行偏移计算与写入，SHALL NOT 对未叠图或不可见曲线的 `offsets` 产生任何变更。对齐按钮的禁用条件 SHALL 基于可见曲线数量：当可见曲线数少于 2 或不存在基准线时，按钮 SHALL 禁用。

#### Scenario: 不可见曲线偏移不被修改

- **WHEN** 存在 3 条曲线，其中 1 条未勾选显示（不在 `visibleCurves`），用户点击"一键对齐"
- **THEN** 仅 2 条可见曲线参与对齐，未勾选曲线的 `offsets` 保持点击前的值不变

#### Scenario: 可见曲线不足时按钮禁用

- **WHEN** 叠图区可见曲线数为 1（仅基准线本身，无非基准目标）
- **THEN** "一键对齐"按钮处于禁用态，无法点击

### Requirement: 对齐 Worker 异常处理

当对齐算法通过 Web Worker 执行时，系统 SHALL 同时挂载 `onmessage` 与 `onerror`（及 `onmessageerror`）。Worker 异常时 SHALL：拒绝对应 Promise、`terminate()` 该 Worker、终止对齐进度（将进度状态重置为无进度）、恢复对齐按钮为可用态，并向用户给出失败提示。SHALL 确保任何异常路径下进度状态不被永久挂起、按钮不被永久禁用。

#### Scenario: Worker 抛错后可重试

- **WHEN** 对齐过程中 Worker 触发 `onerror`
- **THEN** 进度提示消失，按钮恢复可用，用户可再次点击"一键对齐"重试

#### Scenario: 对齐完成正常清理

- **WHEN** 对齐算法在所有目标曲线上正常完成
- **THEN** 所有临时 Worker SHALL 被 `terminate()`，进度状态重置，按钮恢复可用
