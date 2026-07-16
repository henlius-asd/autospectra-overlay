## Why

固定宽度三栏布局在 1366px 宽度下中栏严重不足。需引入弹性宽度 + 桌面断点自动折叠 + 图表边距自适应，在 1366-1920px+ 桌面端范围内提供流畅的自适应体验。

## What Changes

- 左右面板从固定宽度改为弹性宽度（百分比 + min/max 约束）
- 桌面断点自动折叠：< 1280px 折叠右栏，< 1024px 折叠左栏
- 折叠态面板展开为 overlay（absolute 定位，不挤压中栏）
- 用户手动操作优先于自动折叠
- 图表边距根据 chartDims.width 动态计算

## Impact

- `src/components/layout/ThreeColumnLayout.tsx` — 新增 resize 监听、auto-collapse 逻辑、overlay 渲染
- `src/components/layout/LeftPanel.tsx` — 弹性宽度 + overlay 支持
- `src/components/layout/RightPanel.tsx` — 弹性宽度 + overlay 支持
- `src/components/chart/WaterfallChart.tsx` — 动态图表边距