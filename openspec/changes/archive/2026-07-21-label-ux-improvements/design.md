## Context

上一轮变更实现了括号形状更新和自由定位，但实际使用中暴露了多个 UX 问题。本轮变更聚焦于交互体验打磨：命中区域、编辑触发方式、放置定位精度、dataZoom 稳定性、点标签 Y 解耦。

## Goals / Non-Goals

**Goals:**
- 扩大括号和点标签的拖拽命中区域，降低"脱手"概率
- 双击编辑替代单击编辑，消除拖拽误触
- 区间标签放置时落在用户按下的像素 Y，预览虚影同步
- 消除 dataZoom 类型切换导致的 zoom 范围重置（标签跳跃根因）
- 点标签 Y 完全脱离曲线依赖，改为绝对数据 Y 坐标

**Non-Goals:**
- 不改变 labelStyle 样式系统
- 不改变 brace 形状（已在上轮敲定）
- 不改变撤销/重做逻辑

## Decisions

### 1. 命中区域：透明路径/矩形叠加

**选型**：在可见元素下层添加 `fill="transparent"` 或 `stroke="transparent"` 的命中区域。括号用 16px 宽透明描边路径，点标签用透明矩形（`textW + 8px` × `fontSize * 1.4`）。`onPointerDown` 绑定在 `<g>` 上，命中区域接收 `onDoubleClick`。

**替代方案**：增大 `strokeWidth` 或 `fontSize`——会改变视觉效果，不可接受。

### 2. 双击编辑

**选型**：所有标签和命中区域的 `onClick` → `onDoubleClick`。拖拽位移阈值检查保留（`dragMovedRef`）但双击场景下自动重置。编辑浮层内按钮保留 `onClick`。

**替代方案**：右键菜单编辑——需要额外 UI，复杂度高。

### 3. 区间标签放置定位

**选型**：`handlePointerDown` 记录 `placementY = e.clientY - rect.top`，`handlePointerUp` 计算 `yOffset = placementY - braceY`。预览虚影 `bracePath(previewLeft, previewRight, placementY ?? braceY)`。

**替代方案**：拖拽过程中实时更新预览 Y——但括号放置是水平拖拽，Y 不变更合理。

### 4. dataZoom `disabled: true` 替代类型切换

**选型**：非 select 模式下，dataZoom 从 `{ type: 'slider', show: false }` 改为 `{ type: 'inside', disabled: true }`。ECharts 在 dataZoom 类型变更时重建组件并重置 zoom 范围（`start`/`end`），导致 `convertYToPixel`（用存储的 `yZoomRange`）与图表实际渲染范围不一致。保持 `type: 'inside'` 不变+ `disabled: true` 既阻止用户交互，又保留 zoom 范围。

**替代方案**：在模式切换后手动恢复 zoom——时序脆弱，ECharts 异步 datazoom 事件不可靠。

### 5. 点标签绝对 Y 坐标

**选型**：`PointLabel.yOffset`（相对顶曲线像素 Y 的偏移）→ `PointLabel.y`（绝对数据 Y 坐标）。放置时 `y = convertPixelToY(py)`，渲染时 `py = convertYToPixel(pl.y)`，拖动时 `y = convertPixelToY(origPixelY + dy)`。旧快照中缺失 `y` 的标签迁移为 `y: 0`（用户可重拖）。

**替代方案**：保持 `yOffset` 但补偿 `baseY` 变化——已在拖动中实现，但无法解决"标签骑曲线"的根因。用户明确要求完全脱离曲线。

### 6. xZoom 同步修复

**选型**：xZoom 也使用 `disabled: true` 替代 `type: 'slider'`，保持一致性。两种 dataZoom 的行为问题相同。

## Risks / Trade-offs

- **[Risk] 旧快照标签 `y: 0` 可能被放置在图表底部** → **Mitigation**: 用户可拖拽到正确位置；旧标签数量少，影响可控。
- **[Risk] `disabled: true` 在 ECharts 6.1.0 中可用，但未来版本可能变更** → **Mitigation**: ECharts 6.x 文档确认支持；如有变更，测试可捕获。
- **[Risk] 双击编辑在移动端可能不友好** → **Mitigation**: 本项目为桌面端工具，双击是标准桌面交互。