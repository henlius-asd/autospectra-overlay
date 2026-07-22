## MODIFIED Requirements

### Requirement: 确认与取消

颜色面板底部 SHALL 显示"取消"和"确认"按钮。点击"确认" SHALL 将当前预览颜色写入所选曲线的 `lineStyle.color` 覆盖字段（`setCurveLineStyle(id, { color })`），并将颜色添加到历史记录，关闭面板。点击"取消"或 ✕ SHALL 恢复原始颜色并关闭面板。

#### Scenario: 确认应用颜色

- **WHEN** 用户点击"确认"按钮
- **THEN** 当前预览颜色被写入该曲线 `lineStyle.color` 覆盖字段，添加到历史记录，面板关闭

#### Scenario: 取消恢复原始颜色

- **WHEN** 用户点击"取消"按钮或 ✕ 按钮
- **THEN** 曲线颜色恢复为打开面板前的值，面板关闭
