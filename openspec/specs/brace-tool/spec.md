# brace-tool Specification

## Purpose
区间标签标注工具（原"大括号"工具）。通过工具栏按钮触发放置模式，在图表上拖拽选择区间创建区间标签，支持标签编辑和 dataZoom 联动。放置模式下禁用画布平移，按住空格可临时平移。
## Requirements
### Requirement: 大括号插入工具按钮

系统 SHALL 在工具栏提供"插入区间标签"按钮。该按钮 SHALL 位于「标注插入」分组中，与「点标签」按钮紧邻。点击后 `interactionMode` 设置为 `'brace'`。进入放置模式后，用户可在图表上拖拽选择区间放置区间标签。拖拽结束后（pointerUp 事件，位移阈值 >= 5px）系统 SHALL 退出放置模式并打开编辑浮层，用户输入标签文字后点击"确认"按钮 SHALL 成功保存标签。放置模式在 pointerUp 时退出，早于浮层确认。放置模式下，ECharts 原生画布平移 SHALL 被禁用。

#### Scenario: 点击工具按钮进入放置模式

- **WHEN** 用户点击工具栏中的"插入区间标签"按钮
- **THEN** `interactionMode` 变为 `'brace'`，按钮高亮显示为激活状态，图表光标变为 crosshair，画布平移被禁用

#### Scenario: 拖拽选择区间并输入标签

- **WHEN** 在 `'brace'` 模式下，用户拖拽选择区间后释放鼠标（位移 >= 5px）
- **THEN** 放置模式退出，系统弹出标签编辑浮层，浮层包含输入框、"确认"和"取消"按钮，所有按钮均可正常点击

#### Scenario: 确认标签后保存

- **WHEN** 用户在浮层中输入标签文字后点击"确认"按钮（或按 Enter 键）
- **THEN** 区间标签被保存并存入 store，浮层关闭

#### Scenario: Esc 取消放置回到 select

- **WHEN** 在 `'brace'` 模式下，用户按 Escape 键
- **THEN** `interactionMode` 变为 `'select'`，已记录的端点被清除

#### Scenario: 再次点击按钮回到 select

- **WHEN** 当前 `interactionMode` 为 `'brace'`，用户再次点击"插入区间标签"按钮
- **THEN** `interactionMode` 变为 `'select'`，放置模式退出

#### Scenario: 工具按钮仅在图表有数据时可用

- **WHEN** 图表中没有曲线数据
- **THEN** "插入区间标签"按钮显示为禁用状态

#### Scenario: 放置模式下画布不平移

- **WHEN** 在 `'brace'` 模式下拖拽图表空白区域
- **THEN** 画布不平移，仅开始区间选择操作

### Requirement: 按住空格临时平移

在 `'brace'` 模式下，按住空格键 SHALL 临时恢复 ECharts 原生画布平移，光标变为 `grab`。松开空格键后 SHALL 恢复 `'brace'` 模式的行为和光标。

#### Scenario: 按住空格临时平移

- **WHEN** 在 `'brace'` 模式下按住空格键并拖拽图表
- **THEN** 画布随拖拽平移，工具栏仍然显示区间标签按钮为激活状态；松开空格后恢复区间选择行为

### Requirement: 大括号随 dataZoom 联动

区间标签的纵向位置 SHALL 使用绝对数据 Y 坐标（`BraceAnnotation.y`），SHALL NOT 依赖任何曲线的像素位置或 `peak`（`rawDataMin + yRangeForLayer`）聚合值，与点标签（见 `point-label-absolute-y`）共用同一参考系。渲染时水平主线 Y SHALL 由 `convertYToPixel(brace.y)` 给出。y 轴 dataZoom 缩放/平移时 SHALL 随轴变换同步更新像素位置（数据 Y 不变，像素 Y 随轴缩放），与点标签行为一致。区间标签 SHALL NOT 自动贴近最高曲线峰值；其纵向位置由用户放置/拖拽决定（绝对数据 Y）。过渡期对携带 legacy `yOffset` 的旧 brace，渲染 SHALL 回退到旧像素公式 `braceY + yOffset`（`braceY` 仍按 `peak` 与 `gridTop + 2` 下限计算），直至首渲染迁移将其转换为 `y`。

#### Scenario: y 轴缩放时区间标签随轴同步

- **WHEN** 用户通过 y 轴 dataZoom 缩放
- **THEN** 区间标签的像素 Y 随 y 轴缩放同步更新（数据 Y 不变，像素 Y 随轴缩放），与点标签一致

#### Scenario: 上下平移图层时区间标签跟随曲线

- **WHEN** 用户上下平移某曲线图层（改 `offset.yOffset`，Y 轴随之变化）
- **THEN** 区间标签与点标签一样随轴变换跟随曲线，相对曲线不发生漂移（与点标签行为一致）

#### Scenario: 标签不自动贴近最高曲线

- **WHEN** 图表中有多条曲线且 layerSpacing > 0
- **THEN** 区间标签 SHALL NOT 自动贴向最高曲线峰值，而是保持用户放置的绝对数据 Y 位置

### Requirement: 大括号整段拖拽平移

已创建的区间标签 SHALL 支持整段二维拖拽平移：横向拖拽时保持区间宽度不变，同步移动 `startX` 与 `endX`（绝对数据 X，经 `convertPixelToX` 转换）；纵向拖拽时 SHALL 通过 `y = convertPixelToY(convertYToPixel(origY) + dy)` 更新绝对数据 Y（与点标签拖拽机制一致），SHALL NOT 使用像素级 `yOffset`。拖拽与点击编辑 SHALL 通过位移阈值（累计位移在 X 和 Y 方向均 < 5px 视为点击）区分。新创建的区间标签 SHALL 落在用户按下拖拽的像素 Y 位置对应的绝对数据 Y（`y = convertPixelToY(placementY)`），而非默认 `braceY`。拖拽预览虚影 SHALL 同步使用 `placementY` 绘制。

#### Scenario: 拖拽平移整段区间

- **WHEN** 用户按住一个已有区间标签并横向拖动超过 5px
- **THEN** 该区间标签的 startX 与 endX 同步平移（宽度不变），释放后保留新位置，不弹出编辑浮层

#### Scenario: 纵向拖拽区间标签

- **WHEN** 用户按住一个已有区间标签并纵向拖动超过 5px
- **THEN** 该区间标签的 `y` 数据坐标随鼠标像素 Y 实时更新（经 `convertPixelToY(convertYToPixel(origY) + dy)`），释放后保留新位置

#### Scenario: 小幅移动视为点击

- **WHEN** 用户按住一个已有区间标签但累计位移在 X 和 Y 方向均不足 5px 即释放
- **THEN** 视为点击，SHALL NOT 弹出编辑浮层（编辑改为双击触发）

#### Scenario: 放置时落在按下 Y 位置

- **WHEN** 用户在放置模式下在图表某 Y 位置按下并拖拽选择区间
- **THEN** 创建的区间标签 `y` 设为该 Y 位置对应的绝对数据 Y（`convertPixelToY(placementY)`），拖拽预览虚影同步显示在该 Y 位置

### Requirement: 区间标签文字渲染

区间标签（大括号）的文字字号、字体、字重、文字颜色 SHALL 取自 `uiStore.labelStyle` 默认值，回退到内置默认（字号 10，与点标签统一）。SHALL NOT 使用硬编码字号。区间标签 SHALL 复用与点标签相同的"标签样式编辑"能力（工具栏面板），无需独立入口。系统 SHALL NOT 提供单独编辑单个区间标签样式覆盖的 UI。

#### Scenario: 调整默认字号后大括号标签更新

- **WHEN** 用户在"标签样式"面板将默认字号从 11 改为 16
- **THEN** 所有区间标签立即以 16px 重渲染

#### Scenario: 导出保留大括号标签样式

- **WHEN** 用户调整默认字号后点击"导出图片"
- **THEN** 导出图片中的区间标签按调整后的样式渲染

### Requirement: 区间标签双击编辑

已有区间标签 SHALL 通过双击触发编辑浮层。单击 SHALL NOT 触发编辑。编辑浮层内的按钮（确认、取消、删除）SHALL 保留单击行为。

#### Scenario: 双击标签弹出编辑

- **WHEN** 用户双击已有区间标签的括号或文字
- **THEN** 弹出标签编辑浮层，可修改文字或删除

#### Scenario: 单击不弹出编辑

- **WHEN** 用户单击已有区间标签
- **THEN** SHALL NOT 弹出编辑浮层，标签保持选中状态

