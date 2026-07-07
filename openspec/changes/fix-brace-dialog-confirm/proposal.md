## Why

区间标签（原"大括号"）放置后，弹窗输入标签名后无法点击"确认"按钮完成放置。用户能正常看到弹窗并在输入框中输入文字，但确认按钮无响应。此 bug 由 `fix(interaction-fixes)` commit `d8ae680` 引入：为解决 dataZoom 滑条被遮挡问题，给 BraceOverlay 的 wrapper div 添加了 `pointerEvents: 'none'`，导致弹窗虽然自身设置了 `pointerEvents: 'auto'`，但按钮点击事件可能无法正确传递。

## What Changes

- 重构 BraceOverlay 组件的 JSX 结构，将弹窗从 `pointerEvents: 'none'` 的 wrapper div 中提取出来，渲染在与 SVG 同级的独立 absolute 容器中
- 确保弹窗的 `pointerEvents: 'auto'` 不受任何父级 `pointerEvents: 'none'` 影响
- 保持 dataZoom 滑条的修复（SVG 在非放置模式下为 `pointerEvents: 'none'`）

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `brace-tool`: 修复弹窗交互 bug — 将弹窗从 `pointerEvents: none` 容器中移出，确保按钮点击可正常触发

## Impact

- **组件修改**: `src/components/chart/BraceOverlay.tsx` — 重构 JSX 结构，将弹窗移到 wrapper div 之外
- **无数据结构变更**: 不改变 BraceAnnotation 类型或 store 逻辑
- **无导出影响**: 导出逻辑不涉及弹窗渲染
