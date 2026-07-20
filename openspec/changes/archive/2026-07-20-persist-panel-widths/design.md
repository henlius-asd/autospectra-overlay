# Design: persist-panel-widths

## Context

`ThreeColumnLayout.tsx` 的 `leftWidth`/`rightWidth` 是纯 React `useState`，刷新即失。第 50-53 行的 auto-collapse reset effect 在窗口缩窄时把宽度重置为默认值，进一步"洗掉"用户偏好。

## Decisions

### D1: localStorage 而非 IndexedDB

面板宽度是轻量偏好（两个数字）。项目 `src/persistence.ts` 的 IndexedDB 用于重量级工作区快照；HudShortcuts 已用 `localStorage` 存轻量偏好（`hasSeenShortcuts`）。面板宽度同类，走 localStorage，同步读取无异步开销。

### D2: 读取时 clamp

```ts
const stored = localStorage.getItem('autospectra:panel-widths');
const parsed = stored ? JSON.parse(stored) : {};
const left = clamp(parsed.left ?? LEFT_DEFAULT, LEFT_MIN, LEFT_MAX);
const right = clamp(parsed.right ?? RIGHT_DEFAULT, RIGHT_MIN, RIGHT_MAX);
```

跨屏幕尺寸安全：大屏拖到 400px 后换小屏，clamp 自动收紧到 MAX（若 MAX 仍适合小屏）或保持（MIN/MAX 本身就是安全范围）。

### D3: 仅 mouseup 写入

mousemove 已有 rAF 门控，写入 localStorage 也在 mouseup 一次性完成，避免拖拽期间频繁 IO。

### D4: 移除 auto-collapse reset effect

折叠（collapsed state 在 uiStore）时 width 状态无关——面板不渲染宽度。展开后 useState 保留的值即为持久化值（已 clamp）。auto-collapse 不再触碰 width 状态。

## Risks

- [localStorage 在隐私模式下可能抛异常] → try/catch 包裹读写，失败时静默 fallback 到默认值
- [JSON.parse 遇到脏数据] → try/catch，parse 失败 fallback 到默认值
