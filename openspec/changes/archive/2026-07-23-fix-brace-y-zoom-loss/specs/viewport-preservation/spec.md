# viewport-preservation Specification

## MODIFIED Requirements

### Requirement: 交互模式切换与空格平移时保持 dataZoom 视口

系统 SHALL 在任何 `interactionMode` 变更、以及 `spaceHeld` 翻转（非 `select` 模式下 A↔B 结构切换）之后，保持当前 X 轴（`xRange`）与 Y 轴（`yZoomRange`）的 dataZoom 视口不被重置回全量数据范围。由于这些过渡会翻转 dataZoom 的 `disabled` 字段（`true` ↔ `false`，保持 `type: 'inside'` 不变以避免组件重建和 zoom 范围重置），系统 SHALL 在 option 重渲染完成后、浏览器 paint 之前，通过 `useLayoutEffect` 中的同步 `dispatchAction` 将 store 中的 `xRange` 与 `yZoomRange` 重新应用到对应 dataZoom 组件（`xZoom`、`xZoomSlider`；`yZoom`、`yZoomSlider`），确保用户不看到中间的全量帧（无闪烁）。`useLayoutEffect` 在 `echarts-for-react` 的 `componentDidUpdate`（同步 `setOption`）之后、paint 之前执行，React effect 子→父顺序保证此时序。重派发 SHALL 在 `dispatchAction` 调用外包 `try-catch` 以抑制 HMR / React StrictMode 双调用期间的 `Instance has been disposed` 警告。Y dataZoom 的 `startValue`/`endValue` SHALL NOT 写入 option 配置（经 `dispatchAction` 恢复，遵循 `y-axis-zoom`）；`yZoomRange === null` 时 SHALL NOT 对 Y 执行 `dispatchAction`。该 effect 的依赖 SHALL 仅为 `[interactionMode, spaceHeld]`——SHALL NOT 包含 `xRange`/`yZoomRange`，以免在用户滚轮/滑块缩放期间触发重派发并覆盖 ECharts 内部状态（导致抖动）；重派发时 SHALL 通过 `useUiStore.getState()` 读取最新 `xRange`/`yZoomRange` 以避免闭包过期。`hasMountedViewport` ref SHALL 跳过首次挂载运行，避免与 `onChartReady` 的初始 Y `dispatchAction` 竞态。`disabled` 字段 SHALL 在每次 `setOption` 时由 option 配置显式发射（即使为 `false`），因 ECharts 按字段合并、省略 `disabled` 不清除旧值， brace→其他模式切换时若省略会残留 `disabled: true` 并静默吞掉滚轮/拖拽输入。

覆盖范围：`select` ↔ `brush` / `pointLabel` / `move` / `zoomGlobal` / `zoomCurve` 的任一方向切换，以及 `spaceHeld` 在非 `select` 模式下的翻转。`brace` 模式：进入 `brace` 时四个 dataZoom 组件（`xZoom`、`xZoomSlider`、`yZoom`、`yZoomSlider`）SHALL 全部保留（`id` 与 `type` 与 `select` 一致、不被 `replaceMerge` 销毁），仅将 `xZoom`、`yZoom`、`yZoomSlider` 设 `disabled: true` 冻结缩放交互、保留 `xZoomSlider` 可用；由此 ECharts 内部 `start/end` 不丢失，X 与 Y 视口在 `brace` 期间 SHALL 同时保持不坍塌。离开 `brace` 回到其他模式时，`disabled` 翻转回目标模式取值，X 与 Y 视口 SHALL 由 store 中的 `xRange`/`yZoomRange` 与保留的组件内部状态共同保持。

#### Scenario: 切换到框选放大保持 X/Y 视口

- **WHEN** 用户已通过 dataZoom 滑块缩放到 X∈[100, 200]、Y∈[50, 150]，随后点击「框选放大」工具
- **THEN** 切换到 `brush` 模式后，图表 dataZoom 视口仍为 X∈[100, 200]、Y∈[50, 150]，未回退到全量数据范围

#### Scenario: 再次点击工具回到 select 保持视口

- **WHEN** `interactionMode` 为 `brush` 且视口为 X∈[100, 200]，用户再次点击「框选放大」工具回到 `select`
- **THEN** 切换回 `select` 后视口仍为 X∈[100, 200]

#### Scenario: 切换到其他结构相同模式保持视口

- **WHEN** 用户已缩放到某 X/Y 视口，随后依次切换到 `move`、`zoomGlobal`、`zoomCurve`、`pointLabel`
- **THEN** 每次切换后视口均保持不变

#### Scenario: 按住/松开空格临时平移保持视口

- **WHEN** 用户在 `zoomGlobal` 模式下已缩放到某视口，按住空格临时平移（触发 `spaceHeld` 翻转）后松开
- **THEN** 空格按下与松开前后，视口均保持不变

#### Scenario: brace 进入与退出保持 X 与 Y 视口

- **WHEN** 用户已缩放到 X∈[100, 200]、Y∈[50, 150]，切换到 `brace` 放置区间标签，随后退出 `brace` 回到 `select`
- **THEN** `brace` 期间 X 视口保持 X∈[100, 200]、Y 视口保持 Y∈[50, 150]（四个 dataZoom 组件均保留、`disabled` 冻结交互但内部 `start/end` 不丢失），退出 `brace` 后 X 与 Y 视口恢复为 X∈[100, 200]、Y∈[50, 150]

#### Scenario: brace 期间滚轮与 Y slider 不改变 Y 视口

- **WHEN** 用户在 `brace` 模式下（Y 视口为 Y∈[50, 150]）尝试滚轮缩放 Y 轴或拖拽 `yZoomSlider`
- **THEN** Y 视口保持 Y∈[50, 150] 不变（`yZoom`/`yZoomSlider` `disabled: true` 冻结交互），X slider（`xZoomSlider`）仍可拖拽调整 X 视口

#### Scenario: 用户滚轮缩放期间不触发重派发

- **WHEN** 用户在 `select` 模式下连续滚轮缩放 X 轴（`xRange` 频繁变化）
- **THEN** 视口保持 effect 不重派发（依赖仅 `[interactionMode, spaceHeld]` 未变），ECharts 内部状态不被覆盖，缩放平滑无抖动

#### Scenario: 框选完成后既有 rAF 重派发不受影响

- **WHEN** 用户在 `brush` 模式完成一次框选（`handleBrushSelected` 设 `interactionMode='select'` 并调度其 rAF 重派发新选区）
- **THEN** 新选区范围被正确应用；新 `useLayoutEffect` 因 `interactionMode` 变化同步重派发，读取 store 中已更新的 `xRange`/`yZoomRange` 重派同值，不产生视口闪烁或回退

#### Scenario: HMR 或卸载期间无 disposed 警告

- **WHEN** 组件在 `useLayoutEffect` 的 `dispatchAction` 执行期间因 HMR 重挂载或卸载
- **THEN** `dispatchAction` 的 `try-catch` 吞掉 `Instance has been disposed`，控制台无警告
