## ADDED Requirements

### Requirement: 幻灯片尺寸与图表明细

PPTX 导出 SHALL 使用 pptxgenjs 默认 `screen16x9` 幻灯片尺寸（10 × 5.625 英寸），SHALL NOT 假设 4:3 幻灯片尺寸。所有 shape 坐标 SHALL 在幻灯片边界内，不溢出画布。

#### Scenario: 导出内容不超出幻灯片底部

- **WHEN** 用户导出 PPTX 并在 PowerPoint 中打开
- **THEN** 所有曲线、坐标轴、标签、大括号均在幻灯片画布内，底部无溢出

#### Scenario: 幻灯片尺寸从 pptxgenjs 实例动态读取

- **WHEN** pptxgenjs 默认布局为 `screen16x9`（10 × 5.625 英寸）
- **THEN** `pixelToPpt` 换算使用的幻灯片尺寸与实际渲染一致

### Requirement: 图表纵横比保持

导出 PPTX 时 SHALL 使用统一的缩放因子（取 `min(PPT_SLIDE_W / chartWidth, PPT_SLIDE_H / chartHeight)`），X 与 Y 轴使用相同的 `in/px` 比例。图表在幻灯片中 SHALL 保持原始纵横比，不发生拉伸或压缩变形。

#### Scenario: 曲线在 PPTX 中比例与屏幕一致

- **WHEN** 用户导出含曲线的 PPTX 并与屏幕截图对比
- **THEN** 曲线形状、高度、宽度比例与屏幕渲染一致，无纵向拉伸或横向压缩

#### Scenario: 缩放因子为 X/Y 方向的最小值

- **WHEN** 图表像素尺寸为 1200 × 600，幻灯片为 10 × 5.625 英寸
- **THEN** X 缩放 = 10/1200 = 0.00833, Y 缩放 = 5.625/600 = 0.00938，统一缩放因子取 0.00833

### Requirement: 图表居中显示

PPTX 中的图表内容 SHALL 在幻灯片中居中显示。X 方向居中偏移 `offsetX = (slideW - chartW * scale) / 2`，Y 方向居中偏移 `offsetY = (slideH - chartH * scale) / 2`。所有 shape 坐标 SHALL 加上居中偏移量。

#### Scenario: 图表在幻灯片中居中不贴边

- **WHEN** 图表像素尺寸为 1200 × 600，幻灯片为 10 × 5.625 英寸
- **THEN** 图表区域在 PPTX 中居中显示，左右或上下留白对称