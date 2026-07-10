# y-axis-zoom Specification

## ADDED Requirements

### Requirement: Y 轴可见范围框选

系统 SHALL 通过 ECharts 原生 dataZoom（竖向 slider + inside 滚轮，`yAxisIndex: 0`）提供全局 Y 轴可见范围框选。slider 的轨道 SHALL 代表 Y 轴全量范围（`computeYAxisRange` 计算的 `yAxisMin..yAxisMax`，含 15% 标签预留区），用户 SHALL 能在轨道内拖动两端手柄选择一段可见子区间、拖动中间平移、滚轮缩放、双击/按钮复位。手柄 SHALL 随选定的边界在全量轨道内移动（具备全量上下文，非贴绘图区边缘）。Y 轴 `min/max` SHALL 设为全量范围（由 dataZoom 选可见子区间，而非把 yAxis 边界设为框选范围）。

#### Scenario: 拖动手柄选子区间

- **WHEN** 用户拖动 Y 轴 slider 的上/下端手柄至全量轨道内的某段
- **THEN** 图表 Y 可见范围收缩为该子区间，曲线被 `clip:true` 裁剪到该范围，手柄在全量轨道内移动到对应位置（非贴绘图区边缘）

#### Scenario: 拖动中间平移

- **WHEN** 用户在 Y 轴 slider 中间区域拖动
- **THEN** 可见子区间宽度不变、整体平移，手柄随之移动

#### Scenario: 滚轮缩放与双击复位

- **WHEN** 用户在图表区滚轮（Y inside dataZoom）或双击 slider 复位
- **THEN** Y 可见范围按滚轮缩放或复位为全量；复位后 `yZoomRange` 为 `null`

### Requirement: Y 轴框选范围状态同步与持久化

Y 轴框选范围 SHALL 以 `yZoomRange: [number, number] | null` 存于 `uiStore`（`null` = 全量）。`datazoom` 事件 SHALL 将 Y dataZoom 的 `startValue/endValue` 经规整（min/max 顺序、clamp 到 `[rawDataMin, rawDataMax]`、最小段 5% dataSpan）后回写 `yZoomRange`。图表渲染 SHALL 用 `yZoomRange` 经规整后设置 Y dataZoom 的 `startValue/endValue`。`yZoomRange` SHALL 随工作区 JSON 导出/导入（格式不变，旧存档缺失该字段时回落 `null`）。Y dataZoom SHALL 设 `minValueSpan = 0.05 × dataSpan` 以阻止过窄选择。

#### Scenario: 框选范围回写 store

- **WHEN** 用户拖动 Y slider 改变可见范围
- **THEN** `uiStore.yZoomRange` 被规整后的 `[startValue, endValue]` 更新

#### Scenario: 旧工作区导入兼容

- **WHEN** 导入不含 `yZoomRange` 字段的旧工作区 JSON
- **THEN** `yZoomRange` 为 `null`，Y 轴显示全量范围，无报错

#### Scenario: 数据变化后范围 clamp

- **WHEN** `xRange` 变化或曲线增删导致 `rawDataMin/Max` 重算，且当前 `yZoomRange` 越出新边界
- **THEN** 传给 dataZoom 的 `startValue/endValue` 被 clamp 到新 `[rawDataMin, rawDataMax]`，不丢用户框选（仅裁到合法区间）

### Requirement: Y 可见范围像素换算一致性

`convertYToPixel` SHALL 读 ECharts model 的 yAxis extent（dataZoom 调整后的可见子区间）作为像素↔数据换算依据。屏幕渲染、brace/点标签 overlay、PNG 导出 SHALL 共用同一可见 Y 范围来源，使三者在 Y 框选变化后一致跟随。每曲线缩放 overlay（`CurveScaleOverlay`）的可见 Y 范围 SHALL 同样来自该 model extent（经 `convertYToPixel` 或等价），不依赖独立的 `resolvedFrame`。

#### Scenario: 标签跟随 Y 框选

- **WHEN** 用户改变 Y 可见范围
- **THEN** brace 与点标签的像素位置随可见 Y 范围重算，仍贴最高曲线，与屏幕曲线对齐

#### Scenario: 每曲线缩放贴曲线

- **WHEN** 在 Y 框选状态下进入每曲线缩放模式并拖拽/滚轮某曲线
- **THEN** 缩放浮标与交互像素换算基于当前 Y 可见范围，与屏幕曲线对齐
