# Spec: interaction-ux

## MODIFIED Requirements

### Requirement: 面板拖拽调宽

数据区与工具箱面板 SHALL 支持通过拖拽与图表区之间的分隔条调整宽度。拖拽条宽度 4px，鼠标悬浮时显示 `col-resize` 光标。拖拽时更新面板宽度（内联 style），宽度范围：数据区 120–400px，工具箱 160–500px。

面板宽度 SHALL 持久化到 `localStorage`（key `autospectra:panel-widths`），拖拽结束时写入。应用加载时从 localStorage 读取初始宽度，读取时 clamp 到当前 MIN/MAX 范围；读取失败或无值时使用默认值。窗口缩窄至响应式断点时的 auto-collapse 行为 SHALL 保留，且 SHALL NOT 覆盖已持久化的宽度偏好——面板展开后恢复持久化宽度。

#### Scenario: 拖拽调整数据区宽度

- **WHEN** 用户将鼠标悬停在数据区与图表区之间的分隔条上，看到 col-resize 光标，按下并拖拽 100px 向右
- **THEN** 数据区宽度增加约 100px，图表区相应缩小，无布局溢出

#### Scenario: 宽度持久化跨刷新

- **WHEN** 用户拖拽调整数据区宽度至 350px 后刷新页面
- **THEN** 数据区恢复为 350px（而非默认 240px）

#### Scenario: 读取时 clamp 到安全范围

- **WHEN** localStorage 中存储的宽度为 500px（超出当前 MAX 400px），应用加载
- **THEN** 数据区宽度为 400px（被 clamp 到 MAX），无布局溢出

#### Scenario: auto-collapse 不覆盖持久化偏好

- **WHEN** 用户在宽屏上将数据区拖至 350px，窗口缩窄触发 auto-collapse，再放大窗口使面板展开
- **THEN** 展开后面板宽度恢复为 350px，而非默认 240px
