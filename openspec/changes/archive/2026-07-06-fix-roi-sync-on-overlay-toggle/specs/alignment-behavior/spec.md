## MODIFIED Requirements

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
