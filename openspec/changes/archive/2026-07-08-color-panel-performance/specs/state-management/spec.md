# state-management Delta Spec

## ADDED Requirements

### Requirement: uiStore 新增 colorHistory 状态

uiStore SHALL 新增 `colorHistory: string[]` 字段，存储最近使用的颜色列表（最多 8 个，去重，最新在前）。初始值为空数组。SHALL 提供 `addColorToHistory(color: string)` action。

#### Scenario: 添加颜色到历史

- **WHEN** 调用 `addColorToHistory('#FF0000')`
- **THEN** `colorHistory` 数组头部为 `#FF0000`，长度为 1

#### Scenario: 重复颜色去重

- **WHEN** `colorHistory` 为 `['#FF0000', '#0000FF']`，调用 `addColorToHistory('#FF0000')`
- **THEN** `colorHistory` 变为 `['#FF0000', '#0000FF']`，长度仍为 2

#### Scenario: 超过 8 个时裁剪

- **WHEN** `colorHistory` 已有 8 个颜色，调用 `addColorToHistory('#00FF00')`
- **THEN** `colorHistory` 保持 8 个，最后一个被移除，新颜色在头部

#### Scenario: 初始状态

- **WHEN** 应用首次加载
- **THEN** `colorHistory` 为空数组