## ADDED Requirements

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