## MODIFIED Requirements

### Requirement: 右栏工具箱内容

系统 SHALL 在右侧工具箱区域显示以下控制组件：
- 自动对齐控制（AlignmentControls）：包含算法选择、ROI 范围、一键对齐按钮
- Y 轴分层控制（AutoLayerControl）：包含层间距可视化滑块
- 不再显示每条曲线的独立偏置控制（OffsetControls）

#### Scenario: 工具箱内容

- **WHEN** 页面加载完成，右侧工具箱展开
- **THEN** 显示"自动对齐"控制区域和"Y 轴分层"控制区域，不显示每条曲线的 X/Y 偏移输入框

## REMOVED Requirements

### Requirement: 偏置控制组件

**Reason**: 偏置控制被 Y 轴自动分层控制替代，X 轴偏移完全由自动对齐处理。手动为每条曲线输入具体偏移值的操作方式已不再需要。

**Migration**: 使用新的 Y 轴分层滑块控制层间距，X 轴偏移通过自动对齐功能完成。如有特殊需求，可通过撤销/重做或手动调整层间距来达到所需效果。