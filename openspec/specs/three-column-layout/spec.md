# three-column-layout Specification

## Purpose
TBD - created by archiving change phase-1-project-scaffold. Update Purpose after archive.
## Requirements
### Requirement: 三栏布局渲染

系统 SHALL 渲染左、中、右三栏布局。左栏固定宽度 240px，右栏固定宽度 320px，中栏弹性填充剩余空间。布局使用 CSS Flexbox 实现。

#### Scenario: 默认三栏展示

- **WHEN** 页面首次加载
- **THEN** 左栏宽度 240px、中栏填充剩余宽度、右栏宽度 320px

### Requirement: 左右栏折叠与展开

左栏和右栏 SHALL 各有一个折叠/展开按钮。点击折叠按钮后，面板宽度收为 48px 窄条，仅显示折叠图标。点击展开按钮恢复原宽度。折叠/展开行为 SHALL 有 CSS transition 动画过渡，且过渡 SHALL 仅作用于 width 属性。左右栏 SHALL 设置 `flex-shrink: 0`，确保在 flex 布局中不被压缩到小于指定宽度。

#### Scenario: 折叠左栏

- **WHEN** 用户点击左栏折叠按钮
- **THEN** 左栏宽度过渡为 48px，面板内容隐藏，仅显示展开图标，中栏宽度自动扩展

#### Scenario: 展开左栏

- **WHEN** 左栏处于折叠状态，用户点击展开图标
- **THEN** 左栏宽度过渡恢复为 240px，面板内容重新显示，且最终宽度精确为 240px

#### Scenario: 折叠右栏

- **WHEN** 用户点击右栏折叠按钮
- **THEN** 右栏宽度过渡为 48px，面板内容隐藏，仅显示展开图标

#### Scenario: 展开右栏

- **WHEN** 右栏处于折叠状态，用户点击展开图标
- **THEN** 右栏宽度过渡恢复为 320px，面板内容重新显示，且最终宽度精确为 320px

#### Scenario: 左右栏同时折叠

- **WHEN** 用户先后折叠左栏和右栏
- **THEN** 左右栏各收为 48px 窄条，中栏占据全部剩余宽度

#### Scenario: 折叠后再展开宽度不变

- **WHEN** 用户反复折叠和展开左栏或右栏
- **THEN** 展开后面板宽度始终精确恢复为原始宽度（左栏 240px，右栏 320px），不出现变窄

### Requirement: 各栏占位内容

各栏 SHALL 包含明确的占位内容，标识后续模块的插入位置。中栏 SHALL 直接渲染 Toolbar 和 WaterfallChart 组件，不显示"渲染区"占位文本。

#### Scenario: 占位内容可见

- **WHEN** 页面加载完成
- **THEN** 左栏显示"数据区"占位文本，中栏直接渲染 Toolbar 和 WaterfallChart，右栏显示"工具箱"占位文本

### Requirement: 右栏工具箱内容

系统 SHALL 在右侧工具箱区域显示以下控制组件（按从上到下顺序）：
- 元数据展示面板（MetadataPanel）：显示选中曲线的文件元数据，默认显示占位提示
- 标签样式控制（LabelStyleControls）：控制区间标签的字体、颜色等样式
- 曲线样式控制（CurveStylePanel）：控制曲线线条的全局默认粗细/线型/颜色及单条覆盖
- 自动对齐控制（AlignmentControls）：包含算法选择、ROI 范围、一键对齐按钮

右栏折叠时 SHALL 提供「曲线样式」快捷图标入口，点击后展开右栏并滚动到「曲线样式」面板。

#### Scenario: 工具箱内容

- **WHEN** 页面加载完成，右侧工具箱展开
- **THEN** 从上到下依次显示「元数据」面板、「标签样式」控制区域、「曲线样式」控制区域和「自动对齐」控制区域

#### Scenario: 折叠态曲线样式快捷入口

- **WHEN** 右栏处于折叠态，用户点击折叠条上的「曲线样式」图标
- **THEN** 右栏展开并自动滚动到「曲线样式」面板

### Requirement: 工具栏大括号按钮

顶部工具栏 SHALL 包含"区间标签"按钮，用于触发区间标签放置模式。该按钮 SHALL 位于工具栏左侧「标注插入」分组中，与「点标签」按钮紧邻，组间用分隔符区分。

#### Scenario: 工具栏显示区间标签按钮

- **WHEN** 页面加载完成
- **THEN** 工具栏中显示"区间标签"按钮（位于「标注插入」分组内，在「一般选中」和「框选放大」按钮之后）

### Requirement: 工具栏布局

中栏顶部 SHALL 渲染 Toolbar 组件。Toolbar SHALL 分为左右两区：左侧为 7 个工具按钮（分 3 组，组间有分隔符），右侧为操作按钮（撤销、重做、导出 ▾、工作区 ▾、版本次号）。工具按钮 SHALL 按「视图操作 | 标注插入 | 曲线分布」顺序排列。

#### Scenario: 工具栏左工具右操作布局

- **WHEN** 页面加载完成
- **THEN** 左侧显示 7 个工具按钮（含分组分隔符），右侧显示撤销/重做/导出/工作区

#### Scenario: 工具栏与 WaterfallChart 渲染

- **WHEN** 页面加载完成
- **THEN** 中栏直接渲染 Toolbar 和 WaterfallChart 组件，Toolbar 在上方，WaterfallChart 在下方填充剩余空间

