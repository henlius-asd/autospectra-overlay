# export-pptx Specification

## Purpose
TBD - created by archiving change pptx-editable-export. Update Purpose after archive.
## Requirements
### Requirement: PPTX 独立 shape 重建

导出 PPTX 时 SHALL 将图表重建为多个独立 shape，每个元素在 PPT 中可被单独选中、移动、改色、改文字、删除：每条可见曲线 SHALL 成为一个独立的折线（freeform/line）shape；X/Y 坐标轴 SHALL 成为主线 shape；刻度与轴名称 SHALL 成为独立文本框；点标签 SHALL 成为由"文本框 + 竖线 + 圆点"组成的一组 shape；区间标签（大括号）SHALL 成为由"曲线弧形/自选图形 + 文本框"组成的一组 shape。SHALL NOT 导出为单张栅格图片。

#### Scenario: 在 PPT 中独立选中编辑单条曲线

- **WHEN** 用户导出 PPTX 后在 PowerPoint 中打开并点击某条曲线
- **THEN** 仅该曲线被选中，用户可改色、移动、删除而不影响其他曲线或标注

#### Scenario: 在 PPT 中编辑标签文字

- **WHEN** 用户在 PPT 中双击一个点标签的文本框
- **THEN** 可直接修改标签文字，竖线与圆点不受影响

#### Scenario: 曲线颜色与屏幕一致

- **WHEN** 用户为某曲线设置了自定义颜色后导出 PPTX
- **THEN** PPT 中该曲线折线 shape 的颜色与屏幕一致

### Requirement: PPTX 视图与屏幕一致

PPTX 导出 SHALL 保留用户当前的 X 轴与 Y 轴 dataZoom 缩放/平移视图与 Y 框选范围，shape 的像素位置（按 PPT 坐标系缩放换算）SHALL 与屏幕可见范围一致。导出 SHALL NOT 修改 `uiStore.xRange` 或 `uiStore.yZoomRange`。

#### Scenario: 导出反映当前缩放视图

- **WHEN** 用户在缩放/框选视图下导出 PPTX
- **THEN** PPT 中曲线与标注的可见范围、裁剪位置与屏幕一致

### Requirement: 标注样式与屏幕一致

PPTX 中的点标签与区间标签 SHALL 读取与屏幕同一 `labelStyle`（字号、字体、字重、颜色、背景色）。每条曲线折线 shape 与图例 SHALL 读取级联解析后的线条样式（`resolveLineStyle(curve.lineStyle, globalLineStyle)`）：粗细、线型、颜色 SHALL 与屏幕一致。线型 SHALL 通过 `mapLineTypeToPptxDash` 映射为 PPTX dashType（`solid`→省略、`dashed`→`dash`、`dotted`→`dot`）。**`resolveLineStyle` 和 `resolveLabelStyle` 的 null 回落行为 SHALL 在导出中生效——override 中的显式 null 字段回落默认值，不会导致导出 crash。**

#### Scenario: 标签字号跟随样式设置

- **WHEN** 用户将默认标签字号设为 14 后导出 PPTX
- **THEN** PPT 中标签文本框字号为 14

#### Scenario: 曲线粗细与屏幕一致

- **WHEN** 用户将某曲线粗细覆盖为 2.5 后导出 PPTX
- **THEN** PPT 中该曲线折线 shape 的线宽与屏幕一致（2.5 对应的 PPT 宽度）

#### Scenario: 曲线线型与屏幕一致

- **WHEN** 用户将某曲线线型设为 `dashed` 后导出 PPTX
- **THEN** PPT 中该曲线折线 shape 使用虚线 dashType，与屏幕渲染一致

#### Scenario: 全局默认颜色在 PPTX 中生效

- **WHEN** 用户将全局默认颜色设为红色、某曲线未覆盖颜色，导出 PPTX
- **THEN** PPT 中该曲线折线 shape 与图例色块为红色，与屏幕一致

#### Scenario: null 覆盖颜色回落全局默认后导出成功

- **WHEN** 某曲线 `lineStyle.color` 为 `null`，全局默认颜色为 `#000000`，用户导出 PPTX
- **THEN** PPT 中该曲线折线 shape 颜色为 `#000000`，导出正常完成不崩溃

### Requirement: 坐标轴跟随分轴显示开关

PPTX 导出 SHALL 跟随 X/Y 坐标轴各自的显示开关（见 `split-axis-toggle-and-curve-gap` 的分轴开关）：仅导出当前开启的轴及其刻度/名称；关闭的轴不生成对应 shape。

#### Scenario: 仅显示 X 轴时导出

- **WHEN** 用户关闭 Y 轴仅显示 X 轴后导出 PPTX
- **THEN** PPT 中仅有 X 轴及其刻度 shape，无 Y 轴 shape

### Requirement: 曲线折线保留全部数据点

每条可见曲线导出为折线 shape 时 SHALL 包含该曲线在 `[xRange.min, xRange.max]` 范围内的全部数据点,不对数据点进行降采样或压缩。折线在 PPTX 中放大后 SHALL 无锯齿。

#### Scenario: 高密度曲线在 PPTX 中放大后无锯齿

- **WHEN** 含 3000+ 数据点的色谱曲线导出到 PPTX 并在 PowerPoint 中放大至 400%
- **THEN** 曲线折线保持平滑,无可见的折线拐角或锯齿

#### Scenario: 曲线数据点数量与原始数据一致

- **WHEN** 一条曲线在 xRange 范围内有 N 个数据点
- **THEN** 导出 PPTX 后该曲线的折线 shape 包含 N 个顶点(而非 ≤200 的降采样结果)

### Requirement: 曲线 Y 轴范围裁剪

导出折线时 SHALL 仅保留 Y 值在 `[yMin, yMax]` 范围内的数据点。超出 Y 轴范围的曲线段 SHALL 不绘制,避免曲线溢出图表区域。

#### Scenario: 缩放后曲线超出 Y 轴顶部被裁剪

- **WHEN** 用户通过 Y 轴缩放使曲线部分数据点超出 yMax 后导出
- **THEN** PPTX 中超出 yMax 的曲线段不出现,曲线在 yMax 处被自然截断

#### Scenario: 曲线完全在 Y 轴范围内不受影响

- **WHEN** 曲线全部数据点 Y 值均在 `[yMin, yMax]` 范围内
- **THEN** 导出折线包含全部数据点,无裁剪

### Requirement: 大括号 I-beam 直线样式

区间标签(大括号)的 shape SHALL 使用 I-beam 样式:水平直线 + 左右两侧向下的短竖线(垂直 tick)。SHALL NOT 使用弧线或贝塞尔曲线。样式 SHALL 与屏幕 overlay 渲染(`bracePath.ts`)一致。

#### Scenario: 大括号在 PPTX 中为 I-beam 样式

- **WHEN** 用户导出包含区间标签的 PPTX 并在 PowerPoint 中查看
- **THEN** 大括号为水平直线 + 左右竖线,无弧线或曲线

#### Scenario: 大括号样式与屏幕 overlay 一致

- **WHEN** 屏幕 overlay 上大括号为 I-beam 样式(水平线+竖线)
- **THEN** PPTX 导出的大括号 shape 使用相同的 I-beam 样式

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

### Requirement: 文本框禁止换行

PPTX 中所有 `addText` 文本框 SHALL 设置 `wrap: false`,生成 `wrap="none"`。文字 SHALL 保持单行,不换行、不竖向堆叠。文字宽度超出文本框时 SHALL 横向溢出(可见,不裁剪)。

#### Scenario: 中文标签保持单行横向排列

- **WHEN** 用户导出包含中文标签(大括号/点标签)的 PPTX 并在 PowerPoint 中查看
- **THEN** 标签文字横向排列,中文字符不竖向堆叠,不换行

#### Scenario: 英文长标签不换行

- **WHEN** 图例文字为 20 个字符的英文名
- **THEN** 文字保持单行,不换行

### Requirement: 导出对 null 样式颜色具有鲁棒性

PPTX 导出 SHALL 在 `resolveLineStyle` 或 `resolveLabelStyle` 返回的 `resolved.color` 为 `null` 时不会崩溃。当 override 中 `color` 字段为 `null` 时，resolver SHALL 回落全局默认颜色，使导出正常完成而非静默 toast 失败。

#### Scenario: 曲线覆盖颜色为 null 时导出成功

- **WHEN** 某条曲线 `lineStyle.color` 为显式 `null`（如经 JSON 工作区导入）且用户点击导出 PPTX
- **THEN** 导出正常完成，生成 `chromatogram.pptx` 文件，该曲线使用全局默认颜色，不出现「导出 PPTX 失败」toast

#### Scenario: 标注覆盖颜色为 null 时导出成功

- **WHEN** 某个 brace 或点标签的 `labelStyle.color` 为显式 `null` 且用户导出 PPTX
- **THEN** 导出正常完成，标注使用全局默认颜色，不崩溃

