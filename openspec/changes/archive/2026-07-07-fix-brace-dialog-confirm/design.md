## Context

BraceOverlay 组件当前结构：

```tsx
<div style={{ pointerEvents: 'none' }}>    // wrapper
  <svg style={{ pointerEvents: 'auto' | 'none' }}>  // SVG overlay
    {/* braces rendering */}
  </svg>
  {editingBrace && <div>...弹窗...</div>}   // dialog inside wrapper
</div>
```

问题：wrapper 的 `pointerEvents: 'none'` 可能干扰弹窗的交互，尽管弹窗自身设置了 `pointerEvents: 'auto'`。

## Goals / Non-Goals

**Goals:**
- 修复弹窗"确认"按钮无法点击的问题
- 保持 dataZoom 滑条可交互（不被 overlay 遮挡）

**Non-Goals:**
- 不改变弹窗的视觉样式
- 不改变放置模式的交互逻辑
- 不改变 BraceAnnotation 数据结构

## Decisions

### D1: 重构 JSX — 弹窗移到 wrapper 外

**选择**: 将组件的 return 改为一个 React Fragment 或父 div，包含两个子元素：
1. SVG wrapper div（`pointerEvents: 'none'`，包含 SVG 和 drag preview）
2. 弹窗 div（独立的 `position: absolute`，不在 `pointerEvents: 'none'` 容器内）

```tsx
return (
  <>
    <div className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      <svg ...>...</svg>
    </div>
    {editingBrace && <div className="absolute ...">...弹窗...</div>}
  </>
);
```

**理由**: 弹窗不再被任何 `pointerEvents: 'none'` 的父元素包裹，彻底消除 pointer-events 继承问题。同时 SVG wrapper 的 `pointerEvents: 'none'` 继续保证 dataZoom 滑条可交互。

## Risks / Trade-offs

- **[R1] Fragment 返回多根节点** → React 要求父组件能处理 Fragment。当前 BraceOverlay 的父组件 WaterfallChart 的 JSX 中 BraceOverlay 是一个独立的子元素，Fragment 返回不会有问题。
- **[R2] 弹窗定位可能偏移** → 弹窗使用 `absolute` 定位，其 `top/left` 基于最近的 positioned ancestor（即 WaterfallChart 的 `relative` div），与原结构一致，不会偏移。
