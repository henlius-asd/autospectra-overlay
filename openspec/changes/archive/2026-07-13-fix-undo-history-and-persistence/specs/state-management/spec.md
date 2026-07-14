# state-management Delta

## MODIFIED Requirements

### Requirement: zundo 中间件挂载

系统 SHALL 在 curveStore 挂载 zundo `temporal` 中间件以提供撤销/重做能力，并配置 `limit` 限制历史栈容量。为避免高频状态变更（滑块拖拽、连续 `set()`）冲刷历史栈导致早期离散操作不可撤销，系统 SHALL 配置 `handleSet` 实现历史 cool-off：在 cool-off 窗口（约 400ms）内的连续 `set()` SHALL 合并为单条历史记录，仅在窗口结束后落定一次快照。cool-off 常量 SHALL 集中定义以便调参。

#### Scenario: curveStore 创建成功

- **WHEN** 组件通过 `useCurveStore()` hook 访问 Store
- **THEN** 返回的 Store 实例包含初始空状态，无运行时错误

#### Scenario: zundo 中间件挂载

- **WHEN** curveStore 的状态发生变化
- **THEN** zundo 中间件自动记录快照，`useCurveStore.temporal.getState()` 可访问历史栈

#### Scenario: 滑块拖拽不冲刷历史

- **WHEN** 用户在已有 N 条历史的状态下，拖动层间距滑块连续触发超过 `limit` 次 `setLayerSpacing`
- **THEN** 拖拽结束后 `pastStates` 中仍至少保留部分早于拖拽开始前的离散操作历史，可 `undo()` 回到拖拽前状态

#### Scenario: 离散操作正常入历史

- **WHEN** 用户依次执行"添加曲线"、"设为基准线"、"设颜色"等离散操作，各操作间隔超过 cool-off 窗口
- **THEN** 每个离散操作在 `pastStates` 中产生独立条目，可分别 `undo()` 回退
