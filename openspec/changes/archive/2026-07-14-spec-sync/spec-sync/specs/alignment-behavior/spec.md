# alignment-behavior: Delta Spec (sync to implementation)

## MODIFIED Requirements

### Requirement: 对齐操作不累积偏移量 (overwrite semantics)

对已对齐的曲线再次执行对齐操作时，系统 SHALL NOT 产生额外的偏移累积。对齐算法 SHALL 基于当前已偏移的数据计算增量调整量，确保多次对齐结果一致（幂等性）。The target's NEW xOffset SHALL be computed as `result.xOffset + baselineOffset.xOffset`, OVERWRITING the target's previously-existing manual xOffset (the target's old xOffset is not preserved). The target's existing yOffset IS applied when building the adjusted target data (`adjTarget`). Idempotency holds for already-aligned curves. 执行对齐时 SHALL 尊重 `locked` 曲线——`locked` 为 true 的曲线 SHALL NOT 被修改其 `xOffset`（其 `yOffset` 的锁定语义同横向，按需）。

#### Scenario: 多次对齐结果一致

- **WHEN** 用户对同一组曲线连续点击"一键对齐"按钮多次
- **THEN** 每次对齐后各非锁定曲线的 xOffset 值保持不变——幂等性保证重复对齐不累积偏移；但曲线原有的手动 xOffset SHALL 被对齐结果覆盖

#### Scenario: 对齐跳过锁定曲线

- **WHEN** 用户对含锁定曲线的曲线组点击"一键对齐"
- **THEN** 锁定曲线 xOffset 不变，其余曲线正常对齐

### Requirement: ROI 范围跟随 X 轴可视范围 (SelectAll↔DeselectAll resets xRange)

ROI 范围 SHALL 跟随 `uiStore.xRange`。`xRange` 的写入来源 SHALL 为 ECharts 真实可视范围（通过 `getXAxisExtent()` 读取），而非曲线数据首尾点取整后的全量范围。仅当尚不存在有效 `xRange`、或可见曲线集合由空变为非空（首次出现可见曲线）时，系统 SHALL 执行一次初始化写入；该初始化写入 SHALL 在 chart 完成本次 option 落地之后读取真实可视范围，若读取失败则回退到曲线数据首尾点取整（`Math.floor(dataMin)` / `Math.ceil(dataMax)`）。常规可见性切换（加入/移出叠图、保留至少一条可见曲线）SHALL NOT 覆写既有的 `xRange`，从而 ROI 也不被重置。WHEN `setAllCurvesVisibility(false)` makes `visibleIds` empty, the `hasInitializedXRange` flag SHALL be reset; a subsequent `setAllCurvesVisibility(true)` SHALL re-seed `xRange` from data extent, OVERWRITING the user's previous zoom range. 用户缩放/平移图表时，ROI SHALL 自动同步到当前可视范围。xAxis SHALL 显式设置 `min`/`max` 为取整后的数据范围，阻止 ECharts nice 取整。

#### Scenario: 加载曲线后 ROI 自动设置

- **WHEN** 用户加载曲线数据并勾选显示
- **THEN** ROI 范围自动设置为 ECharts 真实可视范围（取整后的数据范围，如 `[0, 45]`），xAxis 范围一致

#### Scenario: 缩放图表后 ROI 同步更新

- **WHEN** 用户通过滚轮或滑块缩放图表
- **THEN** ROI 范围自动更新为当前可视范围

#### Scenario: 加入叠图后 ROI 不被重置

- **WHEN** 用户已缩放到特定 X 轴可视范围（如 `[500, 1500]`），随后将一条未叠图曲线加入叠图区
- **THEN** `uiStore.xRange` 与 ROI 均保持为该可视范围（`[500, 1500]`），不被覆写为全量数据范围，且图表 dataZoom 视口保持不变

#### Scenario: 移出叠图后 ROI 不被重置

- **WHEN** 用户已缩放到特定 X 轴可视范围，随后取消勾选某条可见曲线（仍至少保留一条可见曲线）
- **THEN** `uiStore.xRange` 与 ROI 保持为当前可视范围，不被覆写为全量数据范围

#### Scenario: 全选切换后 ROI 重置

- **WHEN** 用户已缩放到特定 X 轴可视范围，随后点击"取消全选"（`visibleIds` 变为空），再点击"全选"
- **THEN** `hasInitializedXRange` 被重置，全选时 `xRange` SHALL 从当前数据范围重新初始化，用户之前的缩放范围 SHALL 被覆盖

## REMOVED Requirements

### Requirement (removed scenario): 切换基线后 ROI 更新

**Reason:** Switching baseline does NOT actively trigger an xRange/ROI re-seed in the implementation. ROI passively follows the current xRange, which is updated only by chart zoom/pan events or the initial seed logic. There is no explicit baseline-change -> xRange update path.

**Migration:** Remove the scenario "切换基线后 ROI 更新" from the main spec. The ROI behavior on baseline switch is identical to the general rule: ROI follows the current xRange, which is unchanged by a baseline switch alone.