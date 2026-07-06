## MODIFIED Requirements

### Requirement: 右栏工具箱内容

系统 SHALL 在右侧工具箱区域显示以下控制组件（按从上到下顺序）：
- 元数据展示面板（MetadataPanel）：显示选中曲线的文件元数据，默认显示占位提示
- 自动对齐控制（AlignmentControls）：包含算法选择、ROI 范围、一键对齐按钮
- Y 轴分层控制（AutoLayerControl）：包含层间距可视化滑块

#### Scenario: 工具箱内容

- **WHEN** 页面加载完成，右侧工具箱展开
- **THEN** 从上到下依次显示"元数据"面板、"自动对齐"控制区域和"Y 轴分层"控制区域

### Requirement: 各栏占位内容

各栏 SHALL 包含明确的占位内容，标识后续模块的插入位置。

#### Scenario: 占位内容可见

- **WHEN** 页面加载完成
- **THEN** 左栏显示"数据区"标题（含搜索框和文件上传区域），中栏显示 ECharts 图表或"尚未加载曲线数据"占位，右栏显示"工具箱"标题（含元数据面板、对齐控制、分层控制）

## ADDED Requirements

### Requirement: 工具栏大括号按钮

顶部工具栏 SHALL 包含"插入大括号"按钮，用于触发大括号放置模式。

#### Scenario: 工具栏显示大括号按钮

- **WHEN** 页面加载完成
- **THEN** 工具栏中显示"插入大括号"按钮（位于导出按钮旁或之后）