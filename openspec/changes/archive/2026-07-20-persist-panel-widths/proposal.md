# Proposal: persist-panel-widths

## Why

Change 3（modernize-interaction-ux）引入了面板拖拽调宽，但当时设计决策"宽度不持久化"把用户主动偏好与 auto-collapse 的瞬态反应混为一谈。用户每次拖拽调整后刷新即丢失，需反复重拖——所有主流工具型应用（VSCode/Figma/Linear/DevTools）都持久化面板宽度。本变更修正该设计偏差。

## What Changes

- 面板宽度（leftWidth/rightWidth）持久化到 `localStorage`（key `autospectra:panel-widths`）
- `useState` 初始值从 localStorage 读取，读取时 clamp 到当前 MIN/MAX（跨屏幕尺寸安全）
- 拖拽结束时（mouseup）写入 localStorage，不在 mousemove 中写
- 移除 auto-collapse reset effect（折叠时不覆盖宽度偏好，展开后恢复持久化值）

## Capabilities

### Modified Capabilities

- `interaction-ux`: 面板拖拽调宽的持久化行为从"SHALL NOT 持久化"改为"SHALL 持久化到 localStorage"

## Impact

- **代码**：`src/components/layout/ThreeColumnLayout.tsx`（~15 行改动）
- **依赖**：无新增
- **兼容性**：localStorage key 为新增，旧用户首次读取无值时 fallback 到默认值，无破坏性
- **验收**：vitest + e2e 全绿；拖拽→刷新→宽度保持的验证
