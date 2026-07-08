## Context

当前 `CurveList.tsx` 在每条曲线行内嵌 `<input type="color">`，通过 `opacity-0` 覆盖在色块上。React 的 `onChange` 绑定到原生的 `input` 事件，颜色选择器拖拽过程中持续触发 `setCurveColor` → Zustand store 更新 → ECharts `replaceMerge` 重绘，每次重绘处理数千数据点，造成明显卡顿。

约束：不走第三方 UI 库，仅使用 Tailwind CSS + 原生 DOM API。

## Goals / Non-Goals

**Goals:**
- 曲线颜色选择时无卡顿（仅在确认后应用颜色）
- 提供预设颜色（matplotlib tab10 11 色）快速选择
- 记录最近使用的 8 个颜色，方便重复使用
- 弹出式面板，保持 UI 整洁

**Non-Goals:**
- 不引入第三方颜色选择器库（如 react-color）
- 不改变颜色存储方式（仍为 `CurveData.color`）
- 不改变工作区 JSON 导出/导入的颜色字段结构

## Decisions

### 1. 延迟提交：原生 `change` 事件替代 React `onChange`

**选择**：通过 `useRef` 获取原生 input 元素，在 `useEffect` 中绑定原生 `change` 事件（选择器关闭时触发），而非 React `onChange`（`input` 事件）。

**替代方案**：
- *React `onBlur`*：部分浏览器在颜色选择器交互中不触发 blur
- *debounce onChange*：仅延迟执行，仍会触发多次渲染

**原理**：原生 `<input type="color">` 的 `change` 事件仅在用户关闭选择器时触发，拖拽过程中不触发。`useEffect` 中通过 `addEventListener('change', ...)` 绑定，确保事件在正确的时机提交。

### 2. 预设 + 历史色块：纯 div 色块 + 单击事件

**选择**：预设颜色（11 个固定 hex 值）和最近 8 个历史颜色渲染为纯色 div，单击直接调用 `setCurveColor` + `addColorToHistory`。

**预设颜色**：matplotlib tab10 调色板（原项目 `CURVE_COLORS` 数组）：
```
#1f77b4, #ff7f0e, #2ca02c, #d62728, #9467bd, #8c564b, #e377c2, #7f7f7f, #bcbd22, #17becf, #000000
```

**替代方案**：
- *仅预设颜色*：无历史记录，用户重复选择同一颜色需多次操作
- *仅原生选择器*：当前方案，卡顿

### 3. 面板定位：fixed 定位，跟随触发色块

**选择**：面板使用 `position: fixed`，根据触发色块的 `getBoundingClientRect()` 计算位置，显示在色块下方或上方（避免溢出视口）。面板外部点击通过 document `mousedown` 事件监听关闭。

**替代方案**：
- *Portal*：过度设计，面板仅在曲线列表内使用
- *absolute 定位*：受父容器 overflow 限制

### 4. 历史颜色存储：uiStore 中独立数组

**选择**：`colorHistory: string[]` 存储在 `uiStore` 中（非 zundo 管理），最多 8 个，新颜色插入头部，去重。工作区 JSON 导出/导入包含此字段。

**替代方案**：
- *localStorage*：跨会话持久化，但工作区导入时无法恢复状态
- *curveStore 中存储*：应由 zundo 管理，但颜色历史不是曲线数据

## Risks / Trade-offs

- **[风险] 颜色面板在极端曲线列表滚动时定位偏移** → **缓解**：面板使用 `fixed` 定位，基于 `getBoundingClientRect()` 计算，不受滚动影响
- **[风险] 原生颜色选择器在不同浏览器中行为差异** → **缓解**：`change` 事件在所有主流浏览器中一致（关闭时触发）
- **[权衡] 预设颜色限 11 个** → 覆盖 tab10 色谱，满足常见需求；自定义颜色通过原生选择器补充