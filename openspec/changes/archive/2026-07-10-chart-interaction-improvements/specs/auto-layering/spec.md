# auto-layering Delta Spec

## MODIFIED Requirements

### Requirement: Y 轴分层控制滑块

系统 SHALL 在右侧工具箱区域提供一个 Y 轴分层控制滑块（range input），允许用户设定统一的 Y 轴层间距值。该间距值 SHALL 应用于所有可见曲线，按可见曲线列表顺序为每条曲线自动叠加 Y 偏移。Y 轴显式边界 SHALL 在最高曲线顶点之上预留固定比例（15%）作为标签专用区域，曲线 SHALL NOT 占满 y 轴全高。

Y 轴范围计算 SHALL 考虑每条曲线的独立 Y 轴缩放因子（`curveScales`）。渲染时曲线数据 SHALL 先应用 `y * scale` 变换，再叠加 `layerYOffset` 和 `offset.yOffset`。`computeYAxisRange` SHALL 在遍历可见曲线数据点时将 `y * scale` 纳入 min/max 计算。

#### Scenario: 默认层间距

- **WHEN** 应用首次加载，用户未操作分层滑块
- **THEN** 层间距值为 0，所有可见曲线按其缩放后的 Y 值渲染，无分层效果

#### Scenario: 拖动滑块调整层间距

- **WHEN** 用户拖动分层滑块到某个正值（如 0.15）
- **THEN** 每条曲线先应用 Y 缩放因子，再按 `layerIndex × layerSpacing × yRangeForLayer` 叠加 Y 偏移，其中 yRangeForLayer 由不动点公式基于缩放后数据确定

#### Scenario: y 轴顶部预留标签区域

- **WHEN** 图表渲染时设置了显式 y 轴边界
- **THEN** y 轴 max SHALL 等于缩放后数据的 `yRangeForLayer × 1.15`，最高曲线顶点约占 y 轴 87% 高度，顶部 13% 留给标签显示

#### Scenario: 缩放后的分层

- **WHEN** 某条曲线缩放倍率为 2.0，层间距为 0.1
- **THEN** 该曲线数据先乘以 2.0 缩放，再叠加分层偏移，Y 轴范围基于缩放后的数据计算

### Requirement: 分层仅影响可见曲线

层间距 SHALL 仅应用于当前可见（已勾选）的曲线。不可见曲线 SHALL NOT 参与分层计算，也不影响可见曲线的分层顺序。

#### Scenario: 切换可见性后分层重新计算

- **WHEN** 用户调整了层间距，然后勾选或取消勾选某条曲线
- **THEN** 可见曲线的分层 Y 偏移按新的可见曲线列表顺序重新计算，Y 轴范围按缩放后数据重新计算

#### Scenario: 仅一条可见曲线时分层无效果

- **WHEN** 仅有一条曲线被勾选为可见
- **THEN** 无论层间距设置为何值，该曲线的 Y 偏移始终为 0

### Requirement: 分层与自动对齐独立运作

Y 轴分层偏移 SHALL 与 X 轴自动对齐偏移独立计算，两者互不干扰。每条曲线的最终渲染偏移为 X 偏移（来自对齐）和 Y 偏移（来自分层 + 手动偏置）的组合。Y 轴缩放因子 SHALL 在分层和对齐偏移之前应用。

#### Scenario: 对齐 + 分层 + 缩放同时生效

- **WHEN** 用户先执行自动对齐，再调整分层滑块，再对某条曲线进行 Y 轴缩放
- **THEN** 曲线同时应用 Y 轴缩放、X 轴对齐偏移和 Y 轴分层偏移，三者独立

#### Scenario: 分层变化不影响对齐结果

- **WHEN** 用户调整分层滑块
- **THEN** 各曲线的 X 轴偏移量和 Y 轴缩放倍率保持不变

### Requirement: 分层控制位置

Y 轴分层控制 SHALL 位于右侧工具箱的自动对齐控制下方，使用可视化滑块而非数值输入框。SHALL NOT 为每条曲线分别显示 Y 偏移输入框。

#### Scenario: 工具箱布局

- **WHEN** 用户打开右侧工具箱
- **THEN** 看到"自动对齐"控制区域，其下方有"Y 轴分层"控制区域，包含层间距滑块；不再显示每条曲线的独立 X/Y 偏移输入框