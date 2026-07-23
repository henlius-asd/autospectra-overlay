# workspace-persistence Specification

## MODIFIED Requirements

### Requirement: 恢复时缺失字段回退默认值

系统 SHALL 在从 IndexedDB/JSON 恢复工作区时，对任何缺失字段回退到默认值：`curveScales`/`curveScaleOffsets` 回退 `{}`，`globalScale` 回退 `1`，`layerSpacing` 回退 `0`，`pointLabels`/`braces` 回退 `[]`，`stagingOrder` 回退 `[]`，`visibleCurves` 回退 `{}`。该回退 SHALL 保证不含新字段的旧版本快照可无错恢复。系统 SHALL NOT 持久化或恢复 `normalizeFactors` 字段。

#### Scenario: 旧版本 IndexedDB 快照恢复

- **WHEN** IndexedDB 中存在不含 `curveScales`/`curveScaleOffsets`/`globalScale` 字段的旧快照，系统执行恢复
- **THEN** 恢复无运行时错误，`curveScales` 为 `{}`，`curveScaleOffsets` 为 `{}`，`globalScale` 为 `1`

### Requirement: JSON 导入恢复全部字段

系统 SHALL 在导入工作区 JSON 时恢复全部上述字段；导入路径缺失字段 SHALL 按默认值回退。导入后图表渲染 SHALL 与导出时一致（含缩放、单曲线缩放、Y 缩放范围）。系统 SHALL NOT 导入或恢复 `normalizeFactors` 字段。

#### Scenario: 导入导出往返无损

- **WHEN** 用户配置 `globalScale=1.5`、某曲线 `curveScales=2.0`（含归一化结果），导出 JSON 后再导入同一 JSON
- **THEN** 导入后 `globalScale` 为 1.5，`curveScales` 与导出时一致

#### Scenario: 导入缺失字段回退

- **WHEN** 导入的 JSON 不含 `globalScale` 字段
- **THEN** 导入后 `globalScale` 为默认值 `1`，无运行时错误

## ADDED Requirements

### Requirement: 快照版本迁移至 v4

工作区快照 SHALL 携带 `version` 字段，当前版本为 `4`。恢复时 SHALL 根据 `version` 执行迁移：当 `version < 4` 且快照含 `normalizeFactors` 字段时，对每条曲线 SHALL 执行 `curveScales[id] = (curveScales[id] ?? 1) * (normalizeFactors[id] ?? 1)`，然后 SHALL 删除 `normalizeFactors` 字段。迁移 SHALL 保证 v3 快照（含独立归一化层）恢复后曲线缩放视觉效果不变。当 `version < 3` 时，SHALL 先执行 v2→v3 颜色迁移，再执行 v3→v4 缩放迁移。

#### Scenario: v3 快照迁移到 v4

- **WHEN** 恢复 `version: 3` 且含 `normalizeFactors: { c1: 2.0 }`、`curveScales: { c1: 0.8 }` 的旧快照
- **THEN** 迁移后 `curveScales.c1` = 1.6（= 0.8 × 2.0），`normalizeFactors` 字段不存在，渲染倍率不变

#### Scenario: v3 快照无 normalizeFactors

- **WHEN** 恢复 `version: 3` 且不含 `normalizeFactors` 字段的快照
- **THEN** `curveScales` 原样恢复，无迁移副作用

#### Scenario: v4 快照原样恢复

- **WHEN** 恢复 `version: 4` 的快照
- **THEN** 快照原样恢复，不执行缩放迁移

#### Scenario: 缺失 version 视为 v2

- **WHEN** 恢复不含 `version` 字段的旧快照
- **THEN** 视为 `version: 2` 先执行颜色迁移，再执行缩放迁移
