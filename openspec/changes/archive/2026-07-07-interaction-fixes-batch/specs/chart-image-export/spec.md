## ADDED Requirements

### Requirement: 导出图片按钮

工具栏 SHALL 提供"导出图片"按钮（原"截图"按钮更名）。点击后 SHALL 将当前渲染图层合成为一张 PNG 并触发下载。导出内容 SHALL 同时包含 ECharts 渲染的曲线图层与大括号 SVG 叠加层。

#### Scenario: 点击导出图片

- **WHEN** 用户点击工具栏"导出图片"按钮，且图表已渲染
- **THEN** 系统生成一张 PNG 文件并触发浏览器下载，文件名含 `chromatogram` 与时间信息

#### Scenario: 导出图含大括号

- **WHEN** 图表上存在已创建的大括号，用户点击"导出图片"
- **THEN** 导出的 PNG 中包含大括号 path 与标签文字，位置与画面一致

#### Scenario: 图表未渲染时禁用

- **WHEN** 图表尚未渲染（无 `chartInstance`）
- **THEN** 点击"导出图片"提示"图表尚未渲染"，不触发下载

### Requirement: 合成导出实现

导出 SHALL 通过以下合成流程实现，且不引入新的第三方依赖：
1. 调用 `chartInstance.getDataURL({ type:'png', pixelRatio:2, backgroundColor:'#fff' })` 获取 ECharts PNG；
2. 将该 PNG 绘制到目标 canvas（尺寸 = 图表宽高 × `pixelRatio`）；
3. 构造一份仅含大括号 path 与 text 的干净 SVG（宽高与图表一致并按 `pixelRatio` 缩放，去除 `foreignObject` 与编辑弹窗）；
4. 用 `XMLSerializer` 序列化该 SVG 为 `data:image/svg+xml` 数据 URL，加载为 `Image` 后 `drawImage` 到同一 canvas；
5. 调用 `canvas.toDataURL('image/png')` 生成最终图片并下载。

#### Scenario: 大括号坐标与画面一致

- **WHEN** 导出图片时序列化大括号 SVG
- **THEN** 大括号 path 的 X 像素坐标通过 `convertXToPixel`（× `pixelRatio`）计算，Y 坐标取顶部渲染位置（× `pixelRatio`），与画面位置一致

#### Scenario: 标签编辑弹窗不进入导出

- **WHEN** 导出时大括号正处于标签编辑状态
- **THEN** 导出的 PNG 不包含标签编辑弹窗（`foreignObject` 被排除），仅包含已确认的大括号与标签
