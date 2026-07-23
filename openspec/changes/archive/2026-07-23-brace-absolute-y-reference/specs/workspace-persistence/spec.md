## ADDED Requirements

### Requirement: 快照版本迁移至 v5（标注绝对 Y）

工作区快照 SHALL 携带 `version` 字段，当前版本为 `5`。`BraceAnnotation` SHALL 以 `y: number`（绝对数据 Y）字段作为纵向位置唯一来源；v5 干净格式 SHALL NOT 包含 `yOffset`。恢复时 SHALL 根据 `version` 执行迁移：当 `version < 5` 时，对缺失 `y` 的 brace（v4 以像素级 `yOffset` 相对 `braceY`）与缺失 `y` 的点标签（v1–v3 以 `yOffset` 相对顶曲线）SHALL 在过渡期随对象携带 legacy `yOffset` 并设 `y` 占位（非立即有损丢弃）。SHALL 在首次图表渲染（`chartDims` 与 Y 轴就绪后）经共享纯函数 `migrateLegacyPixelOffset(basePixel, yOffset, convertPixelToY)`（= `convertPixelToY(basePixel + yOffset)`）计算绝对数据 Y：brace 基线像素 SHALL 为 `braceY`，点标签基线像素 SHALL 为 `getTopCurvePixelYAtX(pl.x, ctx, convertYToPixel)`。迁移后 SHALL 剥离 `yOffset`、写入 `y` 并持久化为 v5 干净格式。当 `version < 4` 时，SHALL 先执行 v3→v4 缩放迁移，再执行 v4→v5 标注绝对 Y 迁移。

#### Scenario: v4 快照迁移到 v5（brace）

- **WHEN** 恢复 `version: 4` 且 brace 含 `yOffset: 20` 但无 `y` 字段的旧快照
- **THEN** 过渡期 brace 按 `braceY + 20` 渲染，首渲染迁移后 `y` 被设为 `convertPixelToY(braceY + 20)`，`yOffset` 被剥离，持久化为 v5 干净格式，可见位置不变

#### Scenario: v4 快照迁移到 v5（点标签机制对齐）

- **WHEN** 恢复含 legacy `yOffset` 点标签的旧快照
- **THEN** 点标签 SHALL 与 brace 经同一 `migrateLegacyPixelOffset` util 迁移（基线为顶曲线在该 X 处像素 Y），迁移后 `y` 为等效绝对数据 Y，`yOffset` 剥离

#### Scenario: v5 快照原样恢复

- **WHEN** 恢复 `version: 5` 的快照
- **THEN** 快照原样恢复，不执行标注绝对 Y 迁移

#### Scenario: 缺失 version 视为 v2

- **WHEN** 恢复不含 `version` 字段的旧快照
- **THEN** 视为 `version: 2` 先执行颜色迁移，再执行缩放迁移，最后执行标注绝对 Y 迁移
