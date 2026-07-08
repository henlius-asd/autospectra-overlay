## Why

当前曲线颜色选择器使用原生 `<input type="color">` 直接嵌入曲线列表行，其 `onChange` 事件（映射为 `input` 事件）在颜色选择器拖拽过程中持续触发 store 更新和 ECharts 重渲染，导致数千数据点的色谱曲线每次重绘造成明显卡顿。用户需要确认颜色后才应用，同时需要预设颜色和历史颜色加速选择。

## What Changes

- 移除直接嵌入曲线行的原生颜色选择器，替换为弹出式颜色面板（popover）
- 颜色面板包含预设颜色行（matplotlib tab10 11 色）、历史使用颜色行（最近 8 个）、"自定义..."按钮
- 单击预设/历史色块立即应用颜色并关闭面板；点击"自定义"打开原生选择器，仅在关闭时（`change` 事件）应用
- 新增 `colorHistory` 状态记录最近使用颜色，随工作区 JSON 持久化
- 面板外部点击自动关闭

## Capabilities

### New Capabilities
- `color-panel`: 弹出式颜色选择面板，包含预设颜色、历史颜色、自定义颜色入口，支持即时应用和延迟应用两种模式

### Modified Capabilities
- `state-management`: uiStore 新增 `colorHistory` 状态和 `addColorToHistory` action

## Impact

- **新建**: `src/components/data/ColorPanel.tsx` — 颜色面板组件
- **修改**: `src/components/data/CurveList.tsx` — 色块点击改为弹出面板，移除内嵌颜色选择器
- **修改**: `src/store/uiStore.ts` — 新增 `colorHistory` 状态
- **修改**: `src/components/toolbar/Toolbar.tsx` — 工作区 JSON 导出/导入包含 `colorHistory`