# brace-tool Delta Specification

## MODIFIED Requirements

### Requirement: 大括号插入工具按钮

系统 SHALL 在工具栏提供"插入区间标签"按钮。点击后进入放置模式，用户可在图表上拖拽选择区间放置区间标签。拖拽结束后（pointerUp 事件，位移阈值 >= 5px）系统 SHALL 退出放置模式并打开编辑浮层，用户输入标签文字后点击"确认"按钮 SHALL 成功保存标签。放置模式在 pointerUp 时退出，早于浮层确认。

#### Scenario: 点击工具按钮进入放置模式

- **WHEN** 用户点击工具栏中的"插入区间标签"按钮
- **THEN** 按钮高亮显示为激活状态，图表光标变为 crosshair，提示用户拖拽选择区间

#### Scenario: 拖拽选择区间并输入标签

- **WHEN** 在放置模式下，用户拖拽选择区间后释放鼠标（位移 >= 5px）
- **THEN** 放置模式退出，系统弹出标签编辑浮层，浮层包含输入框、"确认"和"取消"按钮，所有按钮均可正常点击

#### Scenario: 确认标签后保存

- **WHEN** 用户在浮层中输入标签文字后点击"确认"按钮（或按 Enter 键）
- **THEN** 区间标签被保存并存入 store，浮层关闭（放置模式已在 pointerUp 时退出）

#### Scenario: 取消放置

- **WHEN** 在放置模式下，用户按 Escape 键或再次点击工具按钮
- **THEN** 放置模式退出，已记录的端点被清除

#### Scenario: 工具按钮仅在图表有数据时可用

- **WHEN** 图表中没有曲线数据
- **THEN** "插入区间标签"按钮显示为禁用状态

### Requirement: 区间标签文字渲染

区间标签（大括号）的文字字号、字体、字重、文字颜色 SHALL 取自 `uiStore.labelStyle` 默认值，回退到内置默认（字号 10，与点标签统一）。SHALL NOT 使用硬编码字号。区间标签 SHALL 复用与点标签相同的"标签样式编辑"能力（工具栏面板），无需独立入口。系统 SHALL NOT 提供单独编辑单个区间标签样式覆盖的 UI。

#### Scenario: 调整默认字号后大括号标签更新

- **WHEN** 用户在"标签样式"面板将默认字号从 11 改为 16
- **THEN** 所有区间标签立即以 16px 重渲染

#### Scenario: 导出保留大括号标签样式

- **WHEN** 用户调整默认字号后点击"导出图片"
- **THEN** 导出图片中的区间标签按调整后的样式渲染

## REMOVED Requirements

### Requirement: 大括号点击编辑 (Scenario: 选中区间标签单独编辑样式 — removed)

**Reason:** The style panel (`LabelStyleControls`) edits only the global default `LabelStyle` in `uiStore`. There is no per-brace style override editing UI. The scenario "选中区间标签单独编辑样式" is therefore false.

**Migration:** Any references to per-brace style override editing SHOULD be removed. The style panel controls apply to all labels globally.