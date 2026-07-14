# three-column-layout Specification (Delta)

## MODIFIED Requirements

### Requirement: 各栏占位内容

各栏 SHALL 包含明确的占位内容，标识后续模块的插入位置。中栏 SHALL 直接渲染 Toolbar 和 WaterfallChart 组件，不显示"渲染区"占位文本。

#### Scenario: 占位内容可见

- **WHEN** 页面加载完成
- **THEN** 左栏显示"数据区"占位文本，中栏直接渲染 Toolbar 和 WaterfallChart，右栏显示"工具箱"占位文本

### Requirement: 右栏工具箱内容

系统 SHALL 在右侧工具箱区域显示以下控制组件（按从上到下顺序）：
- 元数据展示面板（MetadataPanel）：显示选中曲线的文件元数据，默认显示占位提示
- 标签样式控制（LabelStyleControls）：控制区间标签的字体、颜色等样式
- 自动对齐控制（AlignmentControls）：包含算法选择、ROI 范围、一键对齐按钮

#### Scenario: 工具箱内容

- **WHEN** 页面加载完成，右侧工具箱展开
- **THEN** 从上到下依次显示"元数据"面板、"标签样式"控制区域和"自动对齐"控制区域

### Requirement: 工具栏大括号按钮

顶部工具栏 SHALL 包含"区间标签"按钮，用于触发区间标签放置模式。

#### Scenario: 工具栏显示区间标签按钮

- **WHEN** 页面加载完成
- **THEN** 工具栏中显示"区间标签"按钮（位于导出按钮旁或之后）

## REMOVED Requirements

### Requirement: 最小分辨率适配 (1366px 断点)

**Reason:** 实际项目中没有 1366px 最小宽度响应式断点；三栏布局不定义基于 1366px 的响应式行为。

**Migration:** 删除对 1366px 断点的依赖。三栏布局在所有窗口宽度下表现一致，不定义特定断点处的折叠行为。

### Requirement: AutoLayerControl 组件

**Reason:** 实际项目中右栏没有名为 `AutoLayerControl` 的组件；Y 轴分层控制是图表上的浮动覆盖层（参见 auto-layering spec），不在右栏工具箱中。

**Migration:** 删除对 `AutoLayerControl` 组件的引用。Y 轴分层控制应通过图表鼠标交互操作，而非右栏面板控件。