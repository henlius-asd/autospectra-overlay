## MODIFIED Requirements

### Requirement: 大括号插入工具按钮

系统 SHALL 在工具栏提供区间标签放置模式图标按钮，使用内联 SVG 图标。点击后进入放置模式，用户可在图表上拖拽选择区间放置区间标签。按钮激活时显示填充图标 + `bg-blue-500 text-white`，未激活时显示描边图标 + `text-gray-600 hover:bg-gray-200`。拖拽结束后（pointerUp 事件，位移阈值 >= 5px）系统 SHALL 退出放置模式并打开编辑浮层。

#### Scenario: 点击工具按钮进入放置模式

- **WHEN** 用户点击工具栏中的区间标签图标按钮
- **THEN** 按钮高亮显示为激活状态（填充图标 + 蓝色背景），图表光标变为 crosshair

#### Scenario: 工具按钮仅在图表有数据时可用

- **WHEN** 图表中没有曲线数据
- **THEN** 区间标签图标按钮显示为禁用状态（opacity + cursor-not-allowed）