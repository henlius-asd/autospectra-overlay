# hud-shortcuts Specification

## Purpose

渲染区浮层快捷键说明书，首次进入自动显示，关闭后通过 `?` 按钮重新打开，左侧固定快捷键列表，右侧根据当前工具动态显示操作说明。

## Requirements

### Requirement: HUD 首次显示

系统 SHALL 在用户首次访问时自动弹出 HUD 快捷键说明书。系统 SHALL 通过 `localStorage` 中的 `hasSeenShortcuts` 标记判断是否首次访问。若标记不存在或为 `false`，SHALL 自动弹出 HUD。

#### Scenario: 首次访问自动弹出

- **WHEN** 用户首次加载应用（`localStorage` 中无 `hasSeenShortcuts` 标记）
- **THEN** HUD 说明书在图表渲染区左上角自动弹出

#### Scenario: 非首次访问不弹出

- **WHEN** 用户已关闭过 HUD（`localStorage.hasSeenShortcuts` 为 `true`）后再次加载应用
- **THEN** HUD 说明书不自动弹出

### Requirement: HUD 关闭与 `?` 按钮

HUD 说明书 SHALL 有关闭按钮（×）。关闭后，系统 SHALL 在图表渲染区右上角显示 `?` 按钮，用户点击可重新打开 HUD。关闭时 SHALL 设置 `localStorage.hasSeenShortcuts = true`。

#### Scenario: 关闭 HUD 后显示 ? 按钮

- **WHEN** 用户点击 HUD 的关闭按钮
- **THEN** HUD 消失，图表渲染区右上角出现 `?` 按钮

#### Scenario: 点击 ? 按钮重新打开 HUD

- **WHEN** 用户点击 `?` 按钮
- **THEN** HUD 说明书重新弹出，`?` 按钮隐藏

#### Scenario: 再次关闭 HUD

- **WHEN** 用户再次点击 HUD 关闭按钮
- **THEN** HUD 消失，`?` 按钮重新显示

### Requirement: HUD 内容布局

HUD 说明书 SHALL 分为左右两栏：左侧固定显示全局快捷键列表，右侧根据当前 `interactionMode` 动态显示当前工具的名称和操作说明。

#### Scenario: 左侧固定快捷键

- **WHEN** HUD 说明书显示
- **THEN** 左侧显示以下快捷键：
  - 空格 → 临时平移
  - Ctrl+Z → 撤销
  - Ctrl+Y → 重做
  - Esc → 回到默认工具

#### Scenario: 右侧动态工具说明（select 模式）

- **WHEN** 当前 `interactionMode` 为 `'select'`
- **THEN** 右侧显示"一般选中"工具名称和"点击选中曲线，拖拽平移画布"操作说明

#### Scenario: 右侧动态工具说明（brace 模式）

- **WHEN** 当前 `interactionMode` 为 `'brace'`
- **THEN** 右侧显示"区间标签"工具名称和"拖拽选择区间范围"操作说明

#### Scenario: 右侧动态工具说明（brush 模式）

- **WHEN** 当前 `interactionMode` 为 `'brush'`
- **THEN** 右侧显示"框选放大"工具名称和"拖拽框选矩形区域"操作说明

#### Scenario: 右侧动态工具说明（pointLabel 模式）

- **WHEN** 当前 `interactionMode` 为 `'pointLabel'`
- **THEN** 右侧显示"点标签"工具名称和"点击图表放置标签"操作说明

#### Scenario: 右侧动态工具说明（move 模式）

- **WHEN** 当前 `interactionMode` 为 `'move'`
- **THEN** 右侧显示"手动移动"工具名称和"拖拽移动选中曲线"操作说明

#### Scenario: 右侧动态工具说明（zoomGlobal 模式）

- **WHEN** 当前 `interactionMode` 为 `'zoomGlobal'`
- **THEN** 右侧显示"全局缩放"工具名称和"滚轮缩放所有曲线，双击复位"操作说明

#### Scenario: 右侧动态工具说明（zoomCurve 模式）

- **WHEN** 当前 `interactionMode` 为 `'zoomCurve'`
- **THEN** 右侧显示"单曲线缩放"工具名称和"点击选中曲线，滚轮缩放，Shift+拖拽平移，双击复位"操作说明

### Requirement: HUD 样式与定位

HUD 说明书 SHALL 渲染在图表渲染区左上角，使用 `absolute` 定位，半透明深色背景（`bg-gray-900/85`），白色文字，圆角（`rounded-lg`），适当内边距（`p-3`）。SHALL 不遮挡图表的坐标轴标签。SHALL 可拖拽移动位置。

#### Scenario: HUD 视觉样式

- **WHEN** HUD 说明书显示
- **THEN** 浮层为半透明深色背景，白色文字，圆角，位于图表渲染区左上角，文字清晰可读

#### Scenario: HUD 可拖拽

- **WHEN** 用户按住 HUD 的标题栏区域拖拽
- **THEN** HUD 跟随鼠标移动，释放后停留在新位置

### Requirement: HUD 不参与撤销/重做

HUD 的显示/隐藏状态 SHALL NOT 纳入 zundo undo/redo 历史。HUD 是纯 UI 辅助功能，不影响数据状态。

#### Scenario: HUD 状态不影响 undo

- **WHEN** 用户打开/关闭 HUD 后按 Ctrl+Z
- **THEN** 撤销操作不改变 HUD 的显示状态

### Requirement: HUD 持久化状态

HUD 的「已看过」标记（`hasSeenShortcuts`）SHALL 通过 `localStorage` 持久化，跨会话保留。HUD 的位置状态 SHALL NOT 持久化（每次打开回到默认位置）。

#### Scenario: 关闭后刷新不再弹出

- **WHEN** 用户关闭 HUD 后刷新页面
- **THEN** HUD 不自动弹出，右上角显示 `?` 按钮