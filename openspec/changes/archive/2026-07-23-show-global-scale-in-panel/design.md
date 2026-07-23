## Context

「自动叠图」面板内的「缩放」分区（`AlignmentControls.tsx` 中 `border-t` 分隔的缩放控制区）当前标题仅显示文字"缩放"。`globalScale` 值仅在图表区域以 badge 形式展示（`scale-slider` spec 已覆盖），用户在面板内操作归一化/重置时缺少当前缩放状态的上下文。

## Goals / Non-Goals

**Goals:**
- 在「缩放」分区标题旁实时显示 `globalScale` 值

**Non-Goals:**
- 不改变图表区域 badge 的显示逻辑
- 不在面板内添加缩放交互控件（滚轮缩放仍在图表区域操作）
- 不显示单曲线 `curveScales` 值（仅在图表 badge 中显示复合倍率）

## Decisions

### 决策 1：显示格式 `×{value}`

**选择：** 在「缩放」标题右侧以 `×1.0`、`×1.5` 格式显示，使用 `globalScale.toFixed(1)`。

**理由：** 与图表 badge 的 `×{globalScale}` 格式一致，用户在面板和图表看到同样的表达方式，无需心智转换。保留 1 位小数与 badge 一致。

### 决策 2：始终显示，不隐藏默认值

**选择：** `globalScale` 为 1 时显示 `×1.0`，不隐藏。

**理由：** 用户需要确认"当前没有缩放"这一信息，隐藏会让用户不确定是没有缩放还是显示出了问题。保持一致可见性。

### 决策 3：订阅 store 实时更新

**选择：** 通过 `useCurveStore((s) => s.globalScale)` 订阅，组件自动 re-render。

**理由：** Zustand 的 selector 订阅是最简实现，无需额外 effect 或手动同步。

## Risks / Trade-offs

- **[权衡] 面板内显示与图表 badge 重复** → 两者场景不同：badge 在操作缩放时可见，面板内显示在操作归一化/重置时可见，互补而非冗余
