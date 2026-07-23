# scale-slider Specification

## Purpose
Y 轴缩放滑条，在选中曲线左侧显示垂直滑条，拖拽滑块实时缩放曲线。替代因 ECharts click 事件限制而不可用的峰值拖拽手柄。
## Requirements
### Requirement: 曲线选中机制

系统 SHALL 使用单一 `selectedCurveId` 作为曲线选中态，同时驱动元数据面板、列表高亮、缩放目标。删除 `activeScaledCurveId`。用户 SHALL 可通过曲线列表点击或图表渲染区点击选中曲线。点击已选中曲线 SHALL 取消选中。

#### Scenario: 列表点击选中

- **WHEN** 用户点击曲线列表中的某条曲线行（非 checkbox、非按钮）
- **THEN** `selectedCurveId` 更新为该曲线 ID，元数据面板切换、列表高亮、缩放目标切换

#### Scenario: 图表渲染区点击选中

- **WHEN** 用户在图表渲染区点击某条曲线
- **THEN** `selectedCurveId` 更新为该曲线 ID，元数据面板切换、列表高亮、缩放目标切换

#### Scenario: 切换选中曲线

- **WHEN** 用户已选中曲线 A，点击曲线 B（列表或图表）
- **THEN** 曲线 A 取消选中，曲线 B 被选中

#### Scenario: 取消选中

- **WHEN** 用户再次点击已选中的曲线
- **THEN** `selectedCurveId` 设为 null，元数据面板恢复占位提示

### Requirement: 缩放倍率显示

系统 SHALL 在图表渲染区域以 `pointerEvents: 'none'` 纯展示元素显示数值 badge。单曲线缩放激活时 SHALL 显示选中曲线的复合有效倍率 `×(global × curveScale)` 和偏移量 `Δ{scaleOffset}`。全局缩放激活时 SHALL 显示全局倍率 `×{globalScale}`。不存在垂直滑条 UI；倍率通过数值 badge 展示，缩放操作通过鼠标滚轮、Shift+拖拽和双击复位完成。

#### Scenario: 单曲线缩放显示复合倍率

- **WHEN** 单曲线缩放激活，曲线 A 被选中，curveScale=2、globalScale=1.5
- **THEN** badge 显示 `×3.0`

#### Scenario: 全局缩放显示全局倍率

- **WHEN** 全局缩放激活，globalScale=2.5
- **THEN** badge 显示 `×2.5`

### Requirement: 缩放倍率 Badge 显示

选中曲线后，系统 SHALL 在图表渲染区域左上角显示缩放倍率数值 badge。badge 位置相对于 ECharts grid 左上角固定。badge 为纯展示元素，不包含交互控件（无轨道、无滑块、无拖拽手柄）。

#### Scenario: Badge 位置

- **WHEN** 曲线被选中且缩放模式激活
- **THEN** badge 显示在图表区域左上角（left: 8px, top: gridTop）

#### Scenario: Badge 显示倍率

- **WHEN** badge 可见
- **THEN** badge 显示当前缩放倍率数值（如 ×1.0），如有偏移量则显示 `Δ{offset}`

### Requirement: 滚轮缩放

系统 SHALL 通过原生 `addEventListener('wheel', handler, { passive: false })` 监听滚轮事件，SHALL 调用 `preventDefault` 阻止 ECharts 的 dataZoom 抢占。全局缩放激活时滚轮 SHALL 缩放 `globalScale`。单曲线缩放激活且有选中曲线时滚轮 SHALL 缩放该曲线的 `curveScales`。两者同时激活时 SHALL 优先缩放选中曲线。向上滚轮 SHALL 放大，向下滚轮 SHALL 缩小。缩放倍率 SHALL 钳制在 [0.1, 10.0] 范围。

#### Scenario: 单曲线缩放滚轮放大

- **WHEN** 单曲线缩放激活，曲线 A 被选中，向上滚轮
- **THEN** 曲线 A 的 `curveScales` 增大，曲线实时放大

#### Scenario: 全局缩放滚轮

- **WHEN** 全局缩放激活，滚轮
- **THEN** `globalScale` 改变，所有曲线同比例缩放

#### Scenario: 两者同时激活优先单曲线

- **WHEN** 全局缩放和单曲线缩放都激活，曲线 A 被选中，滚轮
- **THEN** 曲线 A 的 `curveScales` 改变（而非 globalScale）

#### Scenario: 单曲线模式无选中曲线

- **WHEN** 单曲线缩放激活但无选中曲线，滚轮
- **THEN** 无缩放操作（或回退到全局缩放，取决于全局缩放是否激活）

#### Scenario: 倍率范围限制

- **WHEN** 滚轮使倍率超出 [0.1, 10.0]
- **THEN** 倍率被钳制在边界值

### Requirement: Shift+拖拽单曲线平移

单曲线缩放激活且有选中曲线时，用户按住 Shift 键拖拽 SHALL 平移选中曲线（`curveScaleOffsets`）。全局缩放模式下 Shift+拖拽 SHALL 无效果。SHALL 通过原生 `addEventListener('mousedown', ...)` 实现。

#### Scenario: Shift+拖拽平移曲线

- **WHEN** 单曲线缩放激活，曲线 A 被选中，按住 Shift 向下拖拽
- **THEN** 曲线 A 的 `curveScaleOffsets` 减小，曲线向下平移

#### Scenario: 全局模式下 Shift+拖拽无效

- **WHEN** 全局缩放激活（单曲线未激活或无选中曲线），按住 Shift 拖拽
- **THEN** 无曲线平移操作

### Requirement: 双击复位

双击图表区域 SHALL 复位当前激活模式的缩放参数。单曲线缩放激活时 SHALL 复位选中曲线的手动层（`curveScales=1`，`curveScaleOffsets=0`）。全局缩放激活时 SHALL 复位 `globalScale=1`。两者同时激活时 SHALL 复位选中曲线的手动层。

#### Scenario: 单曲线双击复位

- **WHEN** 单曲线缩放激活，曲线 A 被选中，双击图表
- **THEN** 曲线 A `curveScales=1`，`curveScaleOffsets=0`

#### Scenario: 全局双击复位

- **WHEN** 全局缩放激活（单曲线未激活或无选中曲线），双击图表
- **THEN** `globalScale=1`

### Requirement: 两个独立缩放按钮

工具栏 SHALL 提供两个独立按钮：「全局缩放」和「单曲线缩放」，各自独立开关，不互斥。按 Esc 键 SHALL 取消选中曲线但不退出缩放模式。

#### Scenario: 独立开关

- **WHEN** 用户点击「全局缩放」按钮
- **THEN** `globalScaleMode` 切换 on/off，不影响 `perCurveScaleMode`

#### Scenario: 两者同时激活

- **WHEN** 用户先激活「全局缩放」，再激活「单曲线缩放」
- **THEN** 两者都为 on，滚轮优先作用于选中曲线

#### Scenario: Esc 取消选中

- **WHEN** 用户在任一缩放模式下按下 Esc 键
- **THEN** `selectedCurveId` 设为 null，但缩放模式保持激活

### Requirement: 面板内全局缩放值显示

系统 SHALL 在工具箱「自动叠图」面板的「缩放」分区标题旁显示当前 `globalScale` 值，格式为 `缩放 ×{globalScale.toFixed(1)}`。显示 SHALL 通过 `useCurveStore` 订阅实时更新。当 `globalScale` 为 1 时 SHALL 显示 `×1.0`，不隐藏。

#### Scenario: 默认值显示

- **WHEN** 页面加载，`globalScale` 为默认值 1
- **THEN** 「缩放」标题旁显示 `×1.0`

#### Scenario: 全局缩放后实时更新

- **WHEN** 用户在全局缩放模式下滚轮将 `globalScale` 调至 2.5
- **THEN** 「缩放」标题旁显示 `×2.5`

#### Scenario: 双击复位后更新

- **WHEN** 用户在全局缩放模式下双击复位，`globalScale` 回到 1
- **THEN** 「缩放」标题旁显示 `×1.0`

