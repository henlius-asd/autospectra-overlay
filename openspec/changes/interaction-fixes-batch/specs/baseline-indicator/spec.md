## MODIFIED Requirements

### Requirement: 基准线 ★ 标识

左栏曲线列表 SHALL 在当前基准线所在行（即叠图区最底层曲线）显示 ★ 星标标识。基准线 SHALL 由 `stagingOrder` 中最后一个可见曲线的位置派生，而非独立设置。★ 标识 SHALL 在顺序变化、可见性变化或曲线删除导致的基准线变更时立即更新。

#### Scenario: 默认基准线显示 ★

- **WHEN** 第一条曲线导入并进入叠图区（成为唯一的可见曲线，即最底层）
- **THEN** 该曲线行显示 ★ 星标，`baselineId` 设为该曲线 id

#### Scenario: 拖到底部成为基准线后 ★ 更新

- **WHEN** 用户将另一条曲线拖拽到 `stagingOrder` 末尾（或通过右键"设为基准线"将其移到末尾）
- **THEN** ★ 标识从旧基准线移到新基准线所在行，`baselineId` 更新为新曲线 id

#### Scenario: 删除基准线后 ★ 转移到底层曲线

- **WHEN** 用户删除当前基准线曲线
- **THEN** ★ 标识移到删除后 `stagingOrder` 中新的最后一个可见曲线，`baselineId` 更新为该曲线 id；若叠图区无可见曲线，`baselineId` 为 null 且 ★ 消失

#### Scenario: 非基准线曲线无 ★

- **WHEN** 查看非叠图区最底层曲线的行
- **THEN** 该行不显示 ★ 标识
