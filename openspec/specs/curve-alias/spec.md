# curve-alias Specification

## Purpose
曲线别名系统。每条曲线有原始名称（SampleName，唯一标识符）和可选的显示名称（用于图表区分），显示名称支持双击编辑。

## Requirements

### Requirement: 曲线原始名称与显示名称

每条曲线 SHALL 拥有原始名称（`name`，对应 SampleName，作为唯一标识符）和可选的显示名称（`displayName`，用于图表区分各曲线）。原始名称 SHALL 不可修改，显示名称 SHALL 可编辑。

#### Scenario: 默认显示名称

- **WHEN** 曲线首次导入，未设置 `displayName`
- **THEN** 曲线列表和图表图例使用原始名称 `name` 显示

#### Scenario: 设置显示名称

- **WHEN** 用户为曲线设置 `displayName`
- **THEN** 曲线列表和图表图例使用 `displayName` 显示，原始名称保留在数据中不变

#### Scenario: 清除显示名称

- **WHEN** 用户清除曲线的 `displayName`（设为空字符串）
- **THEN** 曲线列表和图表图例回退显示原始名称 `name`

### Requirement: 显示名称双击编辑

用户 SHALL 能够通过双击曲线列表中的曲线名称来编辑显示名称。

#### Scenario: 双击进入编辑模式

- **WHEN** 用户在曲线列表中双击曲线名称
- **THEN** 名称变为可编辑的输入框，自动聚焦并全选文本

#### Scenario: 确认编辑

- **WHEN** 用户在输入框中按 Enter 或点击输入框外部
- **THEN** 输入框内容保存为 `displayName`，输入框退出编辑模式

#### Scenario: 取消编辑

- **WHEN** 用户在输入框中按 Escape
- **THEN** 编辑取消，名称恢复为编辑前的值

#### Scenario: 编辑原始名称无效

- **WHEN** 用户尝试编辑原始名称（`name` 字段）
- **THEN** 操作无效，仅 `displayName` 可编辑