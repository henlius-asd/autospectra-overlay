## MODIFIED Requirements

### Requirement: 点标签放置与编辑交互

系统 SHALL 在工具栏提供点标签放置入口。该按钮 SHALL 位于「标注插入」分组中，与「区间标签」按钮紧邻。点击后 `interactionMode` 设置为 `'pointLabel'`。在图表上点击 X 位置后弹出标签编辑浮层。已有点标签点击后 SHALL 进入编辑（可改文字或删除）。Escape SHALL 使 `interactionMode` 回到 `'select'`。放置模式下，ECharts 原生画布平移 SHALL 被禁用。

#### Scenario: 放置模式下点击创建并编辑

- **WHEN** 用户点击点标签按钮进入放置模式后，在图表某 X 位置点击
- **THEN** 在该位置创建一个空标签并弹出编辑浮层，用户输入文字确认后保存，`interactionMode` 回到 `'select'`

#### Scenario: Escape 退出放置

- **WHEN** 在 `'pointLabel'` 模式下按 Escape
- **THEN** `interactionMode` 变为 `'select'`，不产生残留状态

#### Scenario: 再次点击按钮回到 select

- **WHEN** 当前 `interactionMode` 为 `'pointLabel'`，用户再次点击点标签按钮
- **THEN** `interactionMode` 变为 `'select'`

#### Scenario: 放置模式下画布不平移

- **WHEN** 在 `'pointLabel'` 模式下拖拽图表空白区域
- **THEN** 画布不平移，拖拽行为不创建点标签

## ADDED Requirements

### Requirement: 按住空格临时平移

在 `'pointLabel'` 模式下，按住空格键 SHALL 临时恢复 ECharts 原生画布平移，光标变为 `grab`。松开空格键后 SHALL 恢复 `'pointLabel'` 模式的行为和光标。

#### Scenario: 按住空格临时平移

- **WHEN** 在 `'pointLabel'` 模式下按住空格键并拖拽图表
- **THEN** 画布随拖拽平移，工具栏仍然显示点标签按钮为激活状态；松开空格后恢复点标签放置行为