## MODIFIED Requirements

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