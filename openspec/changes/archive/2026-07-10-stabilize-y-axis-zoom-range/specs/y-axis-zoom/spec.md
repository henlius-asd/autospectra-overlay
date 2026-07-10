# y-axis-zoom Specification

## MODIFIED Requirements

### Requirement: Y 轴可见范围框选

系统 SHALL 通过 ECharts 原生 dataZoom（竖向 slider + inside 滚轮，`yAxisIndex: 0`）提供全局 Y 轴可见范围框选。slider 的轨道 SHALL 代表 Y 轴全量范围（基于**所有可见曲线全部数据点**计算的 `yAxisMin..yAxisMax`，含 15% 标签预留区，**不按 `xRange` 过滤**），用户 SHALL 能在轨道内拖动两端手柄选择一段可见子区间、拖动中间平移、滚轮缩放、双击/按钮复位。手柄 SHALL 随选定的边界在全量轨道内移动（具备全量上下文，非贴绘图区边缘）。Y 轴 `min/max` SHALL 设为基于全量数据的稳定范围，**不随 X 轴缩放、曲线增删或其他非 Y 操作而变化**。

#### Scenario: 拖动手柄选子区间

- **WHEN** 用户拖动 Y 轴 slider 的上/下端手柄至全量轨道内的某段
- **THEN** 图表 Y 可见范围收缩为该子区间，曲线被 `clip:true` 裁剪到该范围，手柄在全量轨道内移动到对应位置（非贴绘图区边缘）

#### Scenario: 拖动中间平移

- **WHEN** 用户在 Y 轴 slider 中间区域拖动
- **THEN** 可见子区间宽度不变、整体平移，手柄随之移动

#### Scenario: 滚轮缩放与双击复位

- **WHEN** 用户在图表区滚轮（Y inside dataZoom）或双击 slider 复位
- **THEN** Y 可见范围按滚轮缩放或复位为全量；复位后 `yZoomRange` 为 `null`

#### Scenario: X 轴缩放不改变 Y 轴全量范围

- **WHEN** 用户拖动 X 轴 slider 改变 X 可见范围
- **THEN** Y 轴全量范围（`yAxis.min/max`）保持不变，dataZoom 轨道位置不变，Y 可见子区间不漂移

### Requirement: Y 轴框选范围状态同步与持久化

Y 轴框选范围 SHALL 以 `yZoomRange: [number, number] | null` 存于 `uiStore`（`null` = 全量）。`datazoom` 事件 SHALL 将 Y dataZoom 的 `startValue/endValue` 经 `normalizeYZoomRange` 规整（min/max 顺序、clamp 到 `[rawDataMin, rawDataMax]`、最小段 5% dataSpan）后回写 `yZoomRange`。图表渲染 SHALL 用 `yZoomRange` 存储值直接设置 Y dataZoom 的 `startValue/endValue`，**不在 option 构建时做二次 clamp**。`yZoomRange` SHALL 随工作区 JSON 导出/导入（格式不变，旧存档缺失该字段时回落 `null`）。Y dataZoom SHALL 设 `minValueSpan = 0.05 × dataSpan` 以阻止过窄选择。

#### Scenario: 框选范围回写 store

- **WHEN** 用户拖动 Y slider 改变可见范围
- **THEN** `uiStore.yZoomRange` 被 `normalizeYZoomRange` 规整后的 `[startValue, endValue]` 更新

#### Scenario: 旧工作区导入兼容

- **WHEN** 导入不含 `yZoomRange` 字段的旧工作区 JSON
- **THEN** `yZoomRange` 为 `null`，Y 轴显示全量范围，无报错

#### Scenario: X 缩放或其他状态变化不触发 Y range 更新

- **WHEN** X 轴缩放、showGrid 切换、bracePlacementMode 切换等非 Y 操作发生
- **THEN** `uiStore.yZoomRange` 保持不变，option 的 dataZoom `startValue/endValue` 直接使用 `yZoomRange` 存储值，不做二次 clamp

#### Scenario: Workspace 加载的越界 yZoomRange 被 ECharts 自行 clamp

- **WHEN** 导入的 workspace 中 `yZoomRange` 值越出当前数据边界
- **THEN** ECharts 内部 clamp 到 `[yAxisMin, yAxisMax]` 范围内显示，`uiStore.yZoomRange` 不变，下次用户操作 Y slider 时由 `onDataZoom` 更新

### Requirement: Y 可见范围像素换算一致性

`convertYToPixel` SHALL 基于 `yZoomRange` 存储值（非 null 时）或 `yAxisFullRange`（null 时）作为可见 Y 范围来源，进行像素↔数据换算。屏幕渲染、brace/点标签 overlay、PNG 导出 SHALL 共用同一可见 Y 范围来源，使三者在 Y 框选变化后一致跟随。每曲线缩放 overlay（`CurveScaleOverlay`）的可见 Y 范围 SHALL 同样来自该来源。

#### Scenario: 标签跟随 Y 框选

- **WHEN** 用户改变 Y 可见范围
- **THEN** brace 与点标签的像素位置随可见 Y 范围重算，仍贴最高曲线，与屏幕曲线对齐

#### Scenario: 每曲线缩放贴曲线

- **WHEN** 在 Y 框选状态下进入每曲线缩放模式并拖拽/滚轮某曲线
- **THEN** 缩放浮标与交互像素换算基于当前 Y 可见范围，与屏幕曲线对齐

#### Scenario: X 缩放时标签位置稳定

- **WHEN** 用户拖动 X 轴 slider 改变 X 可见范围（Y 轴范围不变）
- **THEN** brace 与点标签的 Y 像素位置不变化，仅 X 位置随 X 范围变化