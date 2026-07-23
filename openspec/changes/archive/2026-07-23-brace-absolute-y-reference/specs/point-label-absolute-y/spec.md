## MODIFIED Requirements

### Requirement: 旧格式标签迁移

导入或恢复旧工作区时，缺失 `y` 字段的点标签（旧格式使用相对顶曲线的像素 `yOffset`）SHALL NOT 有损丢弃为 `y: 0`，而 SHALL 与区间标签共用同一保位置迁移机制：过渡期随对象携带 legacy `yOffset`，并在首次图表渲染（几何就绪后）经共享 `migrateLegacyPixelOffset(basePixel, yOffset, convertPixelToY)` 计算绝对数据 Y，其中基线像素 `basePixel` SHALL 为 `getTopCurvePixelYAtX(pl.x, ctx, convertYToPixel)`（顶曲线在该标签 X 处的像素 Y）。迁移后 SHALL 剥离 `yOffset`、写入 `y` 并持久化。迁移 SHALL 保留用户原始可见位置。

#### Scenario: 导入旧格式工作区保位置

- **WHEN** 导入包含 `yOffset` 但无 `y` 字段的点标签的旧工作区 JSON
- **THEN** 过渡期标签按旧公式（顶曲线基线 + `yOffset`）渲染，首渲染迁移后 `y` 被设为等效绝对数据 Y，可见位置不变，无报错

#### Scenario: 与区间标签迁移机制一致

- **WHEN** 旧格式点标签与旧格式区间标签同时存在于同一快照
- **THEN** 二者 SHALL 经同一共享 `migrateLegacyPixelOffset` util 迁移（仅基线像素不同），迁移行为完全一致
