## MODIFIED Requirements

### Requirement: 工具栏大括号按钮

顶部工具栏 SHALL 包含区间标签放置模式图标按钮，使用内联 SVG 图标配合 tooltip 文字。按钮激活时 SHALL 显示填充图标 + `bg-blue-500 text-white` 样式，未激活时 SHALL 显示描边图标 + `text-gray-600 hover:bg-gray-200`。图标 SHALL 使用 24×24 viewBox 的 SVG。

#### Scenario: 工具栏显示区间标签按钮

- **WHEN** 页面加载完成
- **THEN** 工具栏中显示区间标签图标按钮（位于交互模式组中）

#### Scenario: 按钮激活视觉区分

- **WHEN** 用户点击区间标签按钮进入放置模式
- **THEN** 按钮图标从描边切换为填充，背景变为蓝色