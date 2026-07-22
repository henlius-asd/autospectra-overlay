## Why

上一轮变更（`brace-style-free-position`）实现了括号形状更新和自由定位，但在实际使用中暴露出多个 UX 问题：
1. 区间标签放置时括号出现在默认顶部（`braceY`），而非用户按下的 Y 位置，预览虚影与最终位置不一致
2. 单击编辑标签容易在拖拽时误触编辑浮层
3. 括号和点标签的可拖拽区域太小（仅 2px 描边或文字本身），难以命中
4. 点标签靠近峰顶时位置跳跃——根因是 dataZoom 类型切换重置 zoom 范围，且标签 Y 依赖顶曲线位置
5. 点标签的 Y 值仍然依赖顶曲线（`yOffset` 相对顶曲线像素 Y），横向拖动时标签"骑"着曲线上下跳

## What Changes

- **区间标签放置定位**：放置时括号落在用户按下拖拽的像素 Y（`placementY - braceY` → `yOffset`），预览虚影同步使用 `placementY`
- **双击编辑**：区间标签和点标签从单击编辑改为双击编辑，拖拽时不再误弹编辑浮层
- **命中区域扩大**：括号路径加 16px 宽透明命中副本，点标签文本下方加透明矩形命中区，大幅提升拖拽成功率
- **dataZoom 修复**：非 select 模式下 dataZoom 从 `type: 'slider'`（会重置 zoom 范围）改为 `type: 'inside', disabled: true`（保留 zoom 范围），消除模式切换导致的标签跳跃
- **点标签 Y 解耦**：`PointLabel.yOffset`（相对顶曲线的像素偏移）→ `PointLabel.y`（绝对数据 Y 坐标），标签完全脱离任何曲线，只跟 y 轴绑定
- **拖动补偿**：点标签拖动时从鼠标像素 Y 直接反算数据 Y，不再参与 `baseY` 变化补偿

## Capabilities

### New Capabilities
- `label-hit-area`: 扩大的透明命中区域，提升括号和点标签的拖拽可操作性
- `point-label-absolute-y`: 点标签使用绝对数据 Y 坐标，完全脱离曲线依赖

### Modified Capabilities
- `brace-tool`: 放置时落在按下像素 Y；预览虚影同步；双击编辑
- `point-label-tool`: 双击编辑；绝对 Y 坐标；拖动像素→数据 Y 转换；旧格式迁移
- `label-free-positioning`: 新增命中区域和双击编辑需求

## Impact

- `src/types/pointLabel.ts` — `yOffset` → `y`（绝对数据 Y）
- `src/components/chart/PointLabelOverlay.tsx` — `convertYToPixel`/`convertPixelToY` 替代 `getLabelBaseYAtX`；双击编辑；命中区域；拖动反算
- `src/components/chart/BraceOverlay.tsx` — `placementY` 定位；预览 `placementY`；双击编辑；命中区域
- `src/components/chart/WaterfallChart.tsx` — 新增 `convertPixelToY`；移除 `getLabelBaseYAtX`；dataZoom `disabled: true` 修复
- `src/components/chart/exportImage.ts` — `yToPixelExport(pl.y)` 替代 `getTopCurvePixelYAtX + yOffset`
- `src/components/chart/exportPptx.ts` — 同上
- `src/persistence/index.ts` — 旧标签迁移（`yOffset` → `y: 0`）
- `src/store/__tests__/curveStore.test.ts` — 测试数据 `yOffset` → `y`