# toolbar-tool-system Specification

## Purpose

统一的工具系统——7 个互斥工具按 3 组分组、一般选中默认工具、按住空格临时平移、工具栏左工具右操作布局。

## ADDED Requirements

### Requirement: InteractionMode 枚举

系统 SHALL 使用 `InteractionMode` 联合类型定义图表交互模式，替代当前的 6 个独立 boolean flag。`InteractionMode` SHALL 包含以下 7 个值：

```typescript
type InteractionMode =
  | 'select'       // 一般选中
  | 'brush'        // 框选放大
  | 'brace'        // 区间标签
  | 'pointLabel'   // 点标签
  | 'move'         // 手动移动
  | 'zoomGlobal'   // 全局缩放
  | 'zoomCurve';   // 单曲线缩放
```

#### Scenario: 7 个工具互斥

- **WHEN** 任何工具按钮被激活
- **THEN** 其他 6 个工具按钮立即变为非激活状态，同一时间只有一个工具 active

#### Scenario: 默认工具为 select

- **WHEN** 应用首次加载或新建工作区后
- **THEN** `interactionMode` 为 `'select'`，一般选中工具按钮处于激活状态

### Requirement: setInteractionMode action

uiStore SHALL 提供 `setInteractionMode(mode: InteractionMode)` action，用于切换当前交互模式。该 action SHALL 直接设置 `interactionMode` 字段，不再需要手动关闭其他 flag。

#### Scenario: 切换交互模式

- **WHEN** 调用 `setInteractionMode('brace')`
- **THEN** `interactionMode` 变为 `'brace'`，所有其他工具的激活状态自动清除

#### Scenario: 切换到当前模式不产生副作用

- **WHEN** 当前 `interactionMode` 为 `'select'`，调用 `setInteractionMode('select')`
- **THEN** 状态不变，无额外副作用

### Requirement: 一般选中工具（select）

`select` 模式 SHALL 支持以下行为：点击曲线选中该曲线（设置 `selectedCurveId`），拖拽画布空白区域平移画布（ECharts dataZoom 原生行为），滚轮缩放画布（ECharts 原生行为）。光标 SHALL 为 `default`。

#### Scenario: 点击曲线选中

- **WHEN** 在 `select` 模式下点击图表中的一条曲线
- **THEN** 该曲线被选中（`selectedCurveId` 更新为该曲线 ID），元数据面板显示该曲线信息

#### Scenario: 拖拽空白区域平移画布

- **WHEN** 在 `select` 模式下拖拽图表空白区域
- **THEN** 画布随拖拽方向平移，dataZoom 范围更新

#### Scenario: 滚轮缩放画布

- **WHEN** 在 `select` 模式下使用鼠标滚轮
- **THEN** 画布在 X 轴方向缩放，dataZoom 范围更新

### Requirement: 专用工具禁用画布平移

在 `brace`、`pointLabel`、`move`、`brush`、`zoomGlobal`、`zoomCurve` 模式下，系统 SHALL 禁用 ECharts 原生 `type: 'inside'` dataZoom 的拖拽平移和滚轮缩放行为，仅保留工具自身的交互逻辑。

#### Scenario: 标注模式下拖拽不平移

- **WHEN** 在 `brace` 模式下拖拽图表空白区域
- **THEN** 画布不平移，仅开始区间选择操作

#### Scenario: 标注模式下滚轮不缩放

- **WHEN** 在 `brace` 或 `pointLabel` 模式下使用鼠标滚轮
- **THEN** 画布不缩放

#### Scenario: select 模式下保留原生平移和缩放

- **WHEN** 在 `select` 模式下拖拽或滚轮
- **THEN** ECharts 原生 dataZoom 行为正常（平移 + 缩放）

### Requirement: 按住空格临时手型工具

在任何交互模式下，系统 SHALL 支持按住空格键临时切换为手型平移工具。按下空格键时，ECharts dataZoom `type: 'inside'` 恢复为可用状态，光标变为 `grab`。松开空格键后，恢复原交互模式的数据 Zoom 配置和光标。空格键 SHALL NOT 改变 `interactionMode` 状态，工具栏按钮的激活状态 SHALL NOT 变化。

#### Scenario: 标注模式下按住空格平移

- **WHEN** 在 `brace` 模式下按住空格键并拖拽图表
- **THEN** 画布随拖拽平移，工具栏仍然显示区间标签工具为激活状态；松开空格后恢复区间标签工具行为

#### Scenario: 松开空格恢复原工具

- **WHEN** 在 `move` 模式下按住空格平移后松开空格键
- **THEN** 光标恢复为 `move` 样式，画布不再响应拖拽平移，重新响应手动移动工具行为

#### Scenario: select 模式下空格不产生额外效果

- **WHEN** 在 `select` 模式下按住空格键拖拽
- **THEN** 画布正常平移（select 模式本身已支持平移），光标无变化

#### Scenario: 空格键不触发页面滚动

- **WHEN** 在非 `select` 工具下按住空格键
- **THEN** 页面不滚动（`e.preventDefault()` 生效），仅在图表区域触发手型平移

### Requirement: Esc 键回到 select

在任何非 `select` 工具下，系统 SHALL 支持按 Escape 键回到 `select` 模式。在 `select` 模式下按 Escape 键 SHALL 无操作。

#### Scenario: 标注模式下按 Esc 回到 select

- **WHEN** 在 `brace` 模式下按 Esc 键
- **THEN** `interactionMode` 变为 `'select'`，一般选中工具按钮激活，区间标签按钮非激活

#### Scenario: select 模式下按 Esc 无操作

- **WHEN** 在 `select` 模式下按 Esc 键
- **THEN** `interactionMode` 保持 `'select'`，无任何副作用

### Requirement: 工具栏 3 组分组

工具栏左侧工具按钮 SHALL 按以下 3 组排列，组间用竖线分隔符（`w-px h-5 bg-gray-300`）分隔：

- **视图操作**: 一般选中、框选放大
- **标注插入**: 区间标签、点标签
- **曲线分布**: 手动移动、全局缩放、单曲线缩放

每组内的工具按钮 SHALL 紧邻排列，无额外间距。

#### Scenario: 3 组分组显示

- **WHEN** 页面加载完成
- **THEN** 工具栏左侧显示 7 个工具按钮，组间有分隔符，按视图操作 → 标注插入 → 曲线分布顺序排列

### Requirement: 工具栏左工具右操作布局

工具栏 SHALL 分为左右两区：左侧为 7 个工具按钮（含分组分隔符），右侧为操作按钮（撤销、重做、导出 ▾、工作区 ▾、版本次号）。左右区之间 SHALL 使用 `ml-auto` 自动分离。

#### Scenario: 左右分区布局

- **WHEN** 页面加载完成
- **THEN** 撤销/重做按钮在工具栏右侧，与工具按钮分离

#### Scenario: 窄屏时两区不重叠

- **WHEN** 浏览器窗口宽度缩小至 1024px
- **THEN** 工具按钮和操作按钮之间保持间距，不重叠

### Requirement: 锁定按钮条件显示

锁定按钮（LockIcon）SHALL 仅在 `interactionMode === 'move'` 且 `selectedCurveId !== null` 时显示。SHALL 位于「手动移动」按钮旁边。

#### Scenario: 手动移动模式下选中曲线时显示锁定按钮

- **WHEN** `interactionMode` 为 `'move'` 且 `selectedCurveId` 不为 null
- **THEN** 锁定按钮在手动移动按钮旁边显示

#### Scenario: 非手动移动模式下隐藏锁定按钮

- **WHEN** `interactionMode` 为 `'select'` 或 `'brace'` 等其他模式
- **THEN** 锁定按钮不显示

### Requirement: 工具按钮禁用状态

所有工具按钮 SHALL 在 `curves` 为空时处于禁用状态（`disabled` 属性为 true，视觉显示灰色）。`select` 工具不在此限制内——即使没有曲线，用户仍可进入 `select` 模式查看空图表。

#### Scenario: 无曲线时工具按钮禁用

- **WHEN** 图表中没有任何曲线数据
- **THEN** 除「一般选中」外的所有工具按钮显示为禁用状态，不可点击

#### Scenario: 有曲线时工具按钮启用

- **WHEN** 至少有一条曲线被加载
- **THEN** 所有 7 个工具按钮均可点击

### Requirement: 一般选中图标

系统 SHALL 提供 `SelectIcon` 组件，渲染为单箭头（↖）形状，viewBox 24×24，strokeWidth 2，与 PS/Figma 的默认工具图标一致。

#### Scenario: SelectIcon 渲染

- **WHEN** 工具栏渲染「一般选中」按钮
- **THEN** 按钮显示单箭头图标，18px 尺寸下清晰可辨识

### Requirement: 框选放大图标优化

`BoxSelectIcon` SHALL 在现有虚线矩形基础上增加放大镜角标，明确表示"框选后放大"的语义。

#### Scenario: BoxSelectIcon 渲染

- **WHEN** 工具栏渲染「框选放大」按钮
- **THEN** 按钮显示虚线矩形 + 放大镜角标图标，18px 尺寸下清晰可辨识

### Requirement: 新建工作区重置工具

当用户执行「新建工作区」操作时，系统 SHALL 将 `interactionMode` 重置为 `'select'`。

#### Scenario: 新建工作区后工具回到 select

- **WHEN** 用户在 `brace` 模式下点击「新建工作区」并确认
- **THEN** `interactionMode` 变为 `'select'`，一般选中工具按钮激活