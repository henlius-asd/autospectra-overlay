## MODIFIED Requirements

### Requirement: 点标签贴近曲线放置

点标签 SHALL 以最高曲线（staging 顺序最顶曲线）在标签 X 位置处的实际像素 y 为纵向基线。标签 SHALL 落在用户点击的像素 Y 位置，系统 SHALL 计算 `yOffset = 点击像素Y - 基线Y` 作为纵向偏移。点标签 SHALL NOT 使用固定默认偏移（如 `yOffset = -10`）。

#### Scenario: 新建点标签默认落在点击位置

- **WHEN** 用户在放置模式下于某 X 位置点击某像素 Y 处创建一个点标签并确认标签文字
- **THEN** 该标签渲染在点击的像素 Y 位置，而非顶曲线 Y-10 处

#### Scenario: 多曲线分层时基线跟随最高曲线

- **WHEN** 图表中有多条可见曲线且 layerSpacing > 0
- **THEN** 点标签的纵向基线为最顶曲线（`visibleIds[0]`）在该 X 处的渲染像素 y（含该层 layerYOffset 与 offset.yOffset），`yOffset` 为点击位置与基线的差值

## REMOVED Requirements

### Requirement: 点标签完整显示在绘图区内

**Reason**: 用户要求区间标签和点标签完全自由放置，不受 grid 边界约束。标签 clamp 限制（`clampLabelX`/`clampLabelY`）已被移除，标签可放置在画布任意位置。

**Migration**: 已有标签位置不变。移除 clamp 后，标签不再被强制拉回 grid 内——如果标签之前被 clamp 推到边界内，现在会渲染在原始计算位置。用户可通过拖拽自由调整。