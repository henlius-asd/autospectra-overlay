# auto-layering Specification

## Purpose
Y 轴自动分层功能，通过可视化滑块控制层间距，自动对可见曲线叠加 Y 偏移实现分层，替代手动偏置输入。
## Requirements
### Requirement: Y 轴分层控制滑块

系统 SHALL 在图表区域右下角提供一个浮层滑块（floating overlay），允许用户设定统一的 Y 轴层间距值。该间距值 SHALL 应用于所有可见曲线，按可见曲线列表顺序为每条曲线自动叠加 Y 偏移。层间距的计算乘数 SHALL 使用 ECharts 实际的 Y 轴范围（yExtent），而非 store 中缓存的 yRange。Y 轴显式边界 SHALL 在最高曲线顶点之上预留固定比例（15%）作为标签专用区域，曲线 SHALL NOT 占满 y 轴全高。

滑块 SHALL 在垂直方向渲染，其轨道 SHALL 在任何 re-render（包括数据导入、颜色调整、可见性切换等触发的重排）之后保持非零高度。滑块 SHALL 始终允许用户拖动到 0 与最大值之间的任意中间值；SHALL NOT 因布局塌缩而退化为仅可达端点的圆点。滑块包裹层的百分比高度 SHALL 解析到一个具有确定高度的定位祖先，以确保轨道高度不为零。

#### Scenario: 默认层间距

- **WHEN** 应用首次加载，用户未操作分层滑块
- **THEN** 层间距值为 0，所有可见曲线按其原始 Y 值渲染，无分层效果

#### Scenario: 拖动滑块调整层间距

- **WHEN** 用户拖动分层滑块到某个正值（如 0.15）
- **THEN** 每条曲线的 Y 偏移按 `layerIndex × layerSpacing × yRangeForLayer` 计算，其中 yRangeForLayer 由不动点公式确定

#### Scenario: y 轴顶部预留标签区域

- **WHEN** 图表渲染时设置了显式 y 轴边界
- **THEN** y 轴 max SHALL 等于 `rawDataMin + yRangeForLayer × (1 + LABEL_PADDING_RATIO)`，其中 `LABEL_PADDING_RATIO = 0.15`，最高曲线顶点约占 y 轴 87% 高度，顶部 13% 留给标签显示

#### Scenario: 滑块在 re-render 后仍可拖动到中间值

- **WHEN** 用户导入数据并调整曲线颜色（触发 WaterfallChart re-render）后，拖动分层滑块
- **THEN** 滑块轨道 SHALL 保持非零高度，用户 SHALL 能将层间距拖动到 0 与最大值之间的任意中间值（如 0.15），且 `layerSpacing` 取到该中间值而非被钳位到端点

### Requirement: 分层仅影响可见曲线

层间距 SHALL 仅应用于当前可见（已勾选）的曲线。不可见曲线 SHALL NOT 参与分层计算，也不影响可见曲线的分层顺序。

#### Scenario: 切换可见性后分层重新计算

- **WHEN** 用户调整了层间距，然后勾选或取消勾选某条曲线
- **THEN** 可见曲线的分层 Y 偏移按新的可见曲线列表顺序重新计算

#### Scenario: 仅一条可见曲线时分层无效果

- **WHEN** 仅有一条曲线被勾选为可见
- **THEN** 无论层间距设置为何值，该曲线的 Y 偏移始终为 0

### Requirement: 分层与自动对齐独立运作

Y 轴分层偏移 SHALL 与 X 轴自动对齐偏移独立计算，两者互不干扰。每条曲线的最终渲染偏移为 X 偏移（来自对齐）和 Y 偏移（来自分层 + 手动偏置）的组合。

#### Scenario: 对齐 + 分层同时生效

- **WHEN** 用户先执行自动对齐，再调整分层滑块
- **THEN** 曲线同时应用 X 轴对齐偏移和 Y 轴分层偏移，两个方向独立

#### Scenario: 分层变化不影响对齐结果

- **WHEN** 用户调整分层滑块
- **THEN** 各曲线的 X 轴偏移量保持不变

### Requirement: 分层控制位置

Y 轴分层控制 SHALL 以浮层滑块形式渲染在图表区域（WaterfallChart）右下角。SHALL NOT 作为命名组件出现在右侧工具箱的自动对齐控制下方。SHALL NOT 使用数值输入框。

#### Scenario: 浮层位置

- **WHEN** 用户打开图表区域
- **THEN** 在图表区域右下角看到垂直浮层滑块，用于控制 Y 轴层间距，右侧工具箱中不包含"Y 轴分层"控制区域

