## MODIFIED Requirements

### Requirement: Y 轴分层控制滑块

系统 SHALL 在右侧工具箱区域提供一个 Y 轴分层控制滑块（range input），允许用户设定统一的 Y 轴层间距值。该间距值 SHALL 应用于所有可见曲线，按可见曲线列表顺序为每条曲线自动叠加 Y 偏移。层间距的计算乘数 SHALL 使用 ECharts 实际的 Y 轴范围（yExtent），而非 store 中缓存的 yRange。Y 轴显式边界 SHALL 在最高曲线顶点之上预留固定比例（15%）作为标签专用区域，曲线 SHALL NOT 占满 y 轴全高。

滑块 SHALL 在垂直方向渲染，其轨道 SHALL 在任何 re-render（包括数据导入、颜色调整、可见性切换等触发的重排）之后保持非零高度。滑块 SHALL 始终允许用户拖动到 0 与最大值之间的任意中间值；SHALL NOT 因布局塌缩而退化为仅可达端点的圆点。滑块包裹层的百分比高度 SHALL 解析到一个具有确定高度的定位祖先，以确保轨道高度不为零。

#### Scenario: 默认层间距

- **WHEN** 应用首次加载，用户未操作分层滑块
- **THEN** 层间距值为 0，所有可见曲线按其原始 Y 值渲染，无分层效果

#### Scenario: 拖动滑块调整层间距

- **WHEN** 用户拖动分层滑块到某个正值（如 0.15）
- **THEN** 每条曲线的 Y 偏移按 `layerIndex × layerSpacing × yRangeForLayer` 计算，其中 yRangeForLayer 由不动点公式确定

#### Scenario: y 轴顶部预留标签区域

- **WHEN** 图表渲染时设置了显式 y 轴边界
- **THEN** y 轴 max SHALL 等于 `yRangeForLayer × 1.15`，最高曲线顶点约占 y 轴 87% 高度，顶部 13% 留给标签显示

#### Scenario: 滑块在 re-render 后仍可拖动到中间值

- **WHEN** 用户导入数据并调整曲线颜色（触发 WaterfallChart re-render）后，拖动分层滑块
- **THEN** 滑块轨道 SHALL 保持非零高度，用户 SHALL 能将层间距拖动到 0 与最大值之间的任意中间值（如 0.15），且 `layerSpacing` 取到该中间值而非被钳位到端点
