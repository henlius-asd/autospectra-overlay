## REMOVED Requirements

### Requirement: 基准线 ★ 标识

**Reason**: 用户反馈 ★ 星标对判断无帮助，基准线的概念已在 store 的 stagingOrder 层级逻辑中体现，UI 上不需要额外视觉标识。

**Migration**: 删除 CurveList.tsx 中 `isBaseline` 相关的 ★ 渲染代码（第 189-191 行）。store 中 `baselineId` 逻辑保持不变（仍用于层级计算），仅移除 UI 显示。
