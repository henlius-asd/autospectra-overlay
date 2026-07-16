## ADDED Requirements

### Requirement: Toast 通知显示

系统 SHALL 在应用右下角显示非阻塞的 Toast 通知，3 秒后自动消失。Toast SHALL 支持三种类型：success（绿色）、error（红色）、info（蓝色）。Toast SHALL 使用 `fixed` 定位，带淡入/淡出 CSS transition 动画。同一时间 SHALL 仅显示一个 Toast（新 Toast 替换旧的）。

#### Scenario: 导出失败时显示 Toast

- **WHEN** 导出图片操作失败
- **THEN** 右下角显示红色 error Toast "导出图片失败"，3 秒后自动消失

#### Scenario: 工作区解析失败时显示 Toast

- **WHEN** 导入 JSON 工作区文件解析失败
- **THEN** 右下角显示红色 error Toast "工作区文件解析失败"，3 秒后自动消失

#### Scenario: 对齐失败时显示 Toast

- **WHEN** 自动对齐操作失败
- **THEN** 右下角显示红色 error Toast "对齐失败"，3 秒后自动消失

#### Scenario: Toast 自动消失

- **WHEN** Toast 显示后经过 3 秒
- **THEN** Toast 自动淡出消失，不阻塞用户操作

#### Scenario: 新 Toast 替换旧 Toast

- **WHEN** 一个 Toast 正在显示中，触发新的 Toast
- **THEN** 旧 Toast 立即消失，新 Toast 显示