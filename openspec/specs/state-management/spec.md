# state-management Specification

## Purpose

Zustand Store 状态管理——定义 curveStore 和 uiStore 的初始状态、actions 和交互模式管理。

## Requirements

### Requirement: Zustand Store 骨架就位

系统 SHALL 创建两个 Zustand Store：`curveStore` 和 `uiStore`。`curveStore` SHALL 挂载 zundo 撤销/重做中间件，`uiStore` 不挂载。

#### Scenario: curveStore 创建成功

- **WHEN** 组件通过 `useCurveStore()` hook 访问 Store
- **THEN** 返回的 Store 实例包含初始空状态，无运行时错误

#### Scenario: uiStore 创建成功

- **WHEN** 组件通过 `useUiStore()` hook 访问 Store
- **THEN** 返回的 Store 实例包含初始 UI 状态（左右栏均为展开状态），无运行时错误

### Requirement: zundo 中间件挂载

系统 SHALL 在 curveStore 挂载 zundo `temporal` 中间件以提供撤销/重做能力，并配置 `limit` 限制历史栈容量。为避免高频状态变更（滑块拖拽、连续 `set()`）冲刷历史栈导致早期离散操作不可撤销，系统 SHALL 配置 `handleSet` 实现历史 cool-off：在 cool-off 窗口（约 400ms）内的连续 `set()` SHALL 合并为单条历史记录，仅在窗口结束后落定一次快照。cool-off 常量 SHALL 集中定义以便调参。

#### Scenario: zundo 中间件挂载

- **WHEN** curveStore 的状态发生变化
- **THEN** zundo 中间件自动记录快照，`useCurveStore.temporal.getState()` 可访问历史栈

#### Scenario: 滑块拖拽不冲刷历史

- **WHEN** 用户在已有 N 条历史的状态下，拖动层间距滑块连续触发超过 `limit` 次 `setLayerSpacing`
- **THEN** 拖拽结束后 `pastStates` 中仍至少保留部分早于拖拽开始前的离散操作历史，可 `undo()` 回到拖拽前状态

#### Scenario: 离散操作正常入历史

- **WHEN** 用户依次执行"添加曲线"、"设为基准线"、"设颜色"等离散操作，各操作间隔超过 cool-off 窗口
- **THEN** 每个离散操作在 `pastStates` 中产生独立条目，可分别 `undo()` 回退

### Requirement: 全局类型定义文件就位

系统 SHALL 在 `src/types/` 目录下创建以下类型定义文件：

- `curve.ts`：定义 `CurveData { name: string; data: [number, number][] }` 和 `ParsedFile { id: string; name: string; tags?: string[]; curves: CurveData[] }`
- `brace.ts`：定义 `BraceAnnotation { id: string; type: 'horizontal'; startX: number; endX: number; label: string }`
- `alignment.ts`：定义 `AlignmentAlgorithm` 接口（含 `name: string`、`align(ref, target, roi)` 方法签名）和 `AlignmentResult { xOffset: number; correlationScore: number }`

#### Scenario: 类型可导入

- **WHEN** 开发者从 `@/types/curve` 导入 `CurveData`
- **THEN** TypeScript 编译通过，类型定义可用

### Requirement: curveStore 初始状态

curveStore 初始状态 SHALL 包含以下字段，均为空值：

- `curves: Record<string, CurveData>` — 空对象
- `offsets: Record<string, { xOffset: number; yOffset: number }>` — 空对象
- `visibleCurves: Record<string, boolean>` — 空对象，追踪当前可见的曲线 ID
- `stagingOrder: string[]` — 空数组，叠图区曲线 ID 的有序列表
- `layerSpacing: number` — 0，Y 轴层间距，默认不产生分层
- `baselineId: string | null` — null
- `braces: BraceAnnotation[]` — 空数组

#### Scenario: 初始状态验证

- **WHEN** 应用首次加载，未进行任何操作
- **THEN** `curveStore.getState()` 返回的 `curves` 为空对象，`visibleCurves` 为空对象，`stagingOrder` 为空数组，`layerSpacing` 为 0，`baselineId` 为 null，`braces` 为空数组

### Requirement: uiStore 初始状态

uiStore 初始状态 SHALL 包含以下字段：

- `leftPanelCollapsed: boolean` — false
- `rightPanelCollapsed: boolean` — false
- `selectionMode: 'none' | 'roi'` — 'none'
- `alignmentProgress: number | null` — null
- `xRange: [number, number]` — [0, 10]
- `interactionMode: InteractionMode` — `'select'`
- `spaceHeld: boolean` — false

uiStore SHALL NOT 包含 `bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode` 这些 boolean flag。

#### Scenario: 初始 UI 状态验证

- **WHEN** 应用首次加载
- **THEN** 左右面板均为展开状态，选取模式为 none，对齐进度为 null，xRange 为 [0, 10]，interactionMode 为 `'select'`

#### Scenario: 旧 boolean flag 不存在

- **WHEN** 应用首次加载
- **THEN** `uiStore` 中不存在 `bracePlacementMode`、`pointLabelPlacementMode`、`manualMoveMode`、`brushMode`、`globalScaleMode`、`perCurveScaleMode` 字段

### Requirement: uiStore 包含 X 轴可视范围

uiStore SHALL 包含 `xRange: [number, number]` 字段表示当前图表 X 轴可视范围，默认值为 `[0, 10]`。SHALL 提供 `setXRange` action 用于更新该字段。

#### Scenario: 初始值

- **WHEN** 应用首次加载
- **THEN** `uiStore.getState().xRange` 为 `[0, 10]`

#### Scenario: 更新可视范围

- **WHEN** 调用 `uiStore.getState().setXRange([5, 15])`
- **THEN** `uiStore.getState().xRange` 为 `[5, 15]`

### Requirement: addCurves 行为变更

`addCurves` action SHALL 将新曲线数据存入 `curves` 并初始化 `offsets`，但 SHALL NOT 自动将新曲线 ID 添加到 `visibleCurves` 集合或 `stagingOrder` 中。新曲线上传后默认不可见，位于未叠图区。`addCurves` SHALL NOT 显式设置 `baselineId`；`baselineId` 由后续的 `toggleCurveVisibility` action 通过 `deriveBaseline` 派生。导入曲线后若没有任何可见曲线，`baselineId` 保持为 null。

#### Scenario: 上传曲线后不可见

- **WHEN** 调用 `addCurves` 添加新曲线
- **THEN** 曲线被存入 `curves`，但其 ID 不在 `visibleCurves` 集合中，也不在 `stagingOrder` 中，图表不渲染该曲线

#### Scenario: 导入曲线后不自动设置基线

- **WHEN** 调用 `addCurves` 且当前 `baselineId` 为 null
- **THEN** `baselineId` 保持为 null，基线由下一次 `toggleCurveVisibility` 时派生

### Requirement: 新增 toggleCurveVisibility action

curveStore SHALL 提供 `toggleCurveVisibility(id: string)` action，用于切换指定曲线的可见性状态。如果曲线 ID 在 `visibleCurves` 中，则移除；否则添加。同步更新 `stagingOrder`：可见时追加到末尾，不可见时从 `stagingOrder` 中移除。

#### Scenario: 切换为可见

- **WHEN** 调用 `toggleCurveVisibility('curve_1')` 且该曲线之前不可见
- **THEN** `visibleCurves` 包含 'curve_1'，`stagingOrder` 末尾追加 'curve_1'，图表渲染该曲线

#### Scenario: 切换为不可见

- **WHEN** 调用 `toggleCurveVisibility('curve_1')` 且该曲线之前可见
- **THEN** `visibleCurves` 和 `stagingOrder` 均不再包含 'curve_1'，图表移除该曲线

### Requirement: 新增 setAllCurvesVisibility action

curveStore SHALL 提供 `setAllCurvesVisibility(visible: boolean)` action，用于一次性设置所有曲线的可见性。

#### Scenario: 全选

- **WHEN** 调用 `setAllCurvesVisibility(true)`
- **THEN** `visibleCurves` 包含所有曲线 ID

#### Scenario: 取消全选

- **WHEN** 调用 `setAllCurvesVisibility(false)`
- **THEN** `visibleCurves` 变为空对象

### Requirement: 新增 setLayerSpacing action

curveStore SHALL 提供 `setLayerSpacing(spacing: number)` action，用于设置 Y 轴层间距值。

#### Scenario: 设置层间距

- **WHEN** 调用 `setLayerSpacing(0.5)`
- **THEN** `layerSpacing` 变为 0.5，可见曲线的 Y 偏移按新间距重新计算

### Requirement: removeCurve 行为增强

`removeCurve` action SHALL 在删除曲线时同时从 `visibleCurves` 集合和 `stagingOrder` 数组中移除该曲线 ID。

#### Scenario: 删除可见曲线

- **WHEN** 调用 `removeCurve('curve_1')` 且 'curve_1' 在 `visibleCurves` 和 `stagingOrder` 中
- **THEN** 曲线从 `curves`、`offsets`、`visibleCurves` 和 `stagingOrder` 中同时移除

### Requirement: 新增 stagingOrder 状态

curveStore SHALL 包含 `stagingOrder: string[]` 字段，存储叠图区曲线 ID 的有序列表。数组顺序决定图表中曲线的渲染层级顺序（index 0 = 图表最下侧）。

#### Scenario: 初始空数组

- **WHEN** 应用首次加载
- **THEN** `stagingOrder` 为空数组

### Requirement: 新增 setStagingOrder action

curveStore SHALL 提供 `setStagingOrder(order: string[])` action，用于更新叠图区曲线的排序。

#### Scenario: 拖拽更新排序

- **WHEN** 用户拖拽叠图区曲线改变顺序，调用 `setStagingOrder(['curve_2', 'curve_1', 'curve_3'])`
- **THEN** `stagingOrder` 更新为新的顺序，图表渲染顺序同步更新

### Requirement: 新增 setDisplayName action

curveStore SHALL 提供 `setDisplayName(id: string, displayName: string)` action，用于设置曲线的显示名称。

#### Scenario: 设置显示名称

- **WHEN** 调用 `setDisplayName('curve_1', 'Sample A')`
- **THEN** 曲线 'curve_1' 的 `displayName` 字段更新为 'Sample A'

### Requirement: 新增 selectedCurveId 状态

uiStore SHALL 包含 `selectedCurveId: string | null` 字段，表示当前选中的曲线 ID（用于元数据展示等用途）。默认值为 null。SHALL 提供 `setSelectedCurveId` action。

#### Scenario: 初始为 null

- **WHEN** 应用首次加载
- **THEN** `selectedCurveId` 为 null

#### Scenario: 点击曲线选中

- **WHEN** 调用 `setSelectedCurveId('curve_1')`
- **THEN** `selectedCurveId` 为 'curve_1'

### Requirement: 新增 CurveData.displayName 和 metadata 字段

`CurveData` 类型 SHALL 新增以下可选字段：
- `displayName?: string` — 显示名称，用于图表区分各曲线
- `metadata?: Record<string, string>` — 文件元数据键值对

#### Scenario: 类型包含新字段

- **WHEN** 开发者从 `@/types/curve` 导入 `CurveData`
- **THEN** `CurveData` 类型包含 `displayName` 和 `metadata` 可选字段，TypeScript 编译通过

### Requirement: uiStore 新增 colorHistory 状态

uiStore SHALL 新增 `colorHistory: string[]` 字段，存储最近使用的颜色列表（最多 8 个，去重，最新在前）。初始值为空数组。SHALL 提供 `addColorToHistory(color: string)` action。

#### Scenario: 添加颜色到历史

- **WHEN** 调用 `addColorToHistory('#FF0000')`
- **THEN** `colorHistory` 数组头部为 `#FF0000`，长度为 1

#### Scenario: 重复颜色去重

- **WHEN** `colorHistory` 为 `['#FF0000', '#0000FF']`，调用 `addColorToHistory('#FF0000')`
- **THEN** `colorHistory` 变为 `['#FF0000', '#0000FF']`，长度仍为 2

#### Scenario: 超过 8 个时裁剪

- **WHEN** `colorHistory` 已有 8 个颜色，调用 `addColorToHistory('#00FF00')`
- **THEN** `colorHistory` 保持 8 个，最后一个被移除，新颜色在头部

#### Scenario: 初始状态

- **WHEN** 应用首次加载
- **THEN** `colorHistory` 为空数组

### Requirement: 新建工作区

系统 SHALL 提供"新建工作区"功能。用户点击后经确认弹窗，SHALL 保留原始曲线数据（`curves`），清空所有可变状态——曲线移出叠图区（`visibleCurves`/`stagingOrder` 清空）、对齐偏移（`offsets`）、缩放（`curveScales`/`curveScaleOffsets`/`normalizeFactors`/`globalScale`）、层间距（`layerSpacing`）、标注（`braces`/`pointLabels`）、锁定（`locked`），并重置图表视图状态与 undo 历史。用户显示偏好 SHALL 保留。IndexedDB 工作区数据 SHALL 被清除。

#### Scenario: 新建工作区保留曲线数据、移出叠图区

- **WHEN** 用户加载了若干曲线并加入叠图后点击"新建工作区"并确认
- **THEN** 曲线数据保留在左侧数据区，但全部从叠图区移出（`visibleCurves` 和 `stagingOrder` 清空），偏移/缩放/标注/层间距/锁定均被清空

#### Scenario: 新建工作区保留显示偏好

- **WHEN** 用户新建工作区
- **THEN** 网格显隐、X/Y 轴显隐、导出含图例、标签样式、颜色历史、面板折叠状态保持不变

#### Scenario: 新建工作区清空 undo 历史

- **WHEN** 用户新建工作区后
- **THEN** Ctrl+Z 不可用（undo 历史已清空）

#### Scenario: 新建工作区清除 IndexedDB

- **WHEN** 用户新建工作区后刷新页面
- **THEN** 不会恢复之前的工作区数据（`current_workspace` key 已删除）

#### Scenario: 确认弹窗防误操作

- **WHEN** 用户点击"新建工作区"
- **THEN** 弹出确认对话框（"确认新建工作区？当前数据将清空"），取消则不执行任何操作

### Requirement: setInteractionMode action

uiStore SHALL 提供 `setInteractionMode(mode: InteractionMode)` action，用于设置当前交互模式。

#### Scenario: 设置交互模式

- **WHEN** 调用 `setInteractionMode('brush')`
- **THEN** `interactionMode` 变为 `'brush'`

### Requirement: 新建工作区重置 interactionMode

`resetUiForNewWorkspace` action SHALL 将 `interactionMode` 重置为 `'select'`。

#### Scenario: 新建工作区后工具重置

- **WHEN** 调用 `resetUiForNewWorkspace()`
- **THEN** `interactionMode` 变为 `'select'`

### Requirement: spaceHeld 状态

uiStore SHALL 包含 `spaceHeld: boolean` 字段，默认值为 `false`。SHALL 提供 `setSpaceHeld(held: boolean)` action。

#### Scenario: 按下空格键

- **WHEN** 用户按下空格键
- **THEN** `spaceHeld` 变为 `true`

#### Scenario: 松开空格键

- **WHEN** 用户松开空格键
- **THEN** `spaceHeld` 变为 `false`

