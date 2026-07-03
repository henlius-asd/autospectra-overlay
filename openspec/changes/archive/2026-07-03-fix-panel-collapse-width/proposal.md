## Why

左右栏折叠/展开使用 `transition-all` CSS 类，导致面板在折叠后再展开时宽度无法正确恢复到 240px/320px，出现面板变窄的 bug。`transition-all` 同时过渡了 `width` 和 `height` 等多个属性，在 flex 布局中这些属性的动画互相干扰，加上缺少 `shrink-0` 导致 flex-shrink 在过渡期间压缩面板宽度。

## What Changes

- 将 LeftPanel 和 RightPanel 的 `transition-all` 替换为 `transition-[width]`，仅对宽度变化做过渡动画
- 给 LeftPanel 和 RightPanel 添加 `shrink-0`，防止 flex 布局在过渡期间压缩面板宽度

## Capabilities

### New Capabilities
<!-- No new capabilities introduced -->

### Modified Capabilities
- `three-column-layout`: 修改折叠/展开过渡动画的实现方式，从 `transition-all` 改为 `transition-[width]`，并添加 `shrink-0` 约束。需求层面不改变行为规格（仍要求 CSS transition 动画过渡），但修正了实现细节以确保过渡正确完成。

## Impact

- Affected code: `src/components/layout/LeftPanel.tsx`, `src/components/layout/RightPanel.tsx`
- No API or dependency changes
- No breaking changes — 用户可见行为不变，仅修复 bug