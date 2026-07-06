## ADDED Requirements

### Requirement: 基准线 ★ 标识

左栏曲线列表 SHALL 在当前基准线所在行显示 ★ 星标标识。★ 标识 SHALL 在基线切换时立即更新。

#### Scenario: 默认基准线显示 ★

- **WHEN** 第一条曲线导入并自动设为基准线
- **THEN** 该曲线行显示 ★ 星标（位于曲线名称左侧或右侧）

#### Scenario: 切换基准线后 ★ 更新

- **WHEN** 用户通过右键菜单将另一条曲线设为基准线
- **THEN** ★ 标识从旧基准线移到新基准线所在行

#### Scenario: 删除基准线后 ★ 清除

- **WHEN** 用户删除当前基准线曲线
- **THEN** ★ 标识消失，`baselineId` 为 null，直到新的基准线被设置

#### Scenario: 非基准线曲线无 ★

- **WHEN** 查看非基准线的曲线行
- **THEN** 该行不显示 ★ 标识