## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: 按住空格临时平移

在 `'brace'` 模式下，按住空格键 SHALL 临时恢复 ECharts 原生画布平移，光标变为 `grab`。松开空格键后 SHALL 恢复 `'brace'` 模式的行为和光标。

#### Scenario: 按住空格临时平移

- **WHEN** 在 `'brace'` 模式下按住空格键并拖拽图表
- **THEN** 画布随拖拽平移，工具栏仍然显示区间标签按钮为激活状态；松开空格后恢复区间选择行为