## 1. 修复弹窗交互 bug

- [x] 1.1 重构 `src/components/chart/BraceOverlay.tsx` 的 JSX 结构：将组件 return 改为 React Fragment，包含两个子元素：(1) `pointerEvents: 'none'` 的 wrapper div 只包裹 SVG，(2) 弹窗 div 独立渲染在 Fragment 的顶层（不在 `pointerEvents: 'none'` 容器内）
- [x] 1.2 验证 `npx tsc --noEmit` 通过，启动 dev server 手动测试区间标签放置流程（拖拽 → 输入标签 → 点击确认 → 保存成功）
