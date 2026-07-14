# alignment-behavior Specification

## Purpose
曲线对齐操作的行为规范，包括对齐幂等性、ROI 与可视范围同步、以及缩放状态保留。
## Requirements
### Requirement: 对齐操作不累积偏移量

对已对齐的曲线再次执行对齐操作时，系统 SHALL NOT 产生额外的偏移累积。对齐算法 SHALL 基于当前已偏移的数据（含手动移动写入的 `xOffset`/`yOffset`）计算增量调整量，确保多次对齐结果一致（幂等性）。执行对齐时 SHALL 尊重 `locked` 曲线——`locked` 为 true 的曲线 SHALL NOT 被修改其 `xOffset`（其 `yOffset` 的锁定语义同横向，按需）。

#### Scenario: 多次对齐结果一致

- **WHEN** 用户对同一组曲线连续点击"一键对齐"按钮多次
- **THEN** 每次对齐后各非锁定曲线的 xOffset 值保持不变（不递增/递减）

#### Scenario: 对齐跳过锁定曲线

- **WHEN** 用户对含锁定曲线的曲线组点击"一键对齐"
- **THEN** 锁定曲线 xOffset 不变，其余曲线正常对齐

### Requirement: 对齐操作保留图表缩放状态

对齐操作 SHALL NOT 重置图表的 dataZoom 缩放/平移状态。用户在对齐前后 SHALL 看到相同的 X 轴可视范围。

#### Scenario: 对齐后缩放状态不变

- **WHEN** 用户缩放到特定 X 轴范围后点击"一键对齐"
- **THEN** 图表保持当前缩放范围，不对 dataZoom 进行重置

### Requirement: ROI 范围跟随 X 轴可视范围

ROI 范围 SHALL 跟随 `uiStore.xRange`。`xRange` 的写入来源 SHALL 为 ECharts 真实可视范围（通过 `getXAxisExtent()` 读取），而非曲线数据首尾点取整后的全量范围。仅当尚不存在有效 `xRange`、或可见曲线集合由空变为非空（首次出现可见曲线）时，系统 SHALL 执行一次初始化写入；该初始化写入 SHALL 在 chart 完成本次 option 落地之后读取真实可视范围，若读取失败则回退到曲线数据首尾点取整（`Math.floor(dataMin)` / `Math.ceil(dataMax)`）。可见性切换（加入/移出叠图、全选/取消全选）SHALL NOT 覆写既有的 `xRange`，从而 ROI 也不被重置。用户缩放/平移图表时，ROI SHALL 自动同步到当前可视范围。xAxis SHALL 显式设置 `min`/`max` 为取整后的数据范围，阻止 ECharts nice 取整。

#### Scenario: 加载曲线后 ROI 自动设置

- **WHEN** 用户加载曲线数据并勾选显示
- **THEN** ROI 范围自动设置为 ECharts 真实可视范围（取整后的数据范围，如 `[0, 45]`），xAxis 范围一致

#### Scenario: 缩放图表后 ROI 同步更新

- **WHEN** 用户通过滚轮或滑块缩放图表
- **THEN** ROI 范围自动更新为当前可视范围

#### Scenario: 切换基线后 ROI 更新

- **WHEN** 用户切换基线曲线
- **THEN** ROI 范围自动更新为当前图表 X 轴可视范围

#### Scenario: 加入叠图后 ROI 不被重置

- **WHEN** 用户已缩放到特定 X 轴可视范围（如 `[500, 1500]`），随后将一条未叠图曲线加入叠图区
- **THEN** `uiStore.xRange` 与 ROI 均保持为该可视范围（`[500, 1500]`），不被覆写为全量数据范围，且图表 dataZoom 视口保持不变

#### Scenario: 移出叠图后 ROI 不被重置

- **WHEN** 用户已缩放到特定 X 轴可视范围，随后取消勾选某条可见曲线（仍至少保留一条可见曲线）
- **THEN** `uiStore.xRange` 与 ROI 保持为当前可视范围，不被覆写为全量数据范围

#### Scenario: 全选切换后 ROI 不被重置

- **WHEN** 用户已缩放到特定 X 轴可视范围，随后点击"全选"或"取消全选"
- **THEN** `uiStore.xRange` 与 ROI 保持为当前可视范围，不被覆写为全量数据范围

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

